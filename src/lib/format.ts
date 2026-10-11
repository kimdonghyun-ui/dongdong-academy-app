/**
 * 화면에 보여줄 한글 라벨 / 뱃지 색 종류
 * (영어 코드 → "수강 중", "출석" 같은 표시용 글자)
 */
import type {
  AttendanceStatus,
  ExceptionType,
  LessonKind,
  PaymentMethod,
  PaymentStatus,
  StudentStatus,
} from "@/type"

/** 250000 → "250,000원" */
export function formatWon(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`
}

export const studentStatusLabel: Record<StudentStatus, string> = {
  active: "수강 중",
  paused: "휴원",
  ended: "종료",
}

export const attendanceStatusLabel: Record<AttendanceStatus, string> = {
  present: "출석",
  late: "지각",
  absent: "결석",
}

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  paid: "납부",
  unpaid: "미납",
  partial: "일부 납부",
}

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  cash: "현금",
  transfer: "계좌이체",
  card: "카드",
}

export const lessonKindLabel: Record<LessonKind, string> = {
  regular: "정규 수업",
  exception: "추가 일정",
}

export const exceptionTypeLabel: Record<ExceptionType, string> = {
  makeup: "보강",
  cancelled: "휴강",
  time_change: "시간 변경",
  other: "기타",
}

// Badge 컴포넌트 variant 이름과 맞춤
export function exceptionTypeVariant(
  type: ExceptionType,
): "info" | "danger" | "warning" | "muted" {
  if (type === "makeup") return "info"
  if (type === "cancelled") return "danger"
  if (type === "time_change") return "warning"
  return "muted"
}

export function studentStatusVariant(
  status: StudentStatus,
): "success" | "warning" | "muted" {
  if (status === "active") return "success"
  if (status === "paused") return "warning"
  return "muted"
}

export function attendanceStatusVariant(
  status: AttendanceStatus,
): "success" | "warning" | "danger" {
  if (status === "present") return "success"
  if (status === "late") return "warning"
  return "danger"
}

export function paymentStatusVariant(
  status: PaymentStatus,
): "success" | "danger" | "warning" {
  if (status === "paid") return "success"
  if (status === "unpaid") return "danger"
  return "warning"
}
