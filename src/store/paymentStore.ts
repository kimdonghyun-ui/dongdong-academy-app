/**
 * 수납 스토어
 * - 하는 일: 수강료 납부 목록 + Strapi 불러오기/생성/수정
 * - 월별 청구는 활성 학생의 monthlyFee/paymentDay로 만든다
 * - 변환: paymentMapper.ts
 */
import { create } from "zustand"

import { apiClient } from "@/lib/apiClient"
import { getAuthUser, parseAuthError } from "@/lib/authHelpers"
import {
  buildPaymentFromStudent,
  paymentMatchKey,
  toPayment,
  toPaymentFromResponse,
  toPaymentWrite,
  type PaymentDoc,
} from "@/lib/paymentMapper"
import { useAuthStore } from "@/store/authStore"
import type {
  Payment,
  StrapiListResponse,
  StrapiSingleResponse,
  Student,
} from "@/type"

const ENDPOINT = "/api/academy-payments"

interface PaymentState {
  /** 수납 목록 */
  payments: Payment[]
  loading: boolean
  saving: boolean
  error: string | null
  fetchedUserId: number | null

  fetchPayments: () => Promise<void>
  createPayment: (payment: Payment) => Promise<Payment>
  updatePayment: (payment: Payment) => Promise<Payment>
  /** 해당 월에 없는 활성 학생 청구만 생성. 생성 건수 반환 */
  ensureMonthPayments: (
    month: string,
    students: Student[],
  ) => Promise<number>
  resetPayments: () => void
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  payments: [],
  loading: false,
  saving: false,
  error: null,
  fetchedUserId: null,

  /** 로그아웃할 때 목록 비우기 */
  resetPayments: () => {
    set({
      payments: [],
      loading: false,
      saving: false,
      error: null,
      fetchedUserId: null,
    })
  },

  /** 내 수납 목록 불러오기 */
  fetchPayments: async () => {
    const user = useAuthStore.getState().user
    if (!user) {
      get().resetPayments()
      return
    }

    set({ loading: true, error: null })
    try {
      const query = new URLSearchParams({
        "filters[owner][id][$eq]": String(user.id),
        "pagination[pageSize]": "200",
        "populate[student]": "true",
        sort: "month:desc",
      })
      const res = await apiClient<StrapiListResponse<PaymentDoc>>(
        `${ENDPOINT}?${query.toString()}`,
        { auth: true },
      )
      set({
        payments: res.data
          .map(toPayment)
          .filter((p): p is Payment => p !== null),
        loading: false,
        fetchedUserId: user.id,
      })
    } catch (err) {
      set({
        loading: false,
        fetchedUserId: user.id,
        error: parseAuthError(err),
      })
    }
  },

  /** 수납 건 새로 만들기 */
  createPayment: async (payment) => {
    const user = getAuthUser()
    set({ saving: true, error: null })
    try {
      const res = await apiClient<StrapiSingleResponse<PaymentDoc>>(ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          data: {
            ...toPaymentWrite(payment),
            owner: user.id,
          },
        }),
        auth: true,
      })
      const created = toPaymentFromResponse(res.data, payment)
      set((state) => ({
        payments: [created, ...state.payments],
        saving: false,
        fetchedUserId: user.id,
      }))
      return created
    } catch (err) {
      set({ saving: false, error: parseAuthError(err) })
      throw err
    }
  },

  /** 납부 금액/상태 등 수정 */
  updatePayment: async (payment) => {
    const user = getAuthUser()
    set({ saving: true, error: null })
    try {
      const res = await apiClient<StrapiSingleResponse<PaymentDoc>>(
        `${ENDPOINT}/${payment.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ data: toPaymentWrite(payment) }),
          auth: true,
        },
      )
      const updated = toPaymentFromResponse(res.data, payment)
      set((state) => ({
        payments: state.payments.map((p) =>
          p.id === updated.id ? updated : p,
        ),
        saving: false,
        fetchedUserId: user.id,
      }))
      return updated
    } catch (err) {
      set({ saving: false, error: parseAuthError(err) })
      throw err
    }
  },

  /**
   * 선택한 월 청구가 없는 활성 학생만 POST
   * 이미 있는 student+month는 건너뛴다
   */
  ensureMonthPayments: async (month, students) => {
    const user = getAuthUser()
    const existingKeys = new Set(
      get()
        .payments.filter((p) => p.month === month)
        .map((p) => paymentMatchKey(p)),
    )
    const targets = students.filter(
      (s) =>
        s.status === "active" &&
        !existingKeys.has(paymentMatchKey({ studentId: s.id, month })),
    )
    if (targets.length === 0) return 0

    set({ saving: true, error: null })
    try {
      const created: Payment[] = []
      for (const student of targets) {
        const draft = buildPaymentFromStudent(student, month)
        const res = await apiClient<StrapiSingleResponse<PaymentDoc>>(
          ENDPOINT,
          {
            method: "POST",
            body: JSON.stringify({
              data: {
                ...toPaymentWrite(draft),
                owner: user.id,
              },
            }),
            auth: true,
          },
        )
        created.push(toPaymentFromResponse(res.data, draft))
      }
      set((state) => ({
        payments: [...created, ...state.payments],
        saving: false,
        fetchedUserId: user.id,
      }))
      return created.length
    } catch (err) {
      set({ saving: false, error: parseAuthError(err) })
      throw err
    }
  },
}))
