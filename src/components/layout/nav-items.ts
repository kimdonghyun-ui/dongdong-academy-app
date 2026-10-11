import {
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  Megaphone,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/students", label: "학생", icon: Users },
  { href: "/attendance", label: "출석", icon: ClipboardCheck },
  { href: "/lessons", label: "수업 일정", icon: CalendarDays },
  { href: "/payments", label: "수강료", icon: Wallet },
  { href: "/notices", label: "안내문", icon: Megaphone },
  { href: "/settings", label: "설정", icon: Settings },
]

// 현재 경로에 해당하는 페이지 제목을 반환한다. (학생 상세 등 하위 경로 포함)
export function getPageTitle(pathname: string): string {
  const matched = navItems
    .filter((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]
  return matched?.label ?? "교습노트"
}
