import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "pill" | "correct" | "wrong" | "current"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer select-none",
          {
            "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:shadow-sm": variant === "default",
            "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90": variant === "destructive",
            "border border-border/80 bg-card text-foreground shadow-2xs hover:bg-secondary hover:text-foreground": variant === "outline",
            "bg-secondary text-secondary-foreground shadow-2xs hover:bg-secondary/80": variant === "secondary",
            "hover:bg-secondary hover:text-foreground": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
            "rounded-full bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:shadow-sm": variant === "pill",
            "bg-[var(--color-quiz-correct)] text-white shadow-xs hover:brightness-105": variant === "correct",
            "bg-[var(--color-quiz-wrong)] text-white shadow-xs hover:brightness-105": variant === "wrong",
            "bg-[var(--color-quiz-current)] text-white shadow-xs hover:brightness-105": variant === "current",
            
            "h-9.5 px-4 py-2": size === "default",
            "h-8 rounded-lg px-3 text-xs": size === "sm",
            "h-11 rounded-xl px-7 text-base": size === "lg",
            "h-9.5 w-9.5 p-0": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
