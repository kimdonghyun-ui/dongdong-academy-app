"use client"

import Link from "next/link"
import {
  AlertCircle,
  CalendarDays,
  ClipboardList,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SummaryCard } from "@/components/dashboard/summary-card"
import { TodayLessons } from "@/components/dashboard/today-lessons"
import { toDateString, toMonthString } from "@/lib/date"
import { getAttendanceLessonsForDate, getStudentIdsForDate } from "@/lib/lessons"
import { studentStatusLabel, studentStatusVariant } from "@/lib/format"
import { useAttendanceStore } from "@/store/attendanceStore"
import { useLessonStore } from "@/store/lessonStore"
import { usePaymentStore } from "@/store/paymentStore"
import { useStudentStore } from "@/store/studentStore"

export default function DashboardPage() {
  const students = useStudentStore((s) => s.students)
  const lessons = useLessonStore((s) => s.lessons)
  const attendanceRecords = useAttendanceStore((s) => s.records)
  const payments = usePaymentStore((s) => s.payments)

  const today = toDateString(new Date())
  const currentMonth = toMonthString(today)

  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]))

  const todayLessons = getAttendanceLessonsForDate(lessons, today)
  const missingAttendance = todayLessons.reduce((count, lesson) => {
    const unchecked = getStudentIdsForDate(lesson, today).filter(
      (studentId) =>
        !attendanceRecords.some(
          (a) =>
            a.date === today &&
            a.lessonId === lesson.id &&
            a.studentId === studentId,
        ),
    )
    return count + unchecked.length
  }, 0)

  const unpaidPayments = payments.filter(
    (p) => p.month === currentMonth && p.status !== "paid",
  )

  const activeStudentCount = students.filter((s) => s.status === "active").length

  const attentionItems = [
    ...unpaidPayments.map((p) => ({
      key: `pay-${p.id}`,
      label: `${studentMap[p.studentId]?.name} 학생 수강료 ${p.status === "unpaid" ? "미납" : "일부 납부"}`,
      badge: "수강료",
      href: "/payments",
    })),
    ...students
      .filter((s) => s.status === "paused")
      .map((s) => ({
        key: `pause-${s.id}`,
        label: `${s.name} 학생 휴원 중`,
        badge: "휴원",
        href: `/students/${s.id}`,
      })),
  ]

  const recentStudents = [...students]
    .filter((s) => s.status !== "ended")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="수강 중 학생"
          value={activeStudentCount}
          unit="명"
          icon={Users}
        />
        <SummaryCard
          label="오늘 수업 수"
          value={todayLessons.length}
          unit="개"
          icon={CalendarDays}
        />
        <SummaryCard
          label="출석 미입력"
          value={missingAttendance}
          unit="명"
          icon={ClipboardList}
          highlight
        />
        <SummaryCard
          label="이번 달 미납"
          value={unpaidPayments.length}
          unit="명"
          icon={Wallet}
          highlight
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <TodayLessons
          lessons={todayLessons}
          studentMap={studentMap}
          date={today}
        />

        <Card>
          <CardHeader>
            <CardTitle>확인 필요</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {attentionItems.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                확인이 필요한 항목이 없습니다.
              </p>
            ) : (
              attentionItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                >
                  <AlertCircle className="size-4 shrink-0 text-destructive" />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {item.label}
                  </span>
                  <Badge variant="muted">{item.badge}</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 등록 학생</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {recentStudents.map((s) => (
            <Link
              key={s.id}
              href={`/students/${s.id}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
                  {s.name.slice(0, 1)}
                </div>
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.grade} · {s.subject}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {s.createdAt} 등록
                </span>
                <Badge variant={studentStatusVariant(s.status)}>
                  {studentStatusLabel[s.status]}
                </Badge>
              </div>
            </Link>
          ))}
          <Link
            href="/students"
            className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border p-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            <UserPlus className="size-4" />
            전체 학생 보기
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
