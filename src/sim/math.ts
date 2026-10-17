/**
 * Mathematical formulas for queuing theory, retry geometric series, and latency tails.
 */

/**
 * Calculates the expected number of attempts per call given attempt failure probability f and max retries R.
 * Formula: sum_{k=0..R} f^k = (1 - f^(R+1)) / (1 - f).
 * Edge cases: R=0 => 1. f -> 1 => R + 1.
 */
export function calculateExpectedAttempts(f: number, maxRetries: number): number {
  if (maxRetries <= 0) return 1;
  const clampedF = Math.max(0, Math.min(0.9999, f));

  if (Math.abs(1 - clampedF) < 1e-6) {
    return maxRetries + 1;
  }
  return (1 - Math.pow(clampedF, maxRetries + 1)) / (1 - clampedF);
}

/**
 * Sakasegawa M/M/c approximation for mean system time W (ms).
 * For rho < 0.98:
 *   W = S_eff * (1 + rho^(sqrt(2*(m+1)) - 1) / (m * (1 - rho)))
 * For rho >= 0.98:
 *   W = S_eff + (queue / mu) * 1000
 */
export function sakasegawaMeanLatencyMs(
  serviceEffectiveMs: number,
  servers: number,
  rho: number,
  queueCount: number = 0,
  capacityRps: number = 1
): number {
  const m = Math.max(1, servers);
  const S_eff = Math.max(0.1, serviceEffectiveMs);
  const clampedRho = Math.max(0.001, rho);

  if (clampedRho < 0.98) {
    const power = Math.sqrt(2 * (m + 1)) - 1;
    const factor = Math.pow(clampedRho, power) / (m * (1 - clampedRho));
    return S_eff * (1 + factor);
  } else {
    // Backlog-based queuing delay
    const safeCapacity = Math.max(capacityRps, 0.1);
    const queueDelayMs = (queueCount / safeCapacity) * 1000;
    return S_eff + queueDelayMs;
  }
}

/**
 * Exact Erlang-C formula for M/M/c queue.
 * Used for analytical validation against Sakasegawa approximation (Test T3).
 * lambda: arrival rate (req/s)
 * muSingle: service rate of a single server (req/s) = 1000 / service_time_ms
 * c: number of servers (m)
 * returns: mean total system time W in ms (W = Wq + 1/muSingle)
 */
export function exactErlangCMeanLatencyMs(
  lambda: number,
  serviceSingleMs: number,
  c: number
): number {
  const mu = 1000 / serviceSingleMs; // req/s per server
  const A = lambda / mu; // traffic intensity (Erlangs)
  const rho = A / c; // server utilisation

  if (rho >= 1.0) {
    return Infinity; // unstable queue
  }

  // Calculate P0 (probability that system is empty)
  let sum = 0;
  let term = 1; // A^0 / 0!
  sum += term;

  for (let k = 1; k < c; k++) {
    term *= A / k;
    sum += term;
  }

  // term for k = c
  const termC = (term * A) / c;
  const p0 = 1 / (sum + termC / (1 - rho));

  // Erlang C probability of queuing: P(delay > 0)
  const Pc = (termC / (1 - rho)) * p0;

  // Mean queue waiting time Wq in seconds
  const WqSec = Pc / (c * mu - lambda);

  // Total system time W = Wq + 1/mu in milliseconds
  const W_ms = (WqSec + 1 / mu) * 1000;
  return W_ms;
}

/**
 * Little's Law: L = lambda * W
 * Checks steady-state queueing inventory conservation.
 */
export function littlesLawNumberInSystem(lambdaRps: number, latencyMs: number): number {
  const latencySec = latencyMs / 1000;
  return lambdaRps * latencySec;
}

/**
 * Exponential tail latency approximations from mean latency W.
 */
export function estimateTailLatenciesMs(meanLatencyMs: number): {
  p50: number;
  p95: number;
  p99: number;
} {
  const W = Math.max(0.1, meanLatencyMs);
  return {
    p50: W * Math.LN2, // W * ln(2) ~ 0.693 * W
    p95: W * Math.log(20), // W * ln(20) ~ 2.996 * W
    p99: W * Math.log(100), // W * ln(100) ~ 4.605 * W
  };
}
