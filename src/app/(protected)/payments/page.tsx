"use client"

import { useMemo } from "react"

import { PaymentList } from "@/components/payments/payment-list"
import { toDateString, toMonthString } from "@/lib/date"
import { usePaymentStore } from "@/store/paymentStore"

export default function PaymentsPage() {
  const payments = usePaymentStore((s) => s.payments)
  const currentMonth = toMonthString(toDateString(new Date()))

  const months = useMemo(() => {
    const set = new Set<string>([currentMonth])
    for (const p of payments) {
      if (p.month) set.add(p.month)
    }
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [payments, currentMonth])

  return <PaymentList months={months} defaultMonth={currentMonth} />
}
