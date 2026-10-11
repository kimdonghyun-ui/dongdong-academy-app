/**
 * Strapi 5 Content API 공통 타입
 *
 * 목록/단건 응답의 기본 모양만 정의한다.
 * (학생·수업 같은 실제 필드는 각 *Mapper.ts 에 있다)
 */

/** document 공통 메타 (숫자 id + documentId) */
export interface StrapiDocumentMeta {
  id: number
  documentId: string
  createdAt?: string
  updatedAt?: string
  publishedAt?: string | null
  locale?: string | null
}

/** 콘텐츠 필드 T + 위 메타를 합친 Document */
export type StrapiDocument<T extends object = object> = StrapiDocumentMeta & T

/** 목록 페이지 정보 */
export interface StrapiPagination {
  page: number
  pageSize: number
  pageCount: number
  total: number
}

export interface StrapiListMeta {
  pagination: StrapiPagination
}

/** GET 목록 응답 — data가 배열 */
export interface StrapiListResponse<T> {
  data: T[]
  meta: StrapiListMeta
}

/** GET/POST/PUT 단건 응답 — data가 하나 */
export interface StrapiSingleResponse<T> {
  data: T
  meta?: Record<string, unknown>
}
