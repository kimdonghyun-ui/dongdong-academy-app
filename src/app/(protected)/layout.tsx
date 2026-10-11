"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { AppShell } from "@/components/layout/app-shell"
import { useAttendanceStore } from "@/store/attendanceStore"
import { useAuthStore } from "@/store/authStore"
import { useLessonStore } from "@/store/lessonStore"
import { usePaymentStore } from "@/store/paymentStore"
import { useSettingsStore } from "@/store/settingsStore"
import { useStudentStore } from "@/store/studentStore"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const accessToken = useAuthStore((s) => s.accessToken)
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    if (!accessToken) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [accessToken, router, pathname])

  // accessToken/userId 변경 시에만 1회 로드
  // fetchedUserId를 deps에 넣으면 스토어가 끝날 때마다 전체가 재요청된다
  useEffect(() => {
    if (!accessToken) {
      useSettingsStore.getState().resetSettings()
      useStudentStore.getState().resetStudents()
      useLessonStore.getState().resetLessons()
      useAttendanceStore.getState().resetAttendances()
      usePaymentStore.getState().resetPayments()
      return
    }
    if (!userId) return

    const settings = useSettingsStore.getState()
    const students = useStudentStore.getState()
    const lessons = useLessonStore.getState()
    const attendances = useAttendanceStore.getState()
    const payments = usePaymentStore.getState()

    if (settings.fetchedUserId !== userId) void settings.fetchSettings()
    if (students.fetchedUserId !== userId) void students.fetchStudents()
    if (lessons.fetchedUserId !== userId) void lessons.fetchLessons()
    if (attendances.fetchedUserId !== userId) void attendances.fetchAttendances()
    if (payments.fetchedUserId !== userId) void payments.fetchPayments()
  }, [accessToken, userId])

  if (!accessToken) return null

  return <AppShell>{children}</AppShell>
}
