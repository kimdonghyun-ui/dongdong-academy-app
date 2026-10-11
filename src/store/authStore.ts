/**
 * 인증 스토어
 * - 하는 일: 로그인 / 회원가입 / 새로고침 후 로그인 유지 / 로그아웃
 * - 들고 있는 값: accessToken, user
 */
import { create } from "zustand"

import { apiClient } from "@/lib/apiClient"
import { parseAuthError } from "@/lib/authHelpers"
import type { AuthResponse, User } from "@/type"

interface AuthState {
  /** API 호출할 때 쓰는 토큰 */
  accessToken: string | null
  /** 로그인한 사용자 정보 */
  user: User | null
  /** false면 아직 "로그인 됐는지" 확인 중 → 로딩 화면 */
  authReady: boolean
  error: string | null

  setAccessToken: (token: string | null) => void
  clearError: () => void
  login: (identifier: string, password: string) => Promise<void>
  restoreSession: () => Promise<void>
  logout: () => Promise<void>
  handleRegister: (data: {
    username: string
    email: string
    password: string
    avatar: string
  }) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  authReady: false,
  error: null,

  /** 토큰만 바꿀 때 (refresh 후 등) */
  setAccessToken: (token) => set({ accessToken: token }),

  /** 화면에 보이던 에러 메시지 지우기 */
  clearError: () => set({ error: null }),

  /** 로그인 → 토큰 + 유저 저장 */
  login: async (identifier, password) => {
    try {
      const data = await apiClient<AuthResponse>("/api/session/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      })
      set({
        accessToken: data.jwt,
        user: data.user,
        authReady: true,
        error: null,
      })
    } catch (err) {
      set({
        accessToken: null,
        user: null,
        authReady: true,
        error: parseAuthError(err),
      })
      throw err
    }
  },

  /**
   * 회원가입
   * 1) 계정 만들기
   * 2) 바로 로그인
   * 3) 프로필 사진이 있으면 따로 저장 (register API가 avatar를 안 받아서)
   */
  handleRegister: async (data) => {
    try {
      const { avatar, ...rest } = data

      const res = await apiClient<AuthResponse>("/api/auth/local/register", {
        method: "POST",
        body: JSON.stringify(rest),
      })

      await get().login(rest.email, rest.password)

      if (avatar) {
        await apiClient<User>(`/api/users/${res.user.id}`, {
          method: "PUT",
          body: JSON.stringify({ avatar }),
          auth: true,
        })
      }
    } catch (err) {
      throw err
    }
  },

  /** 새로고침해도 로그인 유지 (쿠키로 토큰 다시 받기) */
  restoreSession: async () => {
    try {
      // 테스트용 딜레이 (로딩 화면 확인용)
      await new Promise((r) => setTimeout(r, 500))
      const data = await apiClient<AuthResponse>("/api/session/refresh", {
        method: "POST",
      })
      set({
        accessToken: data.jwt,
        user: data.user,
        authReady: true,
        error: null,
      })
    } catch {
      // 실패 = 비로그인. authReady는 true여야 화면이 진행됨
      set({
        accessToken: null,
        user: null,
        authReady: true,
        error: null,
      })
    }
  },

  /** 로그아웃 (서버 실패해도 이 앱에서는 로그인 해제) */
  logout: async () => {
    try {
      await apiClient<{ ok: boolean }>("/api/session/logout", {
        method: "POST",
      })
    } catch {
      // 서버 에러는 무시
    } finally {
      set({
        accessToken: null,
        user: null,
        authReady: true,
        error: null,
      })
    }
  },
}))
