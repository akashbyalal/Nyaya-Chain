"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className={cn("ml-64 min-h-screen p-8 transition-all duration-300", className)}>
        {children}
      </main>
    </div>
  )
}
