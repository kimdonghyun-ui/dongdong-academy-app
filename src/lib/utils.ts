/**
 * Tailwind className 합치기
 * 버튼·카드 등 UI 컴포넌트에서 조건부 class를 깔끔히 붙일 때 쓴다.
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
