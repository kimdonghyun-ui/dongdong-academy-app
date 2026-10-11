/**
 * 테마 스토어 (라이트 / 다크)
 * - API 없음. 브라우저(localStorage)에만 저장
 */
import { create } from "zustand"

export type Theme = "light" | "dark"

const STORAGE_KEY = "theme"

/** html 태그에 light/dark 클래스를 붙여서 CSS가 먹게 함 */
function applyThemeClass(theme: Theme) {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(theme)
}

/** 저장된 테마 → 없으면 OS 다크모드 설정을 따라감 */
function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return "light"

  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === "light" || saved === "dark") return saved

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

interface ThemeState {
  theme: Theme
  /** 첫 로딩이 끝났는지 (깜빡임 방지용) */
  hydrated: boolean
  hydrateTheme: () => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  hydrated: false,

  /** 앱 켤 때 한 번: 저장된 테마 적용 */
  hydrateTheme: () => {
    const theme = getPreferredTheme()
    applyThemeClass(theme)
    set({ theme, hydrated: true })
  },

  /** 테마 고르기 + localStorage에 저장 */
  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEY, theme)
    applyThemeClass(theme)
    set({ theme })
  },

  /** 라이트 ↔ 다크 토글 */
  toggleTheme: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark"
    get().setTheme(next)
  },
}))
