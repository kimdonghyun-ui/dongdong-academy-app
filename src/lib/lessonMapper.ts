/**
 * lessonStore 전용 변환기
 * Strapi academy-lessons ↔ 앱 Lesson
 *
 * 왜 따로 있나?
 * - UI 요일은 "월"~"일", Strapi는 mon~sun
 * - 학생 배정(enrollments)·관련 수업은 관계 필드라 id만 꺼내야 함
 */
import {
  relationDocumentId,
  type StrapiRelationRef,
} from "@/lib/strapiRelation"
import type {
  ExceptionType,
  Lesson,
  LessonEnrollment,
  LessonKind,
  StrapiDocument,
  Weekday,
} from "@/type"

type StrapiDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"

const WEEKDAY_TO_STRAPI: Record<Weekday, StrapiDay> = {
  월: "mon",
  화: "tue",
  수: "wed",
  목: "thu",
  금: "fri",
  토: "sat",
  일: "sun",
}

const STRAPI_TO_WEEKDAY: Record<StrapiDay, Weekday> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
  sun: "일",
}

function toStrapiDay(day: Weekday): StrapiDay {
  return WEEKDAY_TO_STRAPI[day]
}

function toWeekday(day: string | null | undefined): Weekday {
  if (day && day in STRAPI_TO_WEEKDAY) {
    return STRAPI_TO_WEEKDAY[day as StrapiDay]
  }
  // 예전에 한글로 저장된 값이 있을 수 있음
  if (day && day in WEEKDAY_TO_STRAPI) return day as Weekday
  return "월"
}

export interface StrapiEnrollment {
  id?: number
  student: StrapiRelationRef
  startDate: string
  endDate?: string | null
}

export interface StrapiLessonFields {
  name: string
  subject: string
  time: string
  kind: LessonKind
  day?: StrapiDay | Weekday | null
  date?: string | null
  exceptionType?: ExceptionType | null
  relatedLesson?: StrapiRelationRef
  enrollments?: StrapiEnrollment[] | null
  memo?: string | null
}

export type LessonDoc = StrapiDocument<StrapiLessonFields>

function toEnrollments(
  enrollments: StrapiEnrollment[] | null | undefined,
): LessonEnrollment[] {
  if (!enrollments) return []
  const result: LessonEnrollment[] = []
  for (const e of enrollments) {
    const studentId = relationDocumentId(e.student)
    if (!studentId || !e.startDate) continue
    const enrollment: LessonEnrollment = {
      studentId,
      startDate: e.startDate,
    }
    if (e.endDate) enrollment.endDate = e.endDate
    result.push(enrollment)
  }
  return result
}

/** GET 응답 → 앱 Lesson */
export function toLesson(doc: LessonDoc): Lesson {
  const base = {
    id: doc.documentId,
    name: doc.name ?? "",
    subject: doc.subject ?? "",
    time: doc.time ?? "",
    enrollments: toEnrollments(doc.enrollments),
    memo: doc.memo ?? undefined,
  }

  if (doc.kind === "exception") {
    return {
      ...base,
      kind: "exception",
      date: doc.date ?? "",
      exceptionType: doc.exceptionType ?? "other",
      relatedLessonId: relationDocumentId(doc.relatedLesson),
    }
  }

  return {
    ...base,
    kind: "regular",
    day: toWeekday(doc.day),
  }
}

function toEnrollmentWrite(enrollments: LessonEnrollment[]) {
  return enrollments.map((e) => ({
    student: e.studentId,
    startDate: e.startDate,
    endDate: e.endDate ?? null,
  }))
}

/** 앱 Lesson → POST/PUT body */
export function toLessonWrite(lesson: Lesson) {
  const base = {
    name: lesson.name,
    subject: lesson.subject,
    time: lesson.time,
    kind: lesson.kind,
    enrollments: toEnrollmentWrite(lesson.enrollments),
    memo: lesson.memo ?? null,
  }

  if (lesson.kind === "regular") {
    return {
      ...base,
      day: toStrapiDay(lesson.day),
      date: null,
      exceptionType: null,
      relatedLesson: null,
    }
  }

  return {
    ...base,
    day: null,
    date: lesson.date,
    exceptionType: lesson.exceptionType,
    relatedLesson: lesson.relatedLessonId ?? null,
  }
}

/**
 * 저장 직후 응답에는 enrollments/relatedLesson populate가 없을 수 있다.
 * 그래서 방금 보낸 값으로 빈 자리를 채운다.
 */
export function toLessonFromResponse(doc: LessonDoc, fallback: Lesson): Lesson {
  return toLesson({
    ...doc,
    enrollments:
      doc.enrollments ??
      toEnrollmentWrite(fallback.enrollments).map((e) => ({
        student: e.student,
        startDate: e.startDate,
        endDate: e.endDate,
      })),
    relatedLesson:
      doc.relatedLesson ??
      (fallback.kind === "exception" ? fallback.relatedLessonId : null),
  })
}
