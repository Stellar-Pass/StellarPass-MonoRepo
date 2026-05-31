import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-stellar-100 text-stellar-700 dark:bg-stellar-900/30 dark:text-stellar-300",
        secondary:
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        success:
          "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300",
        danger:
          "bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300",
        warning:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
        outline:
          "border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300",
        live:
          "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300 animate-pulse",
        draft:
          "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
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

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
