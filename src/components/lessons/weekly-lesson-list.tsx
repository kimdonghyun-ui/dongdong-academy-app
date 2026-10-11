"use client"

import { useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Pencil,
  Plus,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  formatKoreanDate,
  formatKoreanMonth,
  getDateOfWeekdayInWeek,
  getMonthCalendarDays,
  getWeekday,
  shiftMonth,
  toDateString,
  toMonthString,
} from "@/lib/date"
import {
  exceptionTypeLabel,
  exceptionTypeVariant,
  lessonKindLabel,
} from "@/lib/format"
import {
  getLessonsForDate,
  getRegularLessonsForDate,
  getStudentIdsForDate,
  syncEnrollments,
} from "@/lib/lessons"
import { cn } from "@/lib/utils"
import { useLessonStore } from "@/store/lessonStore"
import { useStudentStore } from "@/store/studentStore"
import type {
  ExceptionType,
  Lesson,
  LessonKind,
  Student,
  Weekday,
} from "@/type"

const WEEK: Weekday[] = ["월", "화", "수", "목", "금", "토", "일"]
const CALENDAR_HEADERS = ["일", "월", "화", "수", "목", "금", "토"] as const

type LessonView = "today" | "week" | "month"

export function WeeklyLessonList() {
  const lessonList = useLessonStore((s) => s.lessons)
  const createLesson = useLessonStore((s) => s.createLesson)
  const updateLesson = useLessonStore((s) => s.updateLesson)
  const students = useStudentStore((s) => s.students)

  const today = toDateString(new Date())
  const todayWeekday = getWeekday(today)

  const [view, setView] = useState<LessonView>("today")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Lesson | null>(null)
  const [month, setMonth] = useState(() => toMonthString(today))
  const [selectedDate, setSelectedDate] = useState(today)

  const calendarDays = useMemo(() => getMonthCalendarDays(month), [month])

  const todayLessons = useMemo(
    () => getLessonsForDate(lessonList, today),
    [lessonList, today],
  )

  const selectedDayLessons = useMemo(
    () => getLessonsForDate(lessonList, selectedDate),
    [lessonList, selectedDate],
  )

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(lesson: Lesson) {
    setEditing(lesson)
    setFormOpen(true)
  }

  async function handleSubmit(lesson: Lesson) {
    if (editing) {
      await updateLesson(lesson)
    } else {
      await createLesson(lesson)
    }
    setFormOpen(false)
  }

  const viewOptions: { value: LessonView; label: string }[] = [
    { value: "today", label: "오늘" },
    { value: "week", label: "이번 주" },
    { value: "month", label: "월별" },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-lg border border-border p-0.5">
          {viewOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setView(option.value)}
              className={cn(
                "h-9 rounded-md px-3 text-sm font-medium transition-colors sm:px-4",
                view === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <Button className="h-10 px-4" onClick={openCreate}>
          <Plus />
          수업 추가
        </Button>
      </div>

      {view === "month" ? (
        <MonthCalendar
          month={month}
          today={today}
          selectedDate={selectedDate}
          calendarDays={calendarDays}
          lessonList={lessonList}
          selectedDayLessons={selectedDayLessons}
          onMonthChange={setMonth}
          onSelectDate={setSelectedDate}
          onEdit={openEdit}
        />
      ) : view === "today" ? (
        <DayLessonCard
          title={`${todayWeekday}요일`}
          subtitle="오늘"
          lessons={todayLessons}
          asOfDate={today}
          onEdit={openEdit}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {WEEK.map((day) => {
            // 이번 주: 정규(덮어쓰기 반영) + 해당 주 추가 일정
            const dayDate = getDateOfWeekdayInWeek(today, day)
            const dayExceptions = lessonList.filter(
              (l) =>
                l.kind === "exception" &&
                getWeekday(l.date) === day &&
                isSameCalendarWeek(l.date, today),
            )
            const overriddenIds = new Set(
              dayExceptions
                .filter(
                  (l) =>
                    l.kind === "exception" &&
                    (l.exceptionType === "cancelled" ||
                      l.exceptionType === "time_change") &&
                    l.relatedLessonId,
                )
                .map((l) =>
                  l.kind === "exception" ? l.relatedLessonId! : "",
                ),
            )
            const dayRegular = lessonList.filter(
              (l) =>
                l.kind === "regular" &&
                l.day === day &&
                !overriddenIds.has(l.id),
            )
            const dayLessons = [...dayRegular, ...dayExceptions].sort((a, b) =>
              (a.time || "99").localeCompare(b.time || "99"),
            )
            return (
              <DayLessonCard
                key={day}
                title={`${day}요일`}
                subtitle={day === todayWeekday ? "오늘" : undefined}
                lessons={dayLessons}
                asOfDate={dayDate}
                onEdit={openEdit}
              />
            )
          })}
        </div>
      )}

      {formOpen ? (
        <LessonForm
          key={editing?.id ?? "new"}
          open={formOpen}
          onOpenChange={setFormOpen}
          initial={editing}
          students={students}
          allLessons={lessonList}
          defaultDate={selectedDate}
          defaultWeekday={todayWeekday}
          today={today}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  )
}

/** 같은 ISO 주(월~일)인지 — 이번 주 뷰에서 추가 일정 노출용 */
function isSameCalendarWeek(dateStr: string, todayStr: string): boolean {
  const a = new Date(`${dateStr}T00:00:00`)
  const b = new Date(`${todayStr}T00:00:00`)
  const startOfWeek = (d: Date) => {
    const copy = new Date(d)
    const day = copy.getDay()
    const diff = day === 0 ? -6 : 1 - day
    copy.setDate(copy.getDate() + diff)
    copy.setHours(0, 0, 0, 0)
    return copy
  }
  return startOfWeek(a).getTime() === startOfWeek(b).getTime()
}

function DayLessonCard({
  title,
  subtitle,
  lessons,
  asOfDate,
  onEdit,
}: {
  title: string
  subtitle?: string
  lessons: Lesson[]
  asOfDate: string
  onEdit: (lesson: Lesson) => void
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          {title}
          {subtitle ? (
            <span className="rounded-md bg-accent px-1.5 py-0.5 text-xs font-medium text-accent-foreground">
              {subtitle}
            </span>
          ) : null}
        </CardTitle>
        <span className="text-sm text-muted-foreground">
          {lessons.length}개 수업
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {lessons.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            예정된 수업이 없습니다.
          </p>
        ) : (
          lessons.map((l) => (
            <LessonRow
              key={l.id}
              lesson={l}
              asOfDate={
                l.kind === "exception" ? l.date : asOfDate
              }
              onEdit={() => onEdit(l)}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}

function LessonRow({
  lesson,
  asOfDate,
  onEdit,
}: {
  lesson: Lesson
  asOfDate: string
  onEdit: () => void
}) {
  const studentCount = getStudentIdsForDate(lesson, asOfDate).length

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          {lesson.kind === "exception" ? (
            <Badge variant={exceptionTypeVariant(lesson.exceptionType)}>
              {exceptionTypeLabel[lesson.exceptionType]}
            </Badge>
          ) : (
            <Badge variant="muted">{lessonKindLabel.regular}</Badge>
          )}
          {lesson.kind === "exception" ? (
            <span className="text-xs text-muted-foreground">
              {formatKoreanDate(lesson.date)}
            </span>
          ) : null}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-3.5" />
          {lesson.time || "시간 없음"}
        </div>
        <p className="mt-0.5 font-medium">{lesson.name}</p>
        <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{lesson.subject}</span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {studentCount}명
          </span>
        </div>
        {lesson.memo ? (
          <p className="mt-1 text-xs text-muted-foreground">{lesson.memo}</p>
        ) : null}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onEdit}
        aria-label="수업 수정"
      >
        <Pencil />
      </Button>
    </div>
  )
}

interface MonthCalendarProps {
  month: string
  today: string
  selectedDate: string
  calendarDays: ReturnType<typeof getMonthCalendarDays>
  lessonList: Lesson[]
  selectedDayLessons: Lesson[]
  onMonthChange: (month: string) => void
  onSelectDate: (date: string) => void
  onEdit: (lesson: Lesson) => void
}

function MonthCalendar({
  month,
  today,
  selectedDate,
  calendarDays,
  lessonList,
  selectedDayLessons,
  onMonthChange,
  onSelectDate,
  onEdit,
}: MonthCalendarProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle>{formatKoreanMonth(month)}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="이전 달"
              onClick={() => onMonthChange(shiftMonth(month, -1))}
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 px-3"
              onClick={() => {
                onMonthChange(toMonthString(today))
                onSelectDate(today)
              }}
            >
              이번 달
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="다음 달"
              onClick={() => onMonthChange(shiftMonth(month, 1))}
            >
              <ChevronRight />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="grid grid-cols-7 gap-1">
            {CALENDAR_HEADERS.map((label) => (
              <div
                key={label}
                className="py-1 text-center text-xs font-medium text-muted-foreground"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dayLessons = getLessonsForDate(lessonList, day.date)
              const isSelected = day.date === selectedDate
              const isToday = day.date === today
              const preview = dayLessons.slice(0, 2)

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => onSelectDate(day.date)}
                  className={cn(
                    "flex min-h-20 flex-col rounded-lg border p-1.5 text-left transition-colors sm:min-h-24",
                    day.inMonth
                      ? "border-border bg-card"
                      : "border-transparent bg-muted/30 text-muted-foreground",
                    isSelected && "border-primary ring-2 ring-ring/30",
                    isToday && !isSelected && "border-accent-foreground/30",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                      isToday && "bg-primary text-primary-foreground",
                    )}
                  >
                    {day.day}
                  </span>
                  <div className="mt-1 flex min-h-0 flex-1 flex-col gap-0.5">
                    {preview.map((lesson) => (
                      <span
                        key={lesson.id}
                        className={cn(
                          "truncate rounded px-1 py-0.5 text-[10px] font-medium sm:text-xs",
                          lesson.kind === "exception"
                            ? "bg-warning text-warning-foreground"
                            : "bg-accent text-accent-foreground",
                        )}
                      >
                        {lesson.kind === "exception"
                          ? exceptionTypeLabel[lesson.exceptionType]
                          : lesson.name}
                      </span>
                    ))}
                    {dayLessons.length > 2 ? (
                      <span className="text-[10px] text-muted-foreground">
                        +{dayLessons.length - 2}
                      </span>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            정규 수업은 요일 반복으로, 추가 일정은 해당 날짜에만 표시됩니다.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{formatKoreanDate(selectedDate)}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {selectedDayLessons.length}개 수업
          </span>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {selectedDayLessons.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              예정된 수업이 없습니다.
            </p>
          ) : (
            selectedDayLessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                asOfDate={
                  lesson.kind === "exception" ? lesson.date : selectedDate
                }
                onEdit={() => onEdit(lesson)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface LessonFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: Lesson | null
  students: Student[]
  allLessons: Lesson[]
  defaultDate: string
  defaultWeekday: Weekday
  today: string
  onSubmit: (lesson: Lesson) => void | Promise<void>
}

function LessonForm({
  open,
  onOpenChange,
  initial,
  students,
  allLessons,
  defaultDate,
  defaultWeekday,
  today,
  onSubmit,
}: LessonFormProps) {
  const [kind, setKind] = useState<LessonKind>(initial?.kind ?? "regular")
  const [name, setName] = useState(initial?.name ?? "")
  const [subject, setSubject] = useState(initial?.subject ?? "초등 수학")
  const [day, setDay] = useState<Weekday>(
    initial?.kind === "regular" ? initial.day : defaultWeekday,
  )
  const [date, setDate] = useState(
    initial?.kind === "exception" ? initial.date : defaultDate,
  )
  const [exceptionType, setExceptionType] = useState<ExceptionType>(
    initial?.kind === "exception" ? initial.exceptionType : "makeup",
  )
  const [relatedLessonId, setRelatedLessonId] = useState(
    initial?.kind === "exception" ? (initial.relatedLessonId ?? "") : "",
  )
  const [time, setTime] = useState(initial?.time ?? "")
  // 폼에서는 현재 유효 배정만 선택 UI로 다루고, 저장 시 syncEnrollments로 기간 반영
  const enrollmentEffectiveDate =
    kind === "exception" ? date : today
  const [studentIds, setStudentIds] = useState<string[]>(() =>
    initial
      ? getStudentIdsForDate(initial, enrollmentEffectiveDate)
      : [],
  )
  const [memo, setMemo] = useState(initial?.memo ?? "")

  const activeStudents = students.filter((s) => s.status === "active")
  const isEditing = initial !== null
  const needsRelated =
    kind === "exception" &&
    (exceptionType === "cancelled" || exceptionType === "time_change")
  const relatedCandidates = getRegularLessonsForDate(allLessons, date)

  function toggleStudent(id: string) {
    setStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function applyRelatedLesson(id: string) {
    setRelatedLessonId(id)
    const target = allLessons.find((l) => l.id === id)
    if (!target || target.kind !== "regular") return
    setName(target.name)
    setSubject(target.subject)
    setStudentIds(getStudentIdsForDate(target, date))
    if (exceptionType === "time_change" && !time) {
      setTime(target.time)
    }
    if (exceptionType === "cancelled") {
      setTime("")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (needsRelated && !relatedLessonId) return

    const id = initial?.id ?? `l${Date.now()}`
    const effectiveDate = kind === "exception" ? date : today
    const enrollments = syncEnrollments(
      initial?.enrollments ?? [],
      studentIds,
      effectiveDate,
    )
    const base = {
      id,
      name: name.trim(),
      subject,
      time: time.trim(),
      enrollments,
      memo: memo.trim() || undefined,
    }

    if (kind === "regular") {
      await onSubmit({ ...base, kind: "regular", day })
      return
    }

    await onSubmit({
      ...base,
      kind: "exception",
      date,
      exceptionType,
      relatedLessonId: relatedLessonId || undefined,
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "수업 수정" : "수업 추가"}
      description={
        isEditing
          ? kind === "regular"
            ? "정규 수업은 매주 같은 요일에 반복됩니다."
            : "추가 일정은 선택한 날짜에만 적용됩니다."
          : "정규 수업은 매주 반복됩니다. 보강·휴강·일회 수업은 추가 일정으로 등록하세요."
      }
      footer={
        <>
          <Button
            variant="outline"
            className="h-10 px-4"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            type="submit"
            form="lesson-form"
            className="h-10 px-4"
            disabled={needsRelated && !relatedLessonId}
          >
            저장
          </Button>
        </>
      }
    >
      <form
        id="lesson-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label>구분</Label>
          {isEditing ? (
            <>
              <div>
                <Badge variant={kind === "regular" ? "muted" : "info"}>
                  {lessonKindLabel[kind]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                수정 시에는 구분을 바꿀 수 없습니다.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex w-fit rounded-lg border border-border p-0.5">
                {(
                  [
                    { value: "regular", label: "정규 수업" },
                    { value: "exception", label: "추가 일정" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setKind(option.value)
                      if (option.value === "regular") {
                        setRelatedLessonId("")
                      }
                    }}
                    className={cn(
                      "h-9 rounded-md px-3 text-sm font-medium transition-colors",
                      kind === option.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                정규: 요일 반복 · 추가: 보강·휴강·시간 변경·일회 수업 등
              </p>
            </>
          )}
        </div>

        {kind === "exception" ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exceptionType">일정 유형</Label>
            <Select
              id="exceptionType"
              value={exceptionType}
              onChange={(e) => {
                const next = e.target.value as ExceptionType
                setExceptionType(next)
                if (next === "makeup" || next === "other") {
                  setRelatedLessonId("")
                }
              }}
            >
              <option value="makeup">보강</option>
              <option value="cancelled">휴강</option>
              <option value="time_change">시간 변경</option>
              <option value="other">기타</option>
            </Select>
          </div>
        ) : null}

        {kind === "exception" ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ldate">날짜</Label>
              <Input
                id="ldate"
                type="date"
                required
                value={date}
                onChange={(e) => {
                  setDate(e.target.value)
                  setRelatedLessonId("")
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ltime">
                수업 시간{exceptionType === "cancelled" ? " (선택)" : ""}
              </Label>
              <Input
                id="ltime"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder={
                  exceptionType === "cancelled"
                    ? "휴강 시 비워도 됩니다"
                    : "예: 16:00 - 17:00"
                }
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lday">요일</Label>
              <Select
                id="lday"
                value={day}
                onChange={(e) => setDay(e.target.value as Weekday)}
              >
                {WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}요일
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ltime-regular">수업 시간</Label>
              <Input
                id="ltime-regular"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="예: 16:00 - 17:00"
              />
            </div>
          </div>
        )}

        {needsRelated ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="relatedLesson">대상 정규 수업 *</Label>
            <Select
              id="relatedLesson"
              value={relatedLessonId}
              required
              onChange={(e) => applyRelatedLesson(e.target.value)}
            >
              <option value="">선택하세요</option>
              {relatedCandidates.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.time} · {l.name}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              {exceptionType === "cancelled"
                ? "선택한 정규 수업은 해당 날짜에 표시되지 않습니다."
                : "선택한 정규 수업 대신 변경된 시간이 표시됩니다."}
            </p>
            {relatedCandidates.length === 0 ? (
              <p className="text-xs text-destructive">
                해당 요일에 등록된 정규 수업이 없습니다.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lname">수업명 *</Label>
          <Input
            id="lname"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 초등 수학 B반"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lsubject">과목</Label>
          <Select
            id="lsubject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="초등 수학">초등 수학</option>
            <option value="중등 수학">중등 수학</option>
            <option value="초등 영어">초등 영어</option>
            <option value="중등 영어">중등 영어</option>
            <option value="초등 국어">초등 국어</option>
            <option value="중등 국어">중등 국어</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>배정 학생</Label>
          {activeStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              수강 중인 학생이 없습니다.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {activeStudents.map((s) => {
                const selected = studentIds.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleStudent(s.id)}
                    aria-pressed={selected}
                    className={cn(
                      "h-9 rounded-lg border px-3 text-sm font-medium transition-colors",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-card text-foreground hover:bg-muted",
                    )}
                  >
                    {s.name}
                  </button>
                )
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            새로 배정하면 오늘(추가 일정은 해당 날짜)부터 반영되고, 과거
            일정에는 소급되지 않습니다.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lmemo">메모</Label>
          <Textarea
            id="lmemo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="보강 사유, 휴강 안내 등"
          />
        </div>
      </form>
    </Dialog>
  )
}
