"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-stellar text-white shadow-lg shadow-stellar-500/25 hover:shadow-xl hover:shadow-stellar-500/30 hover:brightness-110",
        secondary:
          "bg-stellar-100 text-stellar-700 hover:bg-stellar-200 dark:bg-stellar-900/30 dark:text-stellar-300 dark:hover:bg-stellar-900/50",
        outline:
          "border-2 border-stellar-300 bg-transparent text-stellar-700 hover:bg-stellar-50 dark:border-stellar-700 dark:text-stellar-300 dark:hover:bg-stellar-950",
        ghost:
          "text-stellar-700 hover:bg-stellar-50 hover:text-stellar-800 dark:text-stellar-300 dark:hover:bg-stellar-950",
        danger:
          "bg-danger-600 text-white shadow-lg shadow-danger-500/25 hover:bg-danger-700 hover:shadow-xl",
        success:
          "bg-success-600 text-white shadow-lg shadow-success-500/25 hover:bg-success-700 hover:shadow-xl",
        link:
          "text-stellar-600 underline-offset-4 hover:underline dark:text-stellar-400",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-13 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
        full: "h-12 w-full rounded-xl px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
