/**
 * 보호할 페이지 경로 목록
 * proxy.ts 에서 "로그인 안 된 사람은 못 들어가게" 할 때 쓴다.
 * ("/students" 면 /students/123 같은 하위 경로도 포함)
 */
export const PROTECTED_PATHS = [
  "/",
  "/dashboard",
  "/students",
  "/attendance",
  "/lessons",
  "/payments",
  "/notices",
  "/settings",
]
