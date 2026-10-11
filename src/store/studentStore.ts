/**
 * 학생 스토어
 * - 하는 일: 학생 목록을 들고 있고, Strapi에 불러오기/등록/수정
 * - 변환: studentMapper.ts
 * - 내 학생만 다룸 (owner = 로그인한 선생님)
 */
import { create } from "zustand"

import { apiClient } from "@/lib/apiClient"
import { getAuthUser, parseAuthError } from "@/lib/authHelpers"
import { toStudent, toStudentWrite, type StudentDoc } from "@/lib/studentMapper"
import { useAuthStore } from "@/store/authStore"
import type { Student, StrapiListResponse, StrapiSingleResponse } from "@/type"

const ENDPOINT = "/api/academy-students"

interface StudentState {
  /** 화면에 보여줄 학생 목록 */
  students: Student[]
  /** 목록 불러오는 중이면 true */
  loading: boolean
  /** 등록/수정 저장 중이면 true */
  saving: boolean
  /** 실패 메시지 (없으면 null) */
  error: string | null
  /** 이 목록을 불러온 선생님 id (계정 바뀌면 다시 불러옴) */
  fetchedUserId: number | null

  fetchStudents: () => Promise<void>
  createStudent: (student: Student) => Promise<Student>
  updateStudent: (student: Student) => Promise<Student>
  resetStudents: () => void
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  loading: false,
  saving: false,
  error: null,
  fetchedUserId: null,

  /** 로그아웃할 때 목록 비우기 */
  resetStudents: () => {
    set({
      students: [],
      loading: false,
      saving: false,
      error: null,
      fetchedUserId: null,
    })
  },

  /** 내 학생 목록을 서버에서 가져오기 */
  fetchStudents: async () => {
    const user = useAuthStore.getState().user
    if (!user) {
      get().resetStudents()
      return
    }

    set({ loading: true, error: null })
    try {
      // owner = 나 인 학생만, 최근 등록 순
      const query = new URLSearchParams({
        "filters[owner][id][$eq]": String(user.id),
        "pagination[pageSize]": "100",
        sort: "registeredAt:desc",
      })
      const res = await apiClient<StrapiListResponse<StudentDoc>>(
        `${ENDPOINT}?${query.toString()}`,
        { auth: true },
      )
      set({
        students: res.data.map(toStudent),
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

  /** 학생 새로 등록 (owner에 현재 선생님 연결) */
  createStudent: async (student) => {
    const user = getAuthUser()
    set({ saving: true, error: null })
    try {
      const res = await apiClient<StrapiSingleResponse<StudentDoc>>(ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          data: {
            ...toStudentWrite(student),
            owner: user.id,
          },
        }),
        auth: true,
      })
      const created = toStudent(res.data)
      // 목록 맨 앞에 추가
      set((state) => ({
        students: [created, ...state.students],
        saving: false,
        fetchedUserId: user.id,
      }))
      return created
    } catch (err) {
      set({ saving: false, error: parseAuthError(err) })
      throw err
    }
  },

  /** 학생 정보 수정 */
  updateStudent: async (student) => {
    const user = getAuthUser()
    set({ saving: true, error: null })
    try {
      const res = await apiClient<StrapiSingleResponse<StudentDoc>>(
        `${ENDPOINT}/${student.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ data: toStudentWrite(student) }),
          auth: true,
        },
      )
      const updated = toStudent(res.data)
      // 같은 id만 교체
      set((state) => ({
        students: state.students.map((s) =>
          s.id === updated.id ? updated : s,
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
