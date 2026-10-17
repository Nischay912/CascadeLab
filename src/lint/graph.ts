import { ArchitectureSpec } from '../schema/architecture';

/**
 * Finds all articulation points (cut vertices) in the service dependency graph
 * using Hopcroft-Tarjan DFS algorithm.
 * A node is an articulation point if removing it disconnects components.
 */
export function findArticulationPoints(spec: ArchitectureSpec): string[] {
  const serviceIds = spec.services.map((s) => s.id);
  const adj = new Map<string, Set<string>>();

  serviceIds.forEach((id) => adj.set(id, new Set()));

  // Build undirected connectivity for structural articulation analysis
  spec.edges.forEach((edge) => {
    adj.get(edge.from)?.add(edge.to);
    adj.get(edge.to)?.add(edge.from);
  });

  const visited = new Set<string>();
  const tin = new Map<string, number>();
  const low = new Map<string, number>();
  const isArticulation = new Set<string>();
  let timer = 0;

  function dfs(u: string, p: string | null = null) {
    visited.add(u);
    tin.set(u, timer);
    low.set(u, timer);
    timer++;
    let children = 0;

    const neighbors = adj.get(u) || new Set();
    for (const v of neighbors) {
      if (v === p) continue;
      if (visited.has(v)) {
        low.set(u, Math.min(low.get(u)!, tin.get(v)!));
      } else {
        dfs(v, u);
        low.set(u, Math.min(low.get(u)!, low.get(v)!));
        if (low.get(v)! >= tin.get(u)! && p !== null) {
          isArticulation.add(u);
        }
        children++;
      }
    }

    if (p === null && children > 1) {
      isArticulation.add(u);
    }
  }

  // Run DFS from all unvisited components
  for (const id of serviceIds) {
    if (!visited.has(id)) {
      dfs(id);
    }
  }

  return Array.from(isArticulation);
}

/**
 * Detects cyclic dependencies among synchronous edges using DFS cycle detection.
 * Returns an array of cycles (each cycle is an array of node IDs).
 */
export function detectSyncCycles(spec: ArchitectureSpec): string[][] {
  const syncEdges = spec.edges.filter((e) => e.mode === 'sync');
  const adj = new Map<string, string[]>();

  spec.services.forEach((s) => adj.set(s.id, []));
  syncEdges.forEach((e) => {
    adj.get(e.from)?.push(e.to);
  });

  const state = new Map<string, 'unvisited' | 'visiting' | 'visited'>();
  spec.services.forEach((s) => state.set(s.id, 'unvisited'));

  const cycles: string[][] = [];
  const currentPath: string[] = [];

  function dfs(u: string) {
    state.set(u, 'visiting');
    currentPath.push(u);

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (state.get(v) === 'visiting') {
        // Cycle detected: extract subpath from v to u
        const cycleStartIndex = currentPath.indexOf(v);
        if (cycleStartIndex !== -1) {
          cycles.push([...currentPath.slice(cycleStartIndex), v]);
        }
      } else if (state.get(v) === 'unvisited') {
        dfs(v);
      }
    }

    currentPath.pop();
    state.set(u, 'visited');
  }

  for (const s of spec.services) {
    if (state.get(s.id) === 'unvisited') {
      dfs(s.id);
    }
  }

  return cycles;
}

export interface AmplificationPath {
  path: string[];
  amplification: number;
}

/**
 * Finds all synchronous call paths where the geometric retry depth amplification
 * exceeds the specified threshold (default > 8).
 * Amplification along path = Product_{e in path} (1 + retries_e).
 */
export function findRetryAmplificationPaths(
  spec: ArchitectureSpec,
  threshold = 8
): AmplificationPath[] {
  const syncEdges = spec.edges.filter((e) => e.mode === 'sync');
  const adj = new Map<string, Array<{ to: string; retries: number }>>();

  spec.services.forEach((s) => adj.set(s.id, []));
  syncEdges.forEach((e) => {
    adj.get(e.from)?.push({ to: e.to, retries: e.retries || 0 });
  });

  const entryServices = spec.services.filter((s) => s.entry).map((s) => s.id);
  const results: AmplificationPath[] = [];

  function traverse(
    curr: string,
    currentPath: string[],
    currentMultiplier: number,
    visited: Set<string>
  ) {
    if (currentMultiplier > threshold && currentPath.length > 2) {
      results.push({
        path: [...currentPath],
        amplification: currentMultiplier,
      });
    }

    const neighbors = adj.get(curr) || [];
    for (const edge of neighbors) {
      if (visited.has(edge.to)) continue; // Avoid cycles

      const nextMultiplier = currentMultiplier * (1 + edge.retries);
      visited.add(edge.to);
      currentPath.push(edge.to);

      traverse(edge.to, currentPath, nextMultiplier, visited);

      currentPath.pop();
      visited.delete(edge.to);
    }
  }

  const startingNodes = entryServices.length > 0 ? entryServices : spec.services.map((s) => s.id);

  for (const entryId of startingNodes) {
    const visited = new Set<string>([entryId]);
    traverse(entryId, [entryId], 1, visited);
  }

  return results;
}

export interface TimeoutInversionFinding {
  caller: string;
  callee: string;
  callerTimeout: number;
  calleeRequiredTime: number;
  reason: string;
}

/**
 * Finds timeout inversions where caller timeout < callee worst-case processing time.
 */
export function findTimeoutInversions(spec: ArchitectureSpec): TimeoutInversionFinding[] {
  const syncEdges = spec.edges.filter((e) => e.mode === 'sync');
  const findings: TimeoutInversionFinding[] = [];

  const serviceMap = new Map<string, (typeof spec.services)[0]>();
  spec.services.forEach((s) => serviceMap.set(s.id, s));

  for (const edge of syncEdges) {
    const callee = serviceMap.get(edge.to);
    if (!callee) continue;

    // Find downstream synchronous dependencies of callee
    const downstreamSync = spec.edges.filter(
      (e) => e.from === edge.to && e.mode === 'sync'
    );

    for (const downEdge of downstreamSync) {
      if (downEdge.critical) {
        const calleeRequiredTime = downEdge.timeout_ms + callee.service_time_ms;
        if (edge.timeout_ms < calleeRequiredTime) {
          findings.push({
            caller: edge.from,
            callee: edge.to,
            callerTimeout: edge.timeout_ms,
            calleeRequiredTime,
            reason: `Caller '${edge.from}' timeout (${edge.timeout_ms}ms) is less than callee '${edge.to}' downstream dependency '${downEdge.to}' budget (${calleeRequiredTime}ms).`,
          });
          break;
        }
      }
    }
  }

  return findings;
}
