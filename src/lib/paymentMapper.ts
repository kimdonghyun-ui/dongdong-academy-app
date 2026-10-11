/**
 * paymentStore 전용 변환기
 * Strapi academy-payments ↔ 앱 Payment
 *
 * - student 관계 → studentId
 * - paymentStatus → status (앱 필드명)
 */
import { getDueDateForMonth } from "@/lib/date"
import {
  relationDocumentId,
  type StrapiRelationRef,
} from "@/lib/strapiRelation"
import type {
  Payment,
  PaymentMethod,
  PaymentStatus,
  StrapiDocument,
  Student,
} from "@/type"

export interface StrapiPaymentFields {
  month: string
  dueDate: string
  expectedAmount: number
  paidAmount: number
  paymentStatus: PaymentStatus
  paidDate?: string | null
  method?: PaymentMethod | null
  memo?: string | null
  student: StrapiRelationRef
}

export type PaymentDoc = StrapiDocument<StrapiPaymentFields>

/** 학생·월 기준으로 미납 청구 초안 (POST 전용, id는 임시) */
export function buildPaymentFromStudent(
  student: Pick<Student, "id" | "monthlyFee" | "paymentDay">,
  month: string,
): Payment {
  return {
    id: `p${Date.now()}_${student.id}`,
    studentId: student.id,
    month,
    dueDate: getDueDateForMonth(month, student.paymentDay),
    expectedAmount: student.monthlyFee,
    paidAmount: 0,
    status: "unpaid",
  }
}

/** 같은 학생·월인지 구분하는 키 (중복 생성 방지) */
export function paymentMatchKey(
  r: Pick<Payment, "studentId" | "month">,
) {
  return `${r.studentId}_${r.month}`
}

/** GET 응답 → 앱 Payment */
export function toPayment(doc: PaymentDoc): Payment | null {
  const studentId = relationDocumentId(doc.student)
  if (!studentId) return null
  return {
    id: doc.documentId,
    studentId,
    month: doc.month ?? "",
    dueDate: doc.dueDate ?? "",
    expectedAmount: doc.expectedAmount ?? 0,
    paidAmount: doc.paidAmount ?? 0,
    status: doc.paymentStatus ?? "unpaid",
    paidDate: doc.paidDate ?? undefined,
    method: doc.method ?? undefined,
    memo: doc.memo ?? undefined,
  }
}

/** 앱 Payment → POST/PUT body */
export function toPaymentWrite(payment: Payment) {
  return {
    month: payment.month,
    dueDate: payment.dueDate,
    expectedAmount: payment.expectedAmount,
    paidAmount: payment.paidAmount,
    paymentStatus: payment.status,
    paidDate: payment.paidDate ?? null,
    method: payment.method ?? null,
    memo: payment.memo ?? null,
    student: payment.studentId,
  }
}

/** 저장 응답에 student 관계가 없으면 fallback으로 채움 */
export function toPaymentFromResponse(
  doc: PaymentDoc,
  fallback: Payment,
): Payment {
  return (
    toPayment({
      ...doc,
      student: doc.student ?? fallback.studentId,
    }) ?? { ...fallback, id: doc.documentId }
  )
}
