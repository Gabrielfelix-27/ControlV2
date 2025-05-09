
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string | React.ReactNode;
  trend?: {
    value: number;
    positive?: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, subtitle, trend, className }: StatCardProps) {
  return (
    <div className={cn("stat-card", className)}>
      <h3 className="stat-title">{title}</h3>
      <div>
        <div className="flex items-end">
          <div className="stat-value">{value}</div>
          {trend && (
            <span 
              className={cn(
                "ml-2 text-sm font-medium",
                trend.positive ? "text-success" : "text-danger"
              )}
            >
              {trend.positive ? "↑" : "↓"}{Math.abs(trend.value).toFixed(1)}%
            </span>
          )}
        </div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}
