/**
 * studentStore 전용 변환기
 * Strapi academy-students ↔ 앱 Student
 *
 * 이름이 다른 필드만 맞춰 준다:
 * - studentStatus → status
 * - registeredAt → createdAt
 * - documentId → id
 */
import type { Student, StudentStatus, StrapiDocument } from "@/type"

export interface StrapiStudentFields {
  name: string
  school: string
  grade: string
  subject: string
  guardianName: string
  guardianPhone: string
  monthlyFee: number
  paymentDay: number
  studentStatus: StudentStatus
  memo: string
  registeredAt: string
}

export type StudentDoc = StrapiDocument<StrapiStudentFields>

/** GET 응답 → 앱에서 쓰는 Student */
export function toStudent(doc: StudentDoc): Student {
  return {
    id: doc.documentId,
    name: doc.name ?? "",
    school: doc.school ?? "",
    grade: doc.grade ?? "",
    subject: doc.subject ?? "",
    guardianName: doc.guardianName ?? "",
    guardianPhone: doc.guardianPhone ?? "",
    monthlyFee: doc.monthlyFee ?? 0,
    paymentDay: doc.paymentDay ?? 10,
    status: doc.studentStatus ?? "active",
    memo: doc.memo ?? "",
    createdAt: doc.registeredAt ?? "",
  }
}

/** 앱 Student → POST/PUT body (owner는 store에서 붙임) */
export function toStudentWrite(student: Student) {
  return {
    name: student.name,
    school: student.school,
    grade: student.grade,
    subject: student.subject,
    guardianName: student.guardianName,
    guardianPhone: student.guardianPhone,
    monthlyFee: student.monthlyFee,
    paymentDay: student.paymentDay,
    studentStatus: student.status,
    memo: student.memo,
    registeredAt: student.createdAt,
  }
}
