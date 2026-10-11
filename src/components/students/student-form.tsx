"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useSettingsStore } from "@/store/settingsStore"
import type { Student, StudentStatus } from "@/type"

interface StudentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Student
  onSubmit: (student: Student) => void | Promise<void>
}

export function StudentForm({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: StudentFormProps) {
  const defaultPaymentDay = useSettingsStore(
    (s) => s.settings.defaultPaymentDay,
  )
  const [name, setName] = useState(initial?.name ?? "")
  const [school, setSchool] = useState(initial?.school ?? "")
  const [grade, setGrade] = useState(initial?.grade ?? "")
  const [subject, setSubject] = useState(initial?.subject ?? "초등 수학")
  const [guardianName, setGuardianName] = useState(initial?.guardianName ?? "")
  const [guardianPhone, setGuardianPhone] = useState(
    initial?.guardianPhone ?? "",
  )
  const [monthlyFee, setMonthlyFee] = useState(
    initial ? String(initial.monthlyFee) : "",
  )
  const [paymentDay, setPaymentDay] = useState(
    initial ? String(initial.paymentDay) : String(defaultPaymentDay),
  )
  const [status, setStatus] = useState<StudentStatus>(
    initial?.status ?? "active",
  )
  const [memo, setMemo] = useState(initial?.memo ?? "")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({
      id: initial?.id ?? `s${Date.now()}`,
      name: name.trim(),
      school: school.trim(),
      grade: grade.trim(),
      subject,
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      monthlyFee: Number(monthlyFee) || 0,
      paymentDay: Number(paymentDay) || defaultPaymentDay,
      status,
      memo: memo.trim(),
      createdAt: initial?.createdAt ?? new Date().toISOString().slice(0, 10),
    })
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "학생 정보 수정" : "학생 등록"}
      description="기본 정보를 입력하세요. 수업 배정은 수업 일정에서 합니다."
      footer={
        <>
          <Button
            variant="outline"
            className="h-10 px-4"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button type="submit" form="student-form" className="h-10 px-4">
            저장
          </Button>
        </>
      }
    >
      <form
        id="student-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">학생 이름 *</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 김민준"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="school">학교</Label>
            <Input
              id="school"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="예: 푸른초등학교"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="grade">학년</Label>
            <Input
              id="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="예: 초5"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="subject">과목</Label>
          <Select
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="초등 수학">초등 수학</option>
            <option value="중등 수학">중등 수학</option>
            <option value="초등 영어">초등 영어</option>
            <option value="중등 영어">중등 영어</option>
            <option value="초등 국어">초등 국어</option>
            <option value="중등 국어">중등 국어</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="guardianName">보호자 이름</Label>
            <Input
              id="guardianName"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              placeholder="예: 김민준 학부모"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="guardianPhone">보호자 연락처</Label>
            <Input
              id="guardianPhone"
              type="tel"
              value={guardianPhone}
              onChange={(e) => setGuardianPhone(e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="monthlyFee">월 수강료 (원)</Label>
            <Input
              id="monthlyFee"
              type="number"
              min="0"
              step="10000"
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(e.target.value)}
              placeholder="예: 200000"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="paymentDay">납부일 (매월)</Label>
            <Input
              id="paymentDay"
              type="number"
              min="1"
              max="31"
              value={paymentDay}
              onChange={(e) => setPaymentDay(e.target.value)}
              placeholder="예: 10"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">상태</Label>
          <Select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as StudentStatus)}
          >
            <option value="active">수강 중</option>
            <option value="paused">휴원</option>
            <option value="ended">종료</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="memo">메모</Label>
          <Textarea
            id="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="학생 특이사항, 상담 내용 등"
          />
        </div>
      </form>
    </Dialog>
  )
}
