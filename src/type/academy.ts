/**
 * 교습노트 앱에서 쓰는 도메인 타입
 *
 * 화면·스토어는 이 타입을 기준으로 이야기한다.
 * Strapi 필드명과의 차이는 *Mapper.ts 에서 맞춘다.
 */

// --- 상태·구분 값 ---

export type StudentStatus = "active" | "paused" | "ended"

/** 출석 상태 (보강은 수업/일정 쪽 개념이라 여기엔 없음) */
export type AttendanceStatus = "present" | "late" | "absent"

export type PaymentStatus = "paid" | "unpaid" | "partial"

export type PaymentMethod = "cash" | "transfer" | "card"

export type Weekday = "월" | "화" | "수" | "목" | "금" | "토" | "일"

/** 정규 수업(매주 반복) / 추가 일정(보강·휴강 등) */
export type LessonKind = "regular" | "exception"

/**
 * 추가 일정의 세부 종류
 * - makeup / other: 그날 새로 생기는 일정
 * - cancelled / time_change: 기존 정규 수업을 그날만 덮어씀
 */
export type ExceptionType = "makeup" | "cancelled" | "time_change" | "other"

export type NoticeType =
  | "unpaid"
  | "schedule"
  | "closure"
  | "supplies"
  | "custom"

// --- 학생 ---

export interface Student {
  id: string
  name: string
  school: string
  grade: string
  subject: string
  guardianName: string
  guardianPhone: string
  monthlyFee: number
  paymentDay: number
  status: StudentStatus
  memo: string
  createdAt: string // YYYY-MM-DD (등록일)
}

// --- 출석 ---

export interface AttendanceRecord {
  id: string
  studentId: string
  lessonId: string
  date: string // YYYY-MM-DD
  status: AttendanceStatus
  memo?: string
}

// --- 수업 ---

/**
 * 수업에 학생을 배정한 기록
 * startDate ~ endDate(포함). endDate가 없으면 계속 배정.
 */
export interface LessonEnrollment {
  studentId: string
  startDate: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
}

interface LessonBase {
  id: string
  name: string
  subject: string
  time: string // 예: "16:00 - 17:00" (휴강은 빈 문자열 가능)
  enrollments: LessonEnrollment[]
  memo?: string
}

/** 요일마다 반복되는 정규 수업 */
export interface RegularLesson extends LessonBase {
  kind: "regular"
  day: Weekday
}

/** 특정 날짜만의 보강·휴강·시간 변경 등 */
export interface ExceptionLesson extends LessonBase {
  kind: "exception"
  date: string // YYYY-MM-DD
  exceptionType: ExceptionType
  /** 휴강·시간변경 시 덮어쓸 정규 수업 id */
  relatedLessonId?: string
}

export type Lesson = RegularLesson | ExceptionLesson

// --- 수납 ---

export interface Payment {
  id: string
  studentId: string
  month: string // YYYY-MM
  dueDate: string // YYYY-MM-DD
  expectedAmount: number
  paidAmount: number
  status: PaymentStatus
  paidDate?: string
  method?: PaymentMethod
  memo?: string
}

// --- 학원 설정 ---

export interface AcademySettings {
  academyName: string
  teacherName: string
  phone: string
  defaultPaymentDay: number
  noticeFooter: string
}
