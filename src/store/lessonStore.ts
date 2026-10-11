/**
 * 수업 스토어
 * - 하는 일: 정규/추가 수업 목록 + Strapi 불러오기/추가/수정
 * - 변환: lessonMapper.ts (요일 mon↔월 등)
 */
import { create } from "zustand"

import { apiClient } from "@/lib/apiClient"
import { getAuthUser, parseAuthError } from "@/lib/authHelpers"
import {
  toLesson,
  toLessonFromResponse,
  toLessonWrite,
  type LessonDoc,
} from "@/lib/lessonMapper"
import { useAuthStore } from "@/store/authStore"
import type { Lesson, StrapiListResponse, StrapiSingleResponse } from "@/type"

const ENDPOINT = "/api/academy-lessons"

/** 목록 불러올 때: 내 수업만 + 배정학생·관련수업까지 같이 받기 */
function populateQuery(ownerId: number): string {
  const query = new URLSearchParams({
    "filters[owner][id][$eq]": String(ownerId),
    "pagination[pageSize]": "100",
    "populate[enrollments][populate]": "student",
    "populate[relatedLesson]": "true",
  })
  return query.toString()
}

interface LessonState {
  /** 화면에 보여줄 수업 목록 */
  lessons: Lesson[]
  loading: boolean
  saving: boolean
  error: string | null
  /** 이 목록을 불러온 선생님 id */
  fetchedUserId: number | null

  fetchLessons: () => Promise<void>
  createLesson: (lesson: Lesson) => Promise<Lesson>
  updateLesson: (lesson: Lesson) => Promise<Lesson>
  resetLessons: () => void
}

export const useLessonStore = create<LessonState>((set, get) => ({
  lessons: [],
  loading: false,
  saving: false,
  error: null,
  fetchedUserId: null,

  /** 로그아웃할 때 목록 비우기 */
  resetLessons: () => {
    set({
      lessons: [],
      loading: false,
      saving: false,
      error: null,
      fetchedUserId: null,
    })
  },

  /** 내 수업 목록 불러오기 */
  fetchLessons: async () => {
    const user = useAuthStore.getState().user
    if (!user) {
      get().resetLessons()
      return
    }

    set({ loading: true, error: null })
    try {
      const res = await apiClient<StrapiListResponse<LessonDoc>>(
        `${ENDPOINT}?${populateQuery(user.id)}`,
        { auth: true },
      )
      set({
        lessons: res.data.map(toLesson),
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

  /** 수업 새로 만들기 */
  createLesson: async (lesson) => {
    const user = getAuthUser()
    set({ saving: true, error: null })
    try {
      const res = await apiClient<StrapiSingleResponse<LessonDoc>>(ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          data: {
            ...toLessonWrite(lesson),
            owner: user.id,
          },
        }),
        auth: true,
      })
      // 저장 직후 응답에 배정 정보가 비어 있을 수 있어, 방금 보낸 값으로 채움
      const created = toLessonFromResponse(res.data, lesson)
      set((state) => ({
        lessons: [...state.lessons, created],
        saving: false,
        fetchedUserId: user.id,
      }))
      return created
    } catch (err) {
      set({ saving: false, error: parseAuthError(err) })
      throw err
    }
  },

  /** 수업 수정하기 */
  updateLesson: async (lesson) => {
    const user = getAuthUser()
    set({ saving: true, error: null })
    try {
      const res = await apiClient<StrapiSingleResponse<LessonDoc>>(
        `${ENDPOINT}/${lesson.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ data: toLessonWrite(lesson) }),
          auth: true,
        },
      )
      const updated = toLessonFromResponse(res.data, lesson)
      set((state) => ({
        lessons: state.lessons.map((l) =>
          l.id === updated.id ? updated : l,
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
}))
