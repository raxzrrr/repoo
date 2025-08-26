
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-border bg-card text-card-foreground shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight text-foreground", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Enhanced card variants
const CardEnhanced = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'gradient' | 'glass' | 'glassDark' | 'elevated'
  }
>(({ className, variant = 'default', ...props }, ref) => {
  const variantClasses = {
    default: "bg-card border-border shadow-soft hover:shadow-medium",
    gradient: "bg-gradient-to-br from-card via-card to-muted/30 border-primary/20 shadow-medium hover:shadow-strong",
    glass: "bg-white/10 backdrop-blur-md border-white/20 shadow-soft hover:shadow-medium",
    glassDark: "bg-black/10 backdrop-blur-md border-white/10 shadow-soft hover:shadow-medium",
    elevated: "bg-card border-border shadow-strong hover:shadow-strong hover:-translate-y-2",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border transition-all duration-300",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
})
CardEnhanced.displayName = "CardEnhanced"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardEnhanced }
