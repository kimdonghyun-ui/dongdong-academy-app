"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCheck, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toDateString } from "@/lib/date"
import { cn } from "@/lib/utils"
import { attendanceStatusLabel, exceptionTypeLabel } from "@/lib/format"
import {
  getAttendanceLessonsForDate,
  getStudentIdsForDate,
} from "@/lib/lessons"
import { useAttendanceStore } from "@/store/attendanceStore"
import { useLessonStore } from "@/store/lessonStore"
import { useStudentStore } from "@/store/studentStore"
import type {
  AttendanceRecord,
  AttendanceStatus,
  Student,
} from "@/type"

const STATUS_OPTIONS: AttendanceStatus[] = ["present", "late", "absent"]

const STATUS_STYLE: Record<AttendanceStatus, string> = {
  present: "border-primary bg-primary text-primary-foreground",
  late: "border-warning-foreground bg-warning-foreground text-card",
  absent: "border-destructive bg-destructive/90 text-card",
}

function recordKey(date: string, lessonId: string, studentId: string) {
  return `${date}_${lessonId}_${studentId}`
}

export function AttendanceList() {
  const lessons = useLessonStore((s) => s.lessons)
  const students = useStudentStore((s) => s.students)
  const records = useAttendanceStore((s) => s.records)
  const saveRecords = useAttendanceStore((s) => s.saveRecords)
  const saving = useAttendanceStore((s) => s.saving)

  const today = toDateString(new Date())
  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]))

  const [date, setDate] = useState(today)
  const dayLessons = useMemo(
    () => getAttendanceLessonsForDate(lessons, date),
    [lessons, date],
  )

  const [lessonId, setLessonId] = useState(dayLessons[0]?.id ?? "")
  const activeLesson =
    dayLessons.find((l) => l.id === lessonId) ?? dayLessons[0]

  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>(
    () => {
      const map: Record<string, AttendanceStatus> = {}
      for (const r of records) {
        map[recordKey(r.date, r.lessonId, r.studentId)] = r.status
      }
      return map
    },
  )
  const [memoMap, setMemoMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const r of records) {
      if (r.memo) map[recordKey(r.date, r.lessonId, r.studentId)] = r.memo
    }
    return map
  })
  const [saved, setSaved] = useState(false)

  // store records가 늦게 도착하면 맵을 보강 (이미 선택한 값은 유지)
  useEffect(() => {
    setStatusMap((prev) => {
      const next = { ...prev }
      for (const r of records) {
        const key = recordKey(r.date, r.lessonId, r.studentId)
        if (!(key in next)) next[key] = r.status
      }
      return next
    })
    setMemoMap((prev) => {
      const next = { ...prev }
      for (const r of records) {
        const key = recordKey(r.date, r.lessonId, r.studentId)
        if (!(key in next) && r.memo) next[key] = r.memo
      }
      return next
    })
  }, [records])

  const lessonStudents = (
    activeLesson ? getStudentIdsForDate(activeLesson, date) : []
  )
    .map((id) => studentMap[id])
    .filter((s): s is Student => Boolean(s) && s.status === "active")

  function setStatus(studentId: string, status: AttendanceStatus) {
    if (!activeLesson) return
    const key = recordKey(date, activeLesson.id, studentId)
    setStatusMap((prev) => ({ ...prev, [key]: status }))
    setSaved(false)
  }

  function setMemo(studentId: string, memo: string) {
    if (!activeLesson) return
    const key = recordKey(date, activeLesson.id, studentId)
    setMemoMap((prev) => ({ ...prev, [key]: memo }))
    setSaved(false)
  }

  function markAllPresent() {
    if (!activeLesson) return
    setStatusMap((prev) => {
      const next = { ...prev }
      for (const s of lessonStudents) {
        next[recordKey(date, activeLesson.id, s.id)] = "present"
      }
      return next
    })
    setSaved(false)
  }

  async function handleSave() {
    if (!activeLesson) return
    const toSave: AttendanceRecord[] = []
    for (const s of lessonStudents) {
      const key = recordKey(date, activeLesson.id, s.id)
      const status = statusMap[key]
      if (!status) continue
      const existing = records.find(
        (r) =>
          r.date === date &&
          r.lessonId === activeLesson.id &&
          r.studentId === s.id,
      )
      toSave.push({
        id: existing?.id ?? "",
        studentId: s.id,
        lessonId: activeLesson.id,
        date,
        status,
        memo: memoMap[key] || undefined,
      })
    }
    if (toSave.length === 0) return
    await saveRecords(toSave)
    setSaved(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date">날짜</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              setLessonId("")
              setSaved(false)
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lesson">수업</Label>
          <Select
            id="lesson"
            value={activeLesson?.id ?? ""}
            onChange={(e) => {
              setLessonId(e.target.value)
              setSaved(false)
            }}
            disabled={dayLessons.length === 0}
          >
            {dayLessons.length === 0 ? (
              <option value="">해당 날짜 수업 없음</option>
            ) : (
              dayLessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.kind === "exception"
                    ? `[${exceptionTypeLabel[l.exceptionType]}] `
                    : ""}
                  {l.time || "-"} · {l.name}
                </option>
              ))
            )}
          </Select>
        </div>
      </div>

      {!activeLesson ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          선택한 날짜에 출석할 수업이 없습니다.
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              학생 {lessonStudents.length}명
              {activeLesson.kind === "exception" ? (
                <span className="ml-1">
                  · {exceptionTypeLabel[activeLesson.exceptionType]}
                </span>
              ) : null}
            </p>
            <Button
              variant="outline"
              className="h-10 px-4"
              onClick={markAllPresent}
            >
              <CheckCheck />
              전체 출석 처리
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {lessonStudents.map((s) => {
              const key = recordKey(date, activeLesson.id, s.id)
              const current = statusMap[key]
              return (
                <Card key={s.id} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{s.name}</p>
                    <span className="text-sm text-muted-foreground">
                      {s.grade}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {STATUS_OPTIONS.map((opt) => {
                      const selected = current === opt
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setStatus(s.id, opt)}
                          aria-pressed={selected}
                          className={cn(
                            "h-11 rounded-lg border text-sm font-medium transition-colors",
                            selected
                              ? STATUS_STYLE[opt]
                              : "border-input bg-card text-foreground hover:bg-muted",
                          )}
                        >
                          {attendanceStatusLabel[opt]}
                        </button>
                      )
                    })}
                  </div>
                  <Textarea
                    value={memoMap[key] ?? ""}
                    onChange={(e) => setMemo(s.id, e.target.value)}
                    placeholder="메모 (선택)"
                    className="mt-3 min-h-10"
                    rows={1}
                  />
                </Card>
              )
            })}
          </div>

          <div className="flex items-center justify-end gap-3">
            {saved ? (
              <span className="flex items-center gap-1.5 text-sm text-success-foreground">
                <CheckCircle2 className="size-4" />
                저장되었습니다
              </span>
            ) : null}
            <Button
              className="h-10 px-5"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? "저장 중…" : "저장"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
