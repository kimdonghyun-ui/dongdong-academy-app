"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Phone, Plus, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { StudentForm } from "@/components/students/student-form"
import { toDateString, toMonthString } from "@/lib/date"
import { studentStatusLabel, studentStatusVariant } from "@/lib/format"
import { buildPaymentFromStudent } from "@/lib/paymentMapper"
import { usePaymentStore } from "@/store/paymentStore"
import { useStudentStore } from "@/store/studentStore"
import type { Student, StudentStatus } from "@/type"

export function StudentList() {
  const students = useStudentStore((s) => s.students)
  const createStudent = useStudentStore((s) => s.createStudent)
  const createPayment = usePaymentStore((s) => s.createPayment)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "all">("all")
  const [gradeFilter, setGradeFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)

  const grades = useMemo(
    () => [...new Set(students.map((s) => s.grade).filter(Boolean))],
    [students],
  )

  const filtered = students.filter((s) => {
    const matchName = s.name.includes(search.trim())
    const matchStatus = statusFilter === "all" || s.status === statusFilter
    const matchGrade = gradeFilter === "all" || s.grade === gradeFilter
    return matchName && matchStatus && matchGrade
  })

  async function handleAdd(student: Student) {
    const created = await createStudent(student)
    // 활성 학생이면 당월 청구 1건을 바로 만들어 수납 화면에 보이게 함
    if (created.status === "active") {
      const month = toMonthString(toDateString(new Date()))
      await createPayment(buildPaymentFromStudent(created, month))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 검색"
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as StudentStatus | "all")
            }
            className="sm:w-32"
            aria-label="상태 필터"
          >
            <option value="all">전체 상태</option>
            <option value="active">수강 중</option>
            <option value="paused">휴원</option>
            <option value="ended">종료</option>
          </Select>
          <Select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="sm:w-28"
            aria-label="학년 필터"
          >
            <option value="all">전체 학년</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </div>
        <Button className="h-10 px-4" onClick={() => setFormOpen(true)}>
          <Plus />
          학생 등록
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          조건에 맞는 학생이 없습니다.
        </Card>
      ) : (
        <>
          {/* 모바일: 카드 목록 */}
          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map((s) => (
              <Link key={s.id} href={`/students/${s.id}`}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.school} · {s.grade}
                      </p>
                    </div>
                    <Badge variant={studentStatusVariant(s.status)}>
                      {studentStatusLabel[s.status]}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground">
                    <span>{s.subject}</span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3.5" />
                      {s.guardianPhone}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* PC: 표 */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">이름</th>
                  <th className="px-4 py-3 font-medium">학교 · 학년</th>
                  <th className="px-4 py-3 font-medium">과목</th>
                  <th className="px-4 py-3 font-medium">보호자 연락처</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/students/${s.id}`}
                        className="font-medium hover:underline"
                      >
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.school} · {s.grade}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.subject}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.guardianPhone}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={studentStatusVariant(s.status)}>
                        {studentStatusLabel[s.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      <StudentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleAdd}
      />
    </div>
  )
}
