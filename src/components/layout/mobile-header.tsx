"use client"

import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"

interface MobileHeaderProps {
  title: string
  onMenuClick: () => void
}

export function MobileHeader({ title, onMenuClick }: MobileHeaderProps) {
  return (
    <header className="flex items-center gap-2 border-b border-border bg-card px-3 py-2.5 lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        aria-label="메뉴 열기"
      >
        <Menu />
      </Button>
      <h1 className="text-base font-bold">{title}</h1>
    </header>
  )
}
