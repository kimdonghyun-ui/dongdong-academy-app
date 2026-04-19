import { create } from "zustand";
import { apiClient } from "@/lib/apiClient";
// import type { User } from "@/lib/types";
import { parseAuthError } from "@/lib/parseAuthError";
import { AuthResponse, User } from "@/type"

interface AuthState {
  accessToken: string | null;
  user: User | null;
  authReady: boolean;
  error: string | null;

  setAccessToken: (token: string | null) => void;
  clearError: () => void;
  login: (identifier: string, password: string) => Promise<void>;
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;

    // 회원가입 처리
  handleRegister: (data:{
    username: string;
    email: string;
    password: string;
    avatar: string;
  }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  authReady: false,
  error: null,

  setAccessToken: (token) => set({ accessToken: token }),
  clearError: () => set({ error: null }),

  /**
   * 🔐 로그인
   */
  login: async (identifier, password) => {
    try {
      const data = await apiClient<AuthResponse>("/api/session/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      set({
        accessToken: data.jwt,
        user: data.user,
        authReady: true,
        error: null,
      });
    } catch (err) {
      set({
        accessToken: null,
        user: null,
        authReady: true,
        error: parseAuthError(err),
      });
      throw err;
    }
  },


  /**
   * 🔐 회원가입(avatar는 register에서 받아들여지지 못하기때문에 가입시에는 없이 진행하고 가입성공시 생긴유저에대해서 avatar를 업데이트 하는형태로 하였다.)
   */
  handleRegister: async (data) => {
    try {
      // 1️⃣ avatar 분리
      const { avatar, ...rest } = data;

      // 2️⃣ 회원가입
      const res = await apiClient<AuthResponse>("/api/auth/local/register", {
        method: "POST",
        body: JSON.stringify(rest),
      });

      // 3️⃣ 로그인(위에 가입된 유저를 자동 로그인 시킨다.)
      await get().login(rest.email, rest.password);

      // 4️⃣ 로그인후 유저 정보에서 avatar 업데이트(register에서 받아야들여지지 않으므로 별도로 처리한것)
      if (avatar) {
        await apiClient<User>(`/api/users/${res.user.id}`, {
          method: "PUT",
          body: JSON.stringify({
            avatar,
          }),
          auth: true, // 👉 이제 정상 동작
        });
      }
    } catch (err) {
      //회원가입 실패시 처리 추가 필요!!
      throw err;
    }
  },


  /**
   * 🔄 새로고침 시 로그인 복구
   * - refreshToken(HttpOnly 쿠키) 기반
   */
  restoreSession: async () => {
    try {
      // 테스트용 딜레이
      await new Promise((r) => setTimeout(r, 500)); // 일부러 0.5초 기다리기
      const data = await apiClient<AuthResponse>("/api/session/refresh", {
        method: "POST",
      });

      set({
        accessToken: data.jwt,
        user: data.user,
        authReady: true,
        error: null,
      });
    } catch {
      // 핵심: 세션 종료 확정
      set({
        accessToken: null,
        user: null,
        authReady: true,
        error: null,
      });
    }
  },







  /**
   * 🚪 로그아웃
   */
  logout: async () => {
    try {
      await apiClient<{ ok: boolean }>("/api/session/logout", {
        method: "POST",
      });
    } catch {
      // 서버 실패해도 클라이언트 정리는 진행 필요
    } finally {
      set({
        accessToken: null,
        user: null,
        authReady: true,
        error: null,
      });
    }
  },
}));
