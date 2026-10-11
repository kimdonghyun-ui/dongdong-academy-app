/**
 * 학원 설정 스토어
 * - 하는 일: 선생님별 설정 불러오기/저장
 * - 설정이 아직 없으면 POST로 만들고, 있으면 PUT으로 수정
 * - 변환: settingsMapper.ts
 */
import { create } from "zustand"

import { apiClient } from "@/lib/apiClient"
import { parseAuthError } from "@/lib/authHelpers"
import {
  EMPTY_SETTINGS,
  toSettings,
  type TeacherSettingDoc,
} from "@/lib/settingsMapper"
import { useAuthStore } from "@/store/authStore"
import type {
  AcademySettings,
  StrapiListResponse,
  StrapiSingleResponse,
} from "@/type"

const ENDPOINT = "/api/academy-teacher-settings"

interface SettingsState {
  /** 화면에 보이는 설정 값 */
  settings: AcademySettings
  /** 서버에 있는 그 설정 문서 id (없으면 아직 저장한 적 없음) */
  documentId: string | null
  loading: boolean
  saving: boolean
  error: string | null
  /** 이 설정을 불러온 선생님 id */
  fetchedUserId: number | null

  fetchSettings: () => Promise<void>
  updateSettings: (next: AcademySettings) => Promise<void>
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: EMPTY_SETTINGS,
  documentId: null,
  loading: false,
  saving: false,
  error: null,
  fetchedUserId: null,

  /** 로그아웃할 때 설정 비우기 */
  resetSettings: () => {
    set({
      settings: EMPTY_SETTINGS,
      documentId: null,
      loading: false,
      saving: false,
      error: null,
      fetchedUserId: null,
    })
  },

  /** 로그인한 선생님의 설정 1건 가져오기 */
  fetchSettings: async () => {
    const user = useAuthStore.getState().user
    if (!user) {
      get().resetSettings()
      return
    }

    set({ loading: true, error: null })
    try {
      const query = new URLSearchParams({
        "filters[owner][id][$eq]": String(user.id),
        "pagination[pageSize]": "1",
      })
      const res = await apiClient<StrapiListResponse<TeacherSettingDoc>>(
        `${ENDPOINT}?${query.toString()}`,
        { auth: true },
      )
      const doc = res.data[0] ?? null
      set({
        settings: doc ? toSettings(doc) : EMPTY_SETTINGS,
        documentId: doc?.documentId ?? null,
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

  /** 설정 저장 (없으면 만들고, 있으면 고침) */
  updateSettings: async (next) => {
    const user = useAuthStore.getState().user
    if (!user) {
      throw new Error("AUTH_REQUIRED")
    }

    set({ saving: true, error: null })
    try {
      const documentId = get().documentId
      const res = documentId
        ? // 이미 있음 → 수정
          await apiClient<StrapiSingleResponse<TeacherSettingDoc>>(
            `${ENDPOINT}/${documentId}`,
            {
              method: "PUT",
              body: JSON.stringify({ data: next }),
              auth: true,
            },
          )
        : // 아직 없음 → 새로 만들기
          await apiClient<StrapiSingleResponse<TeacherSettingDoc>>(ENDPOINT, {
            method: "POST",
            body: JSON.stringify({
              data: {
                ...next,
                owner: user.id,
              },
            }),
            auth: true,
          })

      set({
        settings: toSettings(res.data),
        documentId: res.data.documentId,
        saving: false,
        fetchedUserId: user.id,
      })
    } catch (err) {
      set({
        saving: false,
        error: parseAuthError(err),
      })
      throw err
    }
  },
}))
