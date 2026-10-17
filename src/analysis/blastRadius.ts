import { ArchitectureSpec } from '../schema/architecture';
import { SimulationTickMetrics } from '../sim/engine';
import { BlastRadiusReport, IncidentChronologyEvent, ServiceOnset } from './types';

/**
 * Calculates the total system blast radius, financial impact, time-to-detect,
 * and time-to-recover across the scenario history.
 */
export function calculateBlastRadius(
  spec: ArchitectureSpec,
  history: SimulationTickMetrics[],
  onsets: Map<string, ServiceOnset>
): BlastRadiusReport {
  const totalServices = spec.services.length;
  const degradedServices = Array.from(onsets.keys());
  const degradedPercentage =
    totalServices > 0 ? (degradedServices.length / totalServices) * 100 : 0;

  let peakAmplification = 1.0;
  let totalMoneyLostInr = 0;

  for (const tick of history) {
    if (tick.amplification > peakAmplification) {
      peakAmplification = tick.amplification;
    }
  }

  if (history.length > 0) {
    totalMoneyLostInr = history[history.length - 1].cumulativeMoneyLostInr;
  }

  // Calculate Time-to-Detect (TTD): from earliest fault start to first degradation
  let firstFaultStart = -1;
  for (const f of spec.faults) {
    if (firstFaultStart === -1 || f.start_s < firstFaultStart) {
      firstFaultStart = f.start_s;
    }
  }

  let earliestOnset = 180;
  for (const onset of onsets.values()) {
    if (onset.time < earliestOnset) {
      earliestOnset = onset.time;
    }
  }

  const timeToDetectS =
    firstFaultStart >= 0 ? Math.max(0, earliestOnset - firstFaultStart) : 0;

  // Calculate Time-to-Recover (TTR): from fault end until system success >= 98%
  let latestFaultEnd = -1;
  for (const f of spec.faults) {
    if (f.end_s > latestFaultEnd) {
      latestFaultEnd = f.end_s;
    }
  }

  let timeToRecoverS: number | null = null;
  let isMetastable = false;

  if (latestFaultEnd > 0) {
    let recoveredAt = -1;
    for (const tick of history) {
      if (tick.t > latestFaultEnd && tick.userSuccessRate >= 98.0) {
        recoveredAt = tick.t;
        break;
      }
    }

    if (recoveredAt > 0) {
      timeToRecoverS = recoveredAt - latestFaultEnd;
    } else {
      // Never recovered before simulation end -> Metastable
      isMetastable = true;
      timeToRecoverS = null;
    }
  }

  return {
    totalServices,
    degradedServices,
    degradedPercentage: Math.round(degradedPercentage),
    peakAmplification,
    totalMoneyLostInr,
    timeToDetectS,
    timeToRecoverS,
    isMetastable,
  };
}

/**
 * Builds a chronological sequence of landmark incident events.
 */
export function buildIncidentChronology(
  spec: ArchitectureSpec,
  history: SimulationTickMetrics[],
  onsets: Map<string, ServiceOnset>
): IncidentChronologyEvent[] {
  const events: IncidentChronologyEvent[] = [];

  // 1. Fault Start Events
  spec.faults.forEach((fault) => {
    events.push({
      time: fault.start_s,
      serviceId: fault.target,
      eventType: 'onset',
      description: `Injected fault '${fault.type}' triggered on target '${fault.target}'.`,
    });
  });

  // 2. Service Onsets in chronological order
  const sortedOnsets = Array.from(onsets.values()).sort((a, b) => a.time - b.time);
  sortedOnsets.forEach((onset) => {
    events.push({
      time: onset.time,
      serviceId: onset.serviceId,
      eventType: 'onset',
      description: `Service '${onset.serviceId}' degraded: ${onset.metric} shifted to ${Math.round(onset.value)}.`,
    });
  });

  // 3. Significant Queue Overflows & Crashes
  const reportedCrashes = new Set<string>();
  for (const tick of history) {
    for (const [svcId, state] of Object.entries(tick.services)) {
      if (state.instancesCrashed > 0 && !reportedCrashes.has(svcId)) {
        reportedCrashes.add(svcId);
        events.push({
          time: tick.t,
          serviceId: svcId,
          eventType: 'crash',
          description: `Instance on '${svcId}' crashed under worker overload.`,
        });
      }
    }
  }

  // 4. Fault End Events
  spec.faults.forEach((fault) => {
    events.push({
      time: fault.end_s,
      serviceId: fault.target,
      eventType: 'recovery',
      description: `Injected fault on target '${fault.target}' terminated.`,
    });
  });

  // Sort all events by timestamp
  return events.sort((a, b) => a.time - b.time);
}
