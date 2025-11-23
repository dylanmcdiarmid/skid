import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex cursor-pointer items-center rounded-full border px-2.5 py-0.5 font-semibold text-xs transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "text-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        green: "border-badge-green bg-white hover:bg-badge-green/50",
        gray: "border-badge-gray bg-white hover:bg-badge-gray/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = ({ className, variant, children, ...props }: BadgeProps) => {
  let dotColorClass = "hidden";
  if (variant === "green") {
    dotColorClass = "bg-badge-green";
  } else if (variant === "gray") {
    dotColorClass = "bg-badge-gray";
  }
  const dotClassName = cn("mr-2 size-2 shrink-0 rounded-full", dotColorClass);
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      <span aria-hidden="true" className={dotClassName}>
        {" "}
      </span>
      {children}
    </div>
  );
};

export { Badge, badgeVariants };
