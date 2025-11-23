import type { HTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// Clamp constants for progress width
const PROGRESS_MIN_PERCENT = 0;
const PROGRESS_MAX_PERCENT = 100;

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    return (
      <div
        aria-valuemax={PROGRESS_MAX_PERCENT}
        aria-valuemin={PROGRESS_MIN_PERCENT}
        aria-valuenow={value}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        ref={ref}
        role="progressbar"
        {...props}
      >
        <div
          className="h-full bg-primary transition-all"
          style={{
            width: `${Math.min(
              PROGRESS_MAX_PERCENT,
              Math.max(PROGRESS_MIN_PERCENT, value)
            )}%`,
          }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
