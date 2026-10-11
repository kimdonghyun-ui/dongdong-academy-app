"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MobileHeader } from "@/components/layout/mobile-header"
import { getPageTitle } from "@/components/layout/nav-items"
import { useAuthStore } from "@/store/authStore"
import { useSettingsStore } from "@/store/settingsStore"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const title = getPageTitle(pathname)
  const user = useAuthStore((s) => s.user)
  const teacherName = useSettingsStore((s) => s.settings.teacherName)
  const displayName = teacherName || user?.username || "선생님"

  return (
    <div className="flex min-h-svh bg-background">
      {/* 데스크톱 사이드바 */}
      <aside className="hidden w-60 shrink-0 border-r border-border lg:block">
        <div className="sticky top-0 h-svh">
          <AppSidebar />
        </div>
      </aside>

      {/* 모바일 드로어(모바일 사이드바) */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* 닫기 버튼 영역을 뺀 나머지 높이에 사이드바를 채워 하단 로그아웃이 잘리지 않게 함 */}
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border bg-sidebar shadow-lg">
            <div className="flex shrink-0 justify-end p-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMobileOpen(false)}
                aria-label="메뉴 닫기"
              >
                <X />
              </Button>
            </div>
            <div className="min-h-0 flex-1">
              <AppSidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}

      {/* 메인 영역 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader title={title} onMenuClick={() => setMobileOpen(true)} />

        {/* 데스크톱 상단 바: 페이지 제목 + 선생님 이름 */}
        <header className="hidden items-center justify-between border-b border-border bg-card px-6 py-4 lg:flex">
          <h1 className="text-lg font-bold">{title}</h1>
          <span className="text-sm text-muted-foreground">
            {displayName} 선생님
          </span>
        </header>

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
