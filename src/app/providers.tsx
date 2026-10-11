"use client"

import { useEffect } from "react"

import FullScreenLoader from "@/components/FullScreenLoader"
import { useAuthStore } from "@/store/authStore"
import { useThemeStore } from "@/store/themeStore"

export default function Providers({ children }: { children: React.ReactNode }) {
  const restoreSession = useAuthStore((s) => s.restoreSession)
  const authReady = useAuthStore((s) => s.authReady)
  const hydrateTheme = useThemeStore((s) => s.hydrateTheme)

  useEffect(() => {
    hydrateTheme()
  }, [hydrateTheme])

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  if (!authReady) {
    return <FullScreenLoader />
  }

  return <>{children}</>
}
