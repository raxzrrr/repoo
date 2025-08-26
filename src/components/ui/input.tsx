import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'enhanced' | 'glass' | 'glassDark'
  size?: 'default' | 'sm' | 'lg' | 'xl'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', size = 'default', type, ...props }, ref) => {
    const variantClasses = {
      default: "bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      enhanced: "bg-background border-2 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/40 focus-visible:ring-offset-2 transition-all duration-200",
      glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2",
      glassDark: "bg-black/10 backdrop-blur-md border border-white/10 text-white placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2",
    }

    const sizeClasses = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-9 px-3 py-1.5 text-xs",
      lg: "h-12 px-6 py-3 text-base",
      xl: "h-14 px-8 py-4 text-lg",
    }

    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-lg transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
