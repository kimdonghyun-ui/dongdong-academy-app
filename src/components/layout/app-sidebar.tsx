"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { GraduationCap, LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { navItems } from "@/components/layout/nav-items"
import { useAuthStore } from "@/store/authStore"
import { useSettingsStore } from "@/store/settingsStore"

interface AppSidebarProps {
  onNavigate?: () => void
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const [loggingOut, setLoggingOut] = useState(false)
  const academyName = useSettingsStore((s) => s.settings.academyName)

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await logout()
      onNavigate?.()
      router.replace("/login")
    } finally {
      setLoggingOut(false)
    }
  }



  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex shrink-0 items-center gap-2.5 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="size-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold leading-tight text-sidebar-foreground">
            교습노트
          </span>
          <span className="text-xs text-muted-foreground">
            {academyName}
          </span>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="size-[18px]" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
        <Button
          variant="ghost"
          className="h-10 w-full justify-start px-3 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut className="size-[18px]" />
          {loggingOut ? "로그아웃 중..." : "로그아웃"}
        </Button>
      </div>
    </div>
  )
}
