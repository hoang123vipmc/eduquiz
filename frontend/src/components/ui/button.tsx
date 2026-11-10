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
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99] cursor-pointer select-none",
          {
            "bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90": variant === "default",
            "bg-destructive text-destructive-foreground shadow-2xs hover:bg-destructive/90": variant === "destructive",
            "border border-border bg-card text-foreground shadow-2xs hover:bg-secondary hover:text-foreground": variant === "outline",
            "bg-secondary text-secondary-foreground border border-border/60 hover:bg-secondary/80": variant === "secondary",
            "hover:bg-secondary hover:text-foreground": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
            "rounded-md bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90": variant === "pill",
            "bg-[var(--color-quiz-correct)] text-white shadow-2xs hover:brightness-105": variant === "correct",
            "bg-[var(--color-quiz-wrong)] text-white shadow-2xs hover:brightness-105": variant === "wrong",
            "bg-[var(--color-quiz-current)] text-white shadow-2xs hover:brightness-105": variant === "current",
            
            "h-9 px-3.5 py-2 text-[13px]": size === "default",
            "h-8 rounded-md px-2.5 text-xs": size === "sm",
            "h-10 rounded-lg px-5 text-sm": size === "lg",
            "h-9 w-9 p-0": size === "icon",
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
