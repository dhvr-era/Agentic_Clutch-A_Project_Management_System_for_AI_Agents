import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  percentage?: number;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, percentage, color = "emerald" }) => {
  const colorMap: Record<string, string> = {
    emerald: "bg-amber-500",
    blue: "bg-indigo-500",
    amber: "bg-indigo-500",
    rose: "bg-amber-500",
  };

  const textColorMap: Record<string, string> = {
    emerald: "text-amber-400",
    blue: "text-indigo-400",
    amber: "text-indigo-400",
    rose: "text-amber-400",
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-end">
        <span className="text-xs uppercase tracking-[0.15em] text-secondary-text font-bold">{label}</span>
        <span className={`text-sm font-mono font-bold ${textColorMap[color]}`}>{value}{unit}</span>
      </div>
      {percentage !== undefined && (
        <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden border border-divider">
          <div
            className={`h-full ${colorMap[color]} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
      )}
    </div>
  );
};
