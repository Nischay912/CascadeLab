import React, { useEffect, useState } from 'react';

interface ResilienceRingProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export const ResilienceRing: React.FC<ResilienceRingProps> = ({
  score,
  size = 44,
  strokeWidth = 3.5,
  showLabel = true,
}) => {
  const [displayScore, setDisplayScore] = useState(score);

  // Animate score number smoothly when it changes
  useEffect(() => {
    let start = displayScore;
    const end = Math.max(0, Math.min(100, Math.round(score)));
    if (start === end) return;

    const duration = 600; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplayScore(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const handle = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(handle);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, displayScore));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Determine color based on resilience score
  const getColor = (s: number) => {
    if (s >= 80) return '#10B981'; // status.healthy
    if (s >= 50) return '#F59E0B'; // status.degraded
    return '#EF4444'; // status.failing
  };

  const ringColor = getColor(clampedScore);

  return (
    <div
      data-testid="resilience-ring"
      className="flex items-center gap-2 group cursor-pointer flex-shrink-0"
      title={`Headline Score: Chaos Suite Resilience = ${clampedScore}/100\nComputed across the full chaos failure matrix (node outages, latency spikes, retry storms, AZ loss).`}
    >
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1F2A44"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-xs font-bold font-mono tabular-nums transition-colors duration-300"
            style={{ color: ringColor }}
          >
            {clampedScore}
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="hidden min-[1680px]:flex flex-col text-left whitespace-nowrap">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold font-mono leading-tight">
            Chaos Suite
          </span>
          <span
            className="text-xs font-bold capitalize transition-colors duration-300 leading-tight"
            style={{ color: ringColor }}
          >
            Resilience
          </span>
        </div>
      )}
    </div>
  );
};
