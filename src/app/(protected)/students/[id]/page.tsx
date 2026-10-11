"use client"

import Link from "next/link"
import { useParams, notFound } from "next/navigation"
import { ArrowLeft, Phone } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EditStudentButton } from "@/components/students/edit-student-button"
import { formatKoreanDate, toDateString } from "@/lib/date"
import {
  attendanceStatusLabel,
  attendanceStatusVariant,
  exceptionTypeLabel,
  formatWon,
  lessonKindLabel,
  paymentMethodLabel,
  paymentStatusLabel,
  paymentStatusVariant,
  studentStatusLabel,
  studentStatusVariant,
} from "@/lib/format"
import { isStudentEnrolledOn } from "@/lib/lessons"
import { useAttendanceStore } from "@/store/attendanceStore"
import { useLessonStore } from "@/store/lessonStore"
import { usePaymentStore } from "@/store/paymentStore"
import { useStudentStore } from "@/store/studentStore"
import type { RegularLesson } from "@/type"

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const students = useStudentStore((s) => s.students)
  const lessons = useLessonStore((s) => s.lessons)
  const attendanceRecords = useAttendanceStore((s) => s.records)
  const payments = usePaymentStore((s) => s.payments)
  const loading = useStudentStore((s) => s.loading)
  const fetchedUserId = useStudentStore((s) => s.fetchedUserId)

  const today = toDateString(new Date())
  const student = students.find((s) => s.id === id)

  // 아직 fetch 전이면 notFound 하지 않음
  if (!student) {
    if (loading || fetchedUserId === null) {
      return (
        <p className="py-8 text-center text-sm text-muted-foreground">
          학생 정보를 불러오는 중…
        </p>
      )
    }
    notFound()
  }

  const regularLessons = lessons.filter(
    (l): l is RegularLesson =>
      l.kind === "regular" && isStudentEnrolledOn(l, id, today),
  )
  const lessonMap = Object.fromEntries(lessons.map((l) => [l.id, l]))

  const recentAttendance = attendanceRecords
    .filter((a) => a.studentId === id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  const recentPayments = payments
    .filter((p) => p.studentId === id)
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 3)

  const infoRows: { label: string; value: string }[] = [
    { label: "학교", value: student.school || "-" },
    { label: "학년", value: student.grade || "-" },
    { label: "보호자 이름", value: student.guardianName || "-" },
    { label: "등록일", value: student.createdAt },
  ]

  const billingRows: { label: string; value: string }[] = [
    { label: "과목", value: student.subject },
    { label: "월 수강료", value: formatWon(student.monthlyFee) },
    { label: "납부일", value: `매월 ${student.paymentDay}일` },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/students"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          학생 목록
        </Link>
        <EditStudentButton student={student} />
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 pt-5">
          <div className="flex size-14 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground">
            {student.name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">{student.name}</h2>
              <Badge variant={studentStatusVariant(student.status)}>
                {studentStatusLabel[student.status]}
              </Badge>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="size-3.5" />
              {student.guardianPhone || "연락처 미등록"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {infoRows.map((row) => (
              <div key={row.label} className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="text-right font-medium">{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>수강료 정보</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {billingRows.map((row) => (
              <div key={row.label} className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="text-right font-medium">{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>배정된 수업</CardTitle>
          <Link
            href="/lessons"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            수업 일정에서 배정
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {regularLessons.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              배정된 정규 수업이 없습니다. 수업 일정에서 학생을 선택해
              배정하세요.
            </p>
          ) : (
            regularLessons.map((l) => {
              const enrollment = l.enrollments.find(
                (e) => e.studentId === id && isStudentEnrolledOn(l, id, today),
              )
              return (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
                >
                  <div>
                    <div className="mb-1">
                      <Badge variant="muted">{lessonKindLabel.regular}</Badge>
                    </div>
                    <p className="font-medium">{l.name}</p>
                    <p className="text-muted-foreground">
                      {l.day}요일 · {l.time} · {l.subject}
                    </p>
                    {enrollment ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {enrollment.startDate}부터
                        {enrollment.endDate
                          ? ` ~ ${enrollment.endDate}`
                          : " 배정"}
                      </p>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 출석 (최근 5건)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {recentAttendance.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              출석 기록이 없습니다.
            </p>
          ) : (
            recentAttendance.map((a) => {
              const lesson = lessonMap[a.lessonId]
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
                >
                  <div>
                    <p>{formatKoreanDate(a.date)}</p>
                    <p className="text-muted-foreground">
                      {lesson?.name ?? "삭제된 수업"}
                      {lesson?.kind === "exception"
                        ? ` · ${exceptionTypeLabel[lesson.exceptionType]}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.memo ? (
                      <span className="text-muted-foreground">{a.memo}</span>
                    ) : null}
                    <Badge variant={attendanceStatusVariant(a.status)}>
                      {attendanceStatusLabel[a.status]}
                    </Badge>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 수강료 납부 (최근 3건)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {recentPayments.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              납부 내역이 없습니다.
            </p>
          ) : (
            recentPayments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {p.month.replace("-", "년 ") + "월"}
                  </p>
                  <p className="text-muted-foreground">
                    {formatWon(p.paidAmount)} / {formatWon(p.expectedAmount)}
                    {p.method ? ` · ${paymentMethodLabel[p.method]}` : ""}
                  </p>
                </div>
                <Badge variant={paymentStatusVariant(p.status)}>
                  {paymentStatusLabel[p.status]}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>선생님 메모</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {student.memo || "작성된 메모가 없습니다."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
