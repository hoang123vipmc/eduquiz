import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "accent"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
        {
          "border border-transparent bg-primary text-primary-foreground shadow-2xs": variant === "default",
          "border border-border/60 bg-secondary text-secondary-foreground": variant === "secondary",
          "border border-border/80 text-foreground bg-card": variant === "outline",
          "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400": variant === "success",
          "border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400": variant === "warning",
          "border border-destructive/20 bg-destructive/10 text-destructive": variant === "destructive",
          "border border-accent-foreground/20 bg-accent text-accent-foreground": variant === "accent",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
