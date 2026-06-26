"use client"

import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: "text-lg" },
    md: { icon: 40, text: "text-xl" },
    lg: { icon: 56, text: "text-3xl" },
  }

  const { icon, text } = sizes[size]

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Blockchain cube base */}
        <path
          d="M32 4L56 18V46L32 60L8 46V18L32 4Z"
          fill="url(#cube-gradient)"
          stroke="url(#gold-stroke)"
          strokeWidth="2"
        />
        
        {/* Inner cube faces */}
        <path
          d="M32 4L32 32L8 18L32 4Z"
          fill="oklch(0.25 0.06 250)"
          opacity="0.8"
        />
        <path
          d="M32 4L56 18L32 32L32 4Z"
          fill="oklch(0.35 0.08 250)"
          opacity="0.9"
        />
        <path
          d="M32 32L56 18V46L32 60V32Z"
          fill="oklch(0.3 0.07 250)"
          opacity="0.85"
        />
        
        {/* Scales of Justice */}
        <g transform="translate(32, 28)">
          {/* Center pillar */}
          <rect x="-1.5" y="-8" width="3" height="20" fill="url(#gold-gradient)" rx="1" />
          
          {/* Top balance beam */}
          <rect x="-14" y="-10" width="28" height="3" fill="url(#gold-gradient)" rx="1" />
          
          {/* Left scale pan */}
          <ellipse cx="-12" cy="0" rx="6" ry="2" fill="url(#gold-gradient)" />
          <line x1="-12" y1="-7" x2="-12" y2="0" stroke="oklch(0.75 0.15 85)" strokeWidth="1.5" />
          
          {/* Right scale pan */}
          <ellipse cx="12" cy="2" rx="6" ry="2" fill="url(#gold-gradient)" />
          <line x1="12" y1="-7" x2="12" y2="2" stroke="oklch(0.75 0.15 85)" strokeWidth="1.5" />
          
          {/* Chains */}
          <line x1="-14" y1="-8.5" x2="-12" y2="-7" stroke="oklch(0.75 0.15 85)" strokeWidth="1" />
          <line x1="-10" y1="-8.5" x2="-12" y2="-7" stroke="oklch(0.75 0.15 85)" strokeWidth="1" />
          <line x1="10" y1="-8.5" x2="12" y2="-7" stroke="oklch(0.75 0.15 85)" strokeWidth="1" />
          <line x1="14" y1="-8.5" x2="12" y2="-7" stroke="oklch(0.75 0.15 85)" strokeWidth="1" />
        </g>
        
        {/* Blockchain nodes */}
        <circle cx="32" cy="4" r="3" fill="oklch(0.75 0.15 85)" />
        <circle cx="8" cy="18" r="2.5" fill="oklch(0.65 0.12 85)" />
        <circle cx="56" cy="18" r="2.5" fill="oklch(0.65 0.12 85)" />
        <circle cx="8" cy="46" r="2.5" fill="oklch(0.65 0.12 85)" />
        <circle cx="56" cy="46" r="2.5" fill="oklch(0.65 0.12 85)" />
        <circle cx="32" cy="60" r="3" fill="oklch(0.75 0.15 85)" />
        
        <defs>
          <linearGradient id="cube-gradient" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="oklch(0.35 0.1 250)" />
            <stop offset="1" stopColor="oklch(0.2 0.06 250)" />
          </linearGradient>
          <linearGradient id="gold-gradient" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
            <stop stopColor="oklch(0.85 0.15 85)" />
            <stop offset="0.5" stopColor="oklch(0.75 0.15 85)" />
            <stop offset="1" stopColor="oklch(0.65 0.12 85)" />
          </linearGradient>
          <linearGradient id="gold-stroke" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="oklch(0.8 0.15 85)" />
            <stop offset="1" stopColor="oklch(0.6 0.12 85)" />
          </linearGradient>
        </defs>
      </svg>
      
      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-bold tracking-tight text-foreground", text)}>
            Nyaya<span className="text-accent">-Chain</span>
          </span>
          {size === "lg" && (
            <span className="text-xs text-muted-foreground tracking-wide uppercase">
              Integrity & Evidence System
            </span>
          )}
        </div>
      )}
    </div>
  )
}
