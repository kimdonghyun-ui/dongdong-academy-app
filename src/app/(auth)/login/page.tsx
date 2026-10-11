"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const accessToken = useAuthStore((s) => s.accessToken);

  // const [id, setId] = useState("fogtime@naver.com");
  // const [pw, setPw] = useState("hello123");
  const [id, setId] = useState("test1004@test.com");
  const [pw, setPw] = useState("hello123");



  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !pw) return;
    setLoading(true);
    try {
      await login(id, pw);
      router.replace(redirect || "/");
    } catch {
      // 에러는 스토어 error로 표시
    }
    setLoading(false);
  };

  useEffect(() => {
    if (accessToken) {
      router.replace("/");
    }
  }, [accessToken, router]);

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* 브랜드 */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCapIcon className="size-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">교습노트</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            1인 교습소 관리에 로그인하세요
          </p>
        </div>

        {/* 폼 카드 */}
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col gap-1 px-5 pt-5 pb-2">
            <h2 className="text-base font-bold leading-tight">로그인</h2>
            <p className="text-sm text-muted-foreground">
              계정 정보를 입력해주세요
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4 px-5 pb-5 pt-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="identifier"
                className="text-sm font-medium text-foreground"
              >
                이메일
              </label>
              <input
                id="identifier"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="example@email.com"
                autoComplete="username"
                className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !id || !pw}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          계정이 없으신가요?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}

function GraduationCapIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <path d="M22 10v6" />
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </svg>
  );
}
