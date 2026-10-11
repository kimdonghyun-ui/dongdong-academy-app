/**
 * 날짜 도우미
 * - 화면에는 한글 날짜/요일로 보여주고
 * - 저장·비교는 "YYYY-MM-DD" 문자열로 통일한다
 */
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns"

import type { Weekday } from "@/type"

// JS Date.getDay() 순서 (0=일요일)
const WEEKDAYS: Weekday[] = ["일", "월", "화", "수", "목", "금", "토"]

/** "YYYY-MM-DD"를 로컬 자정 Date로 바꾼다 (타임존 밀림 방지) */
function parseLocalDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`)
}

/** 날짜 문자열 → 한글 요일 ("월", "화" ...) */
export function getWeekday(dateStr: string): Weekday {
  return WEEKDAYS[parseLocalDate(dateStr).getDay()]
}

/** "2026-09-22" → "9월 22일 (화)" */
export function formatKoreanDate(dateStr: string): string {
  const d = parseLocalDate(dateStr)
  return `${format(d, "M월 d일")} (${getWeekday(dateStr)})`
}

/** "2026-09" → "2026년 9월" */
export function formatKoreanMonth(monthStr: string): string {
  const [y, m] = monthStr.split("-")
  return `${y}년 ${Number(m)}월`
}

/** Date → "YYYY-MM-DD" */
export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

/** 날짜를 days만큼 앞/뒤로 이동 */
export function shiftDate(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr)
  d.setDate(d.getDate() + days)
  return toDateString(d)
}

/** 같은 주 안에서 원하는 요일의 날짜를 구한다 */
export function getDateOfWeekdayInWeek(
  baseDateStr: string,
  weekday: Weekday,
): string {
  const current = parseLocalDate(baseDateStr).getDay()
  const target = WEEKDAYS.indexOf(weekday)
  return shiftDate(baseDateStr, target - current)
}

/** "YYYY-MM-DD" → "YYYY-MM" */
export function toMonthString(dateStr: string): string {
  return dateStr.slice(0, 7)
}

/**
 * 월 + 납부일로 납부 예정일 만들기
 * 31일처럼 그달에 없는 날은 말일로 맞춤
 */
export function getDueDateForMonth(monthStr: string, paymentDay: number): string {
  const monthDate = parseLocalDate(`${monthStr}-01`)
  const lastDay = endOfMonth(monthDate).getDate()
  const day = Math.min(Math.max(paymentDay, 1), lastDay)
  return `${monthStr}-${String(day).padStart(2, "0")}`
}

/** 월 문자열을 offset만큼 이동 (예: -1이면 전달) */
export function shiftMonth(monthStr: string, offset: number): string {
  const base = parseLocalDate(`${monthStr}-01`)
  return format(addMonths(base, offset), "yyyy-MM")
}

export interface CalendarDay {
  date: string
  weekday: Weekday
  day: number
  inMonth: boolean // 이번 달에 속하는 칸인지
}

/** 월간 달력 그리드용 날짜 목록 (일요일부터 시작) */
export function getMonthCalendarDays(monthStr: string): CalendarDay[] {
  const monthDate = parseLocalDate(`${monthStr}-01`)
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 })

  return eachDayOfInterval({ start, end }).map((date) => {
    const dateStr = toDateString(date)
    return {
      date: dateStr,
      weekday: getWeekday(dateStr),
      day: date.getDate(),
      inMonth: format(date, "yyyy-MM") === monthStr,
    }
  })
}
