/**
 * 인증 관련 작은 도우미
 * - getAuthUser: API 저장 전에 "로그인됐는지" 확인
 * - parseAuthError: 에러를 화면에 보여줄 문장으로 바꿈
 */
import { useAuthStore } from "@/store/authStore"
import type { User } from "@/type"

/** 로그인한 유저를 가져온다. 없으면 AUTH_REQUIRED 에러 */
export function getAuthUser(): User {
  const user = useAuthStore.getState().user
  if (!user) {
    throw new Error("AUTH_REQUIRED")
  }
  return user
}

/** Error / 알 수 없는 값을 사용자용 한글 메시지로 변환 */
export function parseAuthError(err: unknown): string {
  if (!(err instanceof Error)) {
    return "알 수 없는 에러가 발생했습니다."
  }

  switch (err.message) {
    case "AUTH_REQUIRED":
      return "로그인이 필요합니다."
    default:
      return err.message || "요청에 실패했습니다."
  }
}
