"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Payment, PaymentMethod } from "@/type"

interface PaymentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment: Payment
  studentName: string
  onSubmit: (payment: Payment) => void | Promise<void>
}

export function PaymentForm({
  open,
  onOpenChange,
  payment,
  studentName,
  onSubmit,
}: PaymentFormProps) {
  const [paidDate, setPaidDate] = useState(
    payment.paidDate ?? payment.dueDate,
  )
  const [amount, setAmount] = useState(
    String(payment.paidAmount || payment.expectedAmount),
  )
  const [method, setMethod] = useState<PaymentMethod>(
    payment.method ?? "transfer",
  )
  const [memo, setMemo] = useState(payment.memo ?? "")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const paidAmount = Number(amount) || 0
    const status =
      paidAmount >= payment.expectedAmount
        ? "paid"
        : paidAmount > 0
          ? "partial"
          : "unpaid"
    await onSubmit({
      ...payment,
      paidAmount,
      status,
      paidDate,
      method,
      memo: memo.trim(),
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="납부 처리"
      description={`${studentName} 학생`}
      footer={
        <>
          <Button
            variant="outline"
            className="h-10 px-4"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button type="submit" form="payment-form" className="h-10 px-4">
            저장
          </Button>
        </>
      }
    >
      <form
        id="payment-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="paidDate">납부일</Label>
          <Input
            id="paidDate"
            type="date"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount">납부 금액 (원)</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="10000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            예정 금액: {payment.expectedAmount.toLocaleString("ko-KR")}원
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="method">결제 방법</Label>
          <Select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          >
            <option value="transfer">계좌이체</option>
            <option value="cash">현금</option>
            <option value="card">카드</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pmemo">메모</Label>
          <Textarea
            id="pmemo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예: 절반 선납"
          />
        </div>
      </form>
    </Dialog>
  )
}
