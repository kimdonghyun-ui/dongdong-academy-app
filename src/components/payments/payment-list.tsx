"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { PaymentForm } from "@/components/payments/payment-form"
import { formatKoreanMonth } from "@/lib/date"
import {
  formatWon,
  paymentStatusLabel,
  paymentStatusVariant,
} from "@/lib/format"
import { usePaymentStore } from "@/store/paymentStore"
import { useStudentStore } from "@/store/studentStore"
import type { Payment, PaymentStatus } from "@/type"

interface PaymentListProps {
  months: string[]
  defaultMonth: string
}

export function PaymentList({ months, defaultMonth }: PaymentListProps) {
  const students = useStudentStore((s) => s.students)
  const payments = usePaymentStore((s) => s.payments)
  const saving = usePaymentStore((s) => s.saving)
  const updatePayment = usePaymentStore((s) => s.updatePayment)
  const ensureMonthPayments = usePaymentStore((s) => s.ensureMonthPayments)
  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]))

  const [month, setMonth] = useState(defaultMonth)
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all")
  const [editing, setEditing] = useState<Payment | null>(null)

  const monthPayments = payments.filter((p) => p.month === month)
  const filtered = monthPayments.filter(
    (p) => statusFilter === "all" || p.status === statusFilter,
  )

  // 아직 그달 청구가 없는 활성 학생 수 (버튼 노출·안내용)
  const missingCount = students.filter(
    (s) =>
      s.status === "active" &&
      !monthPayments.some((p) => p.studentId === s.id),
  ).length

  const expectedTotal = monthPayments.reduce(
    (sum, p) => sum + p.expectedAmount,
    0,
  )
  const paidTotal = monthPayments.reduce((sum, p) => sum + p.paidAmount, 0)
  const unpaidTotal = expectedTotal - paidTotal

  async function handleSubmit(updated: Payment) {
    await updatePayment(updated)
    setEditing(null)
  }

  async function handleEnsureMonth() {
    await ensureMonthPayments(month, students)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="sm:w-40"
          aria-label="월 선택"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {formatKoreanMonth(m)}
            </option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as PaymentStatus | "all")
          }
          className="sm:w-36"
          aria-label="납부 상태 필터"
        >
          <option value="all">전체 상태</option>
          <option value="paid">납부</option>
          <option value="unpaid">미납</option>
          <option value="partial">일부 납부</option>
        </Select>
        {missingCount > 0 ? (
          <Button
            className="h-10 px-4 sm:ml-auto"
            disabled={saving}
            onClick={() => void handleEnsureMonth()}
          >
            {formatKoreanMonth(month)} 청구 만들기 ({missingCount}명)
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">예정 금액</p>
          <p className="mt-1 text-base font-bold sm:text-lg">
            {formatWon(expectedTotal)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">납부 금액</p>
          <p className="mt-1 text-base font-bold text-success-foreground sm:text-lg">
            {formatWon(paidTotal)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">미납 금액</p>
          <p className="mt-1 text-base font-bold text-destructive sm:text-lg">
            {formatWon(unpaidTotal)}
          </p>
        </Card>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {missingCount > 0
            ? "아직 이달 청구가 없습니다. 위에서 활성 학생 청구를 만들어 주세요."
            : "해당 조건의 수강료 내역이 없습니다."}
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((p) => {
            const student = studentMap[p.studentId]
            return (
              <Card key={p.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{student?.name}</p>
                      <Badge variant={paymentStatusVariant(p.status)}>
                        {paymentStatusLabel[p.status]}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      납부 예정일 {p.dueDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatWon(p.paidAmount)}
                        <span className="text-muted-foreground">
                          {" "}
                          / {formatWon(p.expectedAmount)}
                        </span>
                      </p>
                    </div>
                    <Button
                      variant={p.status === "paid" ? "outline" : "default"}
                      className="h-10 px-4"
                      onClick={() => setEditing(p)}
                    >
                      {p.status === "paid" ? "수정" : "납부 처리"}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {editing ? (
        <PaymentForm
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          payment={editing}
          studentName={studentMap[editing.studentId]?.name ?? ""}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  )
}
