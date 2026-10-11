"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useSettingsStore } from "@/store/settingsStore"
import { useThemeStore, type Theme } from "@/store/themeStore"

export function SettingsForm() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const settings = useSettingsStore((s) => s.settings)
  const loading = useSettingsStore((s) => s.loading)
  const saving = useSettingsStore((s) => s.saving)
  const error = useSettingsStore((s) => s.error)
  const fetchedUserId = useSettingsStore((s) => s.fetchedUserId)
  const updateSettings = useSettingsStore((s) => s.updateSettings)

  const [academyName, setAcademyName] = useState(settings.academyName)
  const [teacherName, setTeacherName] = useState(settings.teacherName)
  const [phone, setPhone] = useState(settings.phone)
  const [defaultPaymentDay, setDefaultPaymentDay] = useState(
    String(settings.defaultPaymentDay),
  )
  const [noticeFooter, setNoticeFooter] = useState(settings.noticeFooter)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setAcademyName(settings.academyName)
    setTeacherName(settings.teacherName)
    setPhone(settings.phone)
    setDefaultPaymentDay(String(settings.defaultPaymentDay))
    setNoticeFooter(settings.noticeFooter)
  }, [settings])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    try {
      await updateSettings({
        academyName: academyName.trim() || settings.academyName,
        teacherName: teacherName.trim() || settings.teacherName,
        phone: phone.trim(),
        defaultPaymentDay: Number(defaultPaymentDay) || 10,
        noticeFooter: noticeFooter.trim(),
      })
      setSaved(true)
    } catch {
      // 에러는 store.error에 표시
    }
  }

  const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "라이트", icon: Sun },
    { value: "dark", label: "다크", icon: Moon },
  ]

  if (loading || fetchedUserId === null) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        설정을 불러오는 중...
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>화면 설정</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <Label>테마</Label>
          <div className="inline-flex w-fit rounded-lg border border-border p-0.5">
            {themeOptions.map((option) => {
              const selected = theme === option.value
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  aria-pressed={selected}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {option.label}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            선택한 테마는 이 브라우저에 저장됩니다.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>교습소 정보</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="academyName">교습소 이름</Label>
            <Input
              id="academyName"
              value={academyName}
              onChange={(e) => {
                setAcademyName(e.target.value)
                setSaved(false)
              }}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="teacherName">선생님 이름</Label>
              <Input
                id="teacherName"
                value={teacherName}
                onChange={(e) => {
                  setTeacherName(e.target.value)
                  setSaved(false)
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">연락처</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  setSaved(false)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>수업 운영</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="paymentDay">기본 수강료 납부일 (매월)</Label>
            <Input
              id="paymentDay"
              type="number"
              min="1"
              max="31"
              value={defaultPaymentDay}
              onChange={(e) => {
                setDefaultPaymentDay(e.target.value)
                setSaved(false)
              }}
              className="sm:w-32"
            />
            <p className="text-xs text-muted-foreground">
              학생 등록 시 납부일 기본값으로 사용됩니다.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>안내문 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="noticeFooter">안내문 하단 기본 문구</Label>
            <Textarea
              id="noticeFooter"
              value={noticeFooter}
              onChange={(e) => {
                setNoticeFooter(e.target.value)
                setSaved(false)
              }}
              placeholder="예: 동동 학습교습소 · 문의 010-1234-5678"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {saved ? (
          <span className="flex items-center gap-1.5 text-sm text-success-foreground">
            <CheckCircle2 className="size-4" />
            저장되었습니다
          </span>
        ) : null}
        <Button type="submit" className="h-10 px-5" disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </form>
  )
}
