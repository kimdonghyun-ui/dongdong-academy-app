/**
 * 출석 스토어
 * - 하는 일: 출석 기록 목록 + Strapi 불러오기/저장
 * - 변환: attendanceMapper.ts
 * - 저장: 이미 있으면 수정(PUT), 없으면 새로 만들기(POST)
 */
import { create } from "zustand"

import { apiClient } from "@/lib/apiClient"
import {
  attendanceMatchKey,
  toAttendance,
  toAttendanceFromResponse,
  toAttendanceWrite,
  type AttendanceDoc,
} from "@/lib/attendanceMapper"
import { getAuthUser, parseAuthError } from "@/lib/authHelpers"
import { useAuthStore } from "@/store/authStore"
import type {
  AttendanceRecord,
  StrapiListResponse,
  StrapiSingleResponse,
} from "@/type"

const ENDPOINT = "/api/academy-attendances"

interface AttendanceState {
  /** 출석 기록들 */
  records: AttendanceRecord[]
  loading: boolean
  saving: boolean
  error: string | null
  fetchedUserId: number | null

  fetchAttendances: () => Promise<void>
  saveRecords: (records: AttendanceRecord[]) => Promise<void>
  resetAttendances: () => void
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  records: [],
  loading: false,
  saving: false,
  error: null,
  fetchedUserId: null,

  /** 로그아웃할 때 기록 비우기 */
  resetAttendances: () => {
    set({
      records: [],
      loading: false,
      saving: false,
      error: null,
      fetchedUserId: null,
    })
  },

  /** 내 출석 기록 불러오기 */
  fetchAttendances: async () => {
    const user = useAuthStore.getState().user
    if (!user) {
      get().resetAttendances()
      return
    }

    set({ loading: true, error: null })
    try {
      const query = new URLSearchParams({
        "filters[owner][id][$eq]": String(user.id),
        "pagination[pageSize]": "200",
        "populate[student]": "true",
        "populate[lesson]": "true",
        sort: "date:desc",
      })
      const res = await apiClient<StrapiListResponse<AttendanceDoc>>(
        `${ENDPOINT}?${query.toString()}`,
        { auth: true },
      )
      set({
        records: res.data
          .map(toAttendance)
          .filter((r): r is AttendanceRecord => r !== null),
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

  /**
   * 출석 화면에서 저장
   * - 같은 날짜+수업+학생 기록이 있으면 → 수정
   * - 없으면 → 새로 만들기
   */
  saveRecords: async (incoming) => {
    const user = getAuthUser()
    set({ saving: true, error: null })
    try {
      // 기존 기록을 "날짜_수업_학생" 키로 찾아보기 쉽게 만듦
      const existingByKey = new Map(
        get().records.map((r) => [attendanceMatchKey(r), r]),
      )
      const upserted: AttendanceRecord[] = []

      for (const record of incoming) {
        const key = attendanceMatchKey(record)
        const existing = existingByKey.get(key)
        const payload = toAttendanceWrite(record)

        if (existing) {
          // 이미 있음 → 수정
          const res = await apiClient<StrapiSingleResponse<AttendanceDoc>>(
            `${ENDPOINT}/${existing.id}`,
            {
              method: "PUT",
              body: JSON.stringify({ data: payload }),
              auth: true,
            },
          )
          const updated = toAttendanceFromResponse(res.data, record)
          if (updated) upserted.push(updated)
        } else {
          // 없음 → 새로 만들기
          const res = await apiClient<StrapiSingleResponse<AttendanceDoc>>(
            ENDPOINT,
            {
              method: "POST",
              body: JSON.stringify({
                data: {
                  ...payload,
                  owner: user.id,
                },
              }),
              auth: true,
            },
          )
          const created = toAttendanceFromResponse(res.data, record)
          if (created) upserted.push(created)
        }
      }

      // 화면에 보이는 목록도 바로 갱신
      set((state) => {
        const byKey = new Map(
          state.records.map((r) => [attendanceMatchKey(r), r]),
        )
        for (const r of upserted) {
          byKey.set(attendanceMatchKey(r), r)
        }
        return {
          records: [...byKey.values()],
          saving: false,
          fetchedUserId: user.id,
        }
      })
    } catch (err) {
      set({ saving: false, error: parseAuthError(err) })
      throw err
    }
  },
}))
