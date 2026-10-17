import React from 'react';

interface ResilienceRingProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export const ResilienceRing: React.FC<ResilienceRingProps> = ({
  score,
  size = 46,
  strokeWidth = 4,
  showLabel = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Determine color based on resilience score
  const getColor = (s: number) => {
    if (s >= 80) return '#34D399'; // status.healthy
    if (s >= 50) return '#FBBF24'; // status.degraded
    return '#F87171'; // status.failing
  };

  const ringColor = getColor(clampedScore);

  return (
    <div className="flex items-center gap-2 group cursor-pointer" title={`Resilience Score: ${clampedScore}/100`}>
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
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-xs font-bold font-mono tabular-nums transition-colors duration-500"
            style={{ color: ringColor }}
          >
            {Math.round(clampedScore)}
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="flex flex-col text-left">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Resilience</span>
          <span className="text-xs font-semibold text-text-primary capitalize">
            {clampedScore >= 80 ? 'Hardened' : clampedScore >= 50 ? 'Vulnerable' : 'At Risk'}
          </span>
        </div>
      )}
    </div>
  );
};
