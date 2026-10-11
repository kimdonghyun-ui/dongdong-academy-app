/**
 * attendanceStore 전용 변환기
 * Strapi academy-attendances ↔ 앱 AttendanceRecord
 *
 * - student/lesson 관계 → studentId/lessonId
 * - attendanceStatus → status (앱 필드명)
 */
import {
  relationDocumentId,
  type StrapiRelationRef,
} from "@/lib/strapiRelation"
import type {
  AttendanceRecord,
  AttendanceStatus,
  StrapiDocument,
} from "@/type"

export interface StrapiAttendanceFields {
  date: string
  attendanceStatus: AttendanceStatus
  memo?: string | null
  student: StrapiRelationRef
  lesson: StrapiRelationRef
}

export type AttendanceDoc = StrapiDocument<StrapiAttendanceFields>

/** GET 응답 → 앱 출석 기록 (관계 없으면 null) */
export function toAttendance(doc: AttendanceDoc): AttendanceRecord | null {
  const studentId = relationDocumentId(doc.student)
  const lessonId = relationDocumentId(doc.lesson)
  if (!studentId || !lessonId || !doc.date) return null
  return {
    id: doc.documentId,
    studentId,
    lessonId,
    date: doc.date,
    status: doc.attendanceStatus ?? "present",
    memo: doc.memo ?? undefined,
  }
}

/** 앱 기록 → POST/PUT body */
export function toAttendanceWrite(record: AttendanceRecord) {
  return {
    date: record.date,
    attendanceStatus: record.status,
    memo: record.memo ?? null,
    student: record.studentId,
    lesson: record.lessonId,
  }
}

/** 저장 응답에 relation이 비어 있으면 방금 저장한 id로 채움 */
export function toAttendanceFromResponse(
  doc: AttendanceDoc,
  fallback: AttendanceRecord,
): AttendanceRecord | null {
  return toAttendance({
    ...doc,
    student: doc.student ?? fallback.studentId,
    lesson: doc.lesson ?? fallback.lessonId,
  })
}

/** 같은 날짜·수업·학생인지 구분하는 키 (upsert용) */
export function attendanceMatchKey(
  r: Pick<AttendanceRecord, "date" | "lessonId" | "studentId">,
) {
  return `${r.date}_${r.lessonId}_${r.studentId}`
}
