/**
 * 인증 관련 타입
 * (로그인 / 회원가입 / 토큰 갱신 응답)
 */
import type { User } from "./user"

/** 로그인·회원가입·리프레시가 공통으로 주는 응답 */
export interface AuthResponse {
  jwt: string
  user: User
}
