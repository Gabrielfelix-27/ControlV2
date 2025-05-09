import { cn } from "@/lib/utils";
import { Platform } from "@/types";

interface PlatformCardProps {
  platform: Platform;
  rides: number;
  percentage: number;
  className?: string;
}

export function PlatformCard({ platform, rides, percentage, className }: PlatformCardProps) {
  // Define platform-specific colors
  const getPlatformColor = (platform: Platform): string => {
    switch(platform) {
      case "uber": return "bg-uber";
      case "99": return "bg-ninety9";
      case "indrive": return "bg-indrive";
      case "particular": return "bg-particular";
      default: return "bg-primary";
    }
  };

  // Convert platform id to display name
  const getPlatformName = (platform: Platform): string => {
    switch(platform) {
      case "uber": return "Uber";
      case "99": return "99";
      case "indrive": return "Indriver";
      case "particular": return "Particular";
      default: return platform;
    }
  };

  return (
    <div className={cn("stat-card p-3 sm:p-4 flex flex-col justify-between h-full", className)}>
      <h3 className="stat-title text-sm sm:text-base text-center">{getPlatformName(platform)}</h3>
      <div className="text-center mt-2">
        <div className="stat-value text-lg sm:text-xl font-bold">{rides}</div>
        <div className="stat-subtitle text-xs sm:text-sm text-muted-foreground">{percentage.toFixed(1)}% do total</div>
      </div>
    </div>
  );
}
