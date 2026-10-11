/**
 * 수업·배정 계산 도우미 (API 호출 없음)
 *
 * - 그날 보이는 수업 목록
 * - 배정 기간(startDate~endDate)에 학생이 포함되는지
 * - 수업 폼에서 학생 선택 ↔ enrollments 맞추기
 */
import { getWeekday, shiftDate } from "@/lib/date"
import type {
  Lesson,
  LessonEnrollment,
  RegularLesson,
} from "@/type"

/** 휴강·시간변경은 대상 정규 수업을 그날 목록에서 숨긴다 */
const OVERRIDE_TYPES = new Set(["cancelled", "time_change"])

/** 그날 배정이 살아 있는지 (시작일~종료일 포함) */
export function isEnrollmentActiveOn(
  enrollment: LessonEnrollment,
  dateStr: string,
): boolean {
  if (dateStr < enrollment.startDate) return false
  if (enrollment.endDate && dateStr > enrollment.endDate) return false
  return true
}

/** 그날 수업에 배정된 학생 id 목록 */
export function getStudentIdsForDate(
  lesson: Lesson,
  dateStr: string,
): string[] {
  return lesson.enrollments
    .filter((e) => isEnrollmentActiveOn(e, dateStr))
    .map((e) => e.studentId)
}

/** 그날 그 학생이 이 수업에 배정돼 있는지 */
export function isStudentEnrolledOn(
  lesson: Lesson,
  studentId: string,
  dateStr: string,
): boolean {
  return lesson.enrollments.some(
    (e) =>
      e.studentId === studentId && isEnrollmentActiveOn(e, dateStr),
  )
}

/**
 * 폼에서 고른 학생 체크 ↔ enrollments 배열로 맞춘다
 * - 새로 고른 학생: effectiveDate부터 시작
 * - 뺀 학생: 전날까지로 종료 (과거 기록은 남김)
 * - 그날·이후에야 시작된 배정은 그냥 삭제
 */
export function syncEnrollments(
  previous: LessonEnrollment[],
  selectedIds: string[],
  effectiveDate: string,
): LessonEnrollment[] {
  const selected = new Set(selectedIds)
  const next: LessonEnrollment[] = []

  for (const enrollment of previous) {
    const active = isEnrollmentActiveOn(enrollment, effectiveDate)

    if (selected.has(enrollment.studentId)) {
      next.push(enrollment)
      continue
    }

    if (!active) {
      next.push(enrollment)
      continue
    }

    if (enrollment.startDate >= effectiveDate) continue

    next.push({
      ...enrollment,
      endDate: shiftDate(effectiveDate, -1),
    })
  }

  for (const studentId of selectedIds) {
    const alreadyActive = next.some(
      (e) =>
        e.studentId === studentId && isEnrollmentActiveOn(e, effectiveDate),
    )
    if (!alreadyActive) {
      next.push({ studentId, startDate: effectiveDate })
    }
  }

  return next
}

/**
 * 특정 날짜에 화면에 보여줄 수업
 * = (덮어쓰지 않은 정규) + 그날 추가 일정
 */
export function getLessonsForDate(lessons: Lesson[], dateStr: string): Lesson[] {
  const weekday = getWeekday(dateStr)
  const regular = lessons.filter(
    (l): l is RegularLesson => l.kind === "regular" && l.day === weekday,
  )
  const exceptions = lessons.filter(
    (l) => l.kind === "exception" && l.date === dateStr,
  )

  const overriddenIds = new Set(
    exceptions
      .filter(
        (l) =>
          l.kind === "exception" &&
          OVERRIDE_TYPES.has(l.exceptionType) &&
          l.relatedLessonId,
      )
      .map((l) => (l.kind === "exception" ? l.relatedLessonId! : "")),
  )

  const visibleRegular = regular.filter((l) => !overriddenIds.has(l.id))

  return [...visibleRegular, ...exceptions].sort((a, b) => {
    if (!a.time && b.time) return 1
    if (a.time && !b.time) return -1
    return a.time.localeCompare(b.time)
  })
}

/** 출석 찍을 수업 (휴강은 제외) */
export function getAttendanceLessonsForDate(
  lessons: Lesson[],
  dateStr: string,
): Lesson[] {
  return getLessonsForDate(lessons, dateStr).filter(
    (l) => !(l.kind === "exception" && l.exceptionType === "cancelled"),
  )
}

/** 그날 요일의 정규 수업만 (추가 일정의 '대상 수업' 선택용) */
export function getRegularLessonsForDate(
  lessons: Lesson[],
  dateStr: string,
): RegularLesson[] {
  const weekday = getWeekday(dateStr)
  return lessons.filter(
    (l): l is RegularLesson => l.kind === "regular" && l.day === weekday,
  )
}
