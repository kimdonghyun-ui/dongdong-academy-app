import { useAuthStore } from "@/store/authStore";

/**
 * fetch 옵션 + 인증 여부 옵션
 * auth: true  → accessToken 필요
 * auth: false → public API
 */
type ApiOptions = RequestInit & {
  auth?: boolean;
};

/**
 * 공통 API 클라이언트
 *
 * 역할:
 * 1. fetch 공통화
 * 2. auth=true면 accessToken 자동 첨부
 * 3. accessToken 만료 시 refresh 시도
 * 4. refresh 실패 or 인증 에러면 세션 종료
 */
export async function apiClient<T = unknown>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  const { auth = false, ...fetchOptions } = options;

  /**
   * Zustand 스토어에서 현재 인증 상태 조회
   */
  const store = useAuthStore.getState();
  const token = store.accessToken;



/**
 * 인증 요청인데 accessToken이 없는 경우
 * → 요청 자체를 보내지 않음
 */
if (auth && !token) {
  // 여기서 logout까지 할지는 선택
  // 보통은 그냥 인증 필요 에러만 던짐
  throw new Error("AUTH_REQUIRED");
}




  /**
   * headers 구성
   */
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
		...(isFormData ? {} : { "Content-Type": "application/json" }), // ✅ FormData일 땐 제거
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  /**
   * 인증 요청(auth=true)이면 Authorization 헤더 추가
   */
  if (auth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  /**
   * 1️⃣ 최초 요청
   */
  let res = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}${url}`,
    {
      ...fetchOptions,
      headers,
      credentials: "include", // refreshToken(HttpOnly 쿠키)
    }
  );

  /**
   * 2️⃣ accessToken 만료 → refresh 시도
   */
  if (auth && res.status === 401) {
    const refreshRes = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/session/refresh`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    /**
     * refresh 실패 → 세션 종료 확정
     */
    if (!refreshRes.ok) {
      useAuthStore.getState().logout();
      throw new Error("AUTH_REQUIRED");
    }

    /**
     * refresh 성공 → 새 accessToken 저장
     */
    const { jwt: newToken } = await refreshRes.json();

    useAuthStore.getState().setAccessToken(newToken);

    headers["Authorization"] = `Bearer ${newToken}`;

    /**
     * 3️⃣ 원래 요청 재시도
     */
    res = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}${url}`,
      {
        ...fetchOptions,
        headers,
        credentials: "include",
      }
    );
  }

  /**
   * 4️⃣ 공통 에러 처리
   */
  if (!res.ok) {
    /**
     * 🔐 인증 요청에서의 401 / 403
     * → 인증 붕괴로 간주
     */
    if (auth && (res.status === 401 || res.status === 403)) {
      useAuthStore.getState().logout();
      throw new Error("AUTH_REQUIRED");
    }

    /**
     * 일반 API 에러
     */
    let message = "API Error";

    try {
      const err = await res.json();
      message = err?.error?.message || message;
    } catch {
      // JSON 파싱 실패 무시
    }

    throw new Error(message);
  }

  /**
   * 5️⃣ 정상 응답
   */
  return res.json();
}
