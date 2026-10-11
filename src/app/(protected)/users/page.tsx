"use client";

import { useAuthStore } from "@/store/authStore";
import type { User } from "@/type";

export default function HomePage() {
  // ✅ 필요한 것만 selector로 구독 (리렌더 최소화)
  const authReady = useAuthStore((s) => s.authReady);

  // const users = useUserStore((s) => s.users);
  // const loading = useUserStore((s) => s.loading);
  // const error = useUserStore((s) => s.error);
  // const fetchUsers = useUserStore((s) => s.fetchUsers);

  // ✅ authReady 된 이후에만 호출 (새로고침 시 순서 안정)
  // useEffect(() => {
  //   if (!authReady) return;
  //   fetchUsers();
  // }, [authReady, fetchUsers]);
const loading = false;
const error = null;
const users: User[] = [];
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">사용자 목록</h1>

      {/* 인증 확인 중 */}
      {!authReady && (
        <p className="text-sm text-gray-500">로그인 상태 확인 중...</p>
      )}

      {/* 로딩 */}
      {authReady && loading && (
        <p className="text-sm text-gray-500">불러오는 중...</p>
      )}

      {/* 에러 */}
      {authReady && error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* 데이터 */}
      {authReady && !loading && !error && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="border-b px-4 py-2">ID</th>
                <th className="border-b px-4 py-2">Username</th>
                <th className="border-b px-4 py-2">Email</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    사용자 데이터가 없습니다.
                  </td>
                </tr>
              )}

              {users.map((user) => (
                <tr key={user.id} className="transition hover:bg-gray-50">
                  <td className="border-b px-4 py-2">{user.id}</td>
                  <td className="border-b px-4 py-2">{user.username}</td>
                  <td className="border-b px-4 py-2">{user.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
