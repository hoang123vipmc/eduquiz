import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "accent"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
        {
          "border border-transparent bg-primary text-primary-foreground": variant === "default",
          "border border-border bg-secondary text-secondary-foreground": variant === "secondary",
          "border border-border text-foreground bg-card": variant === "outline",
          "border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400": variant === "success",
          "border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400": variant === "warning",
          "border border-destructive/25 bg-destructive/10 text-destructive": variant === "destructive",
          "border border-primary/20 bg-accent text-accent-foreground": variant === "accent",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
