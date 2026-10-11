"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { NoticeType, Student } from "@/type"

interface NoticeEditorProps {
  students: Student[]
  academyName: string
  noticeFooter: string
}

const NOTICE_TYPES: { value: NoticeType; label: string }[] = [
  { value: "unpaid", label: "수강료 미납" },
  { value: "schedule", label: "수업 일정 변경" },
  { value: "closure", label: "휴원 안내" },
  { value: "supplies", label: "준비물 안내" },
  { value: "custom", label: "직접 작성" },
]

const TEMPLATES: Record<NoticeType, { title: string; body: string }> = {
  unpaid: {
    title: "[{academy}] 수강료 납부 안내",
    body: "안녕하세요, {academy}입니다.\n이번 달 수강료가 아직 납부되지 않아 안내드립니다.\n확인 후 납부 부탁드립니다. 감사합니다.",
  },
  schedule: {
    title: "[{academy}] 수업 일정 변경 안내",
    body: "안녕하세요, {academy}입니다.\n수업 일정이 변경되어 안내드립니다.\n변경된 일정: \n확인 부탁드립니다. 감사합니다.",
  },
  closure: {
    title: "[{academy}] 휴원 안내",
    body: "안녕하세요, {academy}입니다.\n아래 기간 동안 휴원 예정임을 안내드립니다.\n휴원 기간: \n양해 부탁드립니다. 감사합니다.",
  },
  supplies: {
    title: "[{academy}] 준비물 안내",
    body: "안녕하세요, {academy}입니다.\n다음 수업 준비물을 안내드립니다.\n준비물: \n잊지 말고 챙겨주세요. 감사합니다.",
  },
  custom: {
    title: "",
    body: "",
  },
}

export function NoticeEditor({
  students,
  academyName,
  noticeFooter,
}: NoticeEditorProps) {
  const [type, setType] = useState<NoticeType>("unpaid")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [title, setTitle] = useState(
    TEMPLATES.unpaid.title.replace("{academy}", academyName),
  )
  const [content, setContent] = useState(
    TEMPLATES.unpaid.body.replace(/{academy}/g, academyName),
  )
  const [copied, setCopied] = useState(false)

  function applyType(next: NoticeType) {
    setType(next)
    const tpl = TEMPLATES[next]
    setTitle(tpl.title.replace("{academy}", academyName))
    setContent(tpl.body.replace(/{academy}/g, academyName))
    setCopied(false)
  }

  function toggleStudent(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const recipients = students.filter((s) => selectedIds.includes(s.id))
  const recipientText =
    recipients.length > 0
      ? recipients.map((s) => `${s.name} 학부모님`).join(", ")
      : "학부모님"

  const preview = `${recipientText}\n\n${content}\n\n${noticeFooter}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${title}\n\n${preview}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ntype">안내문 유형</Label>
          <Select
            id="ntype"
            value={type}
            onChange={(e) => applyType(e.target.value as NoticeType)}
          >
            {NOTICE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>수신 학생</Label>
          <div className="flex flex-wrap gap-1.5">
            {students.map((s) => {
              const selected = selectedIds.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleStudent(s.id)}
                  aria-pressed={selected}
                  className={cn(
                    "h-9 rounded-lg border px-3 text-sm font-medium transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-card text-foreground hover:bg-muted",
                  )}
                >
                  {s.name}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ntitle">제목</Label>
          <Input
            id="ntitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="안내문 제목"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ncontent">내용</Label>
          <Textarea
            id="ncontent"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-40"
            placeholder="안내문 내용을 입력하세요."
          />
        </div>
      </div>

      <Card className="lg:sticky lg:top-6 lg:self-start">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>미리보기</CardTitle>
          <Button className="h-10 px-4" onClick={handleCopy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "복사됨" : "복사"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            {title ? <p className="font-bold">{title}</p> : null}
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
              {preview}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
