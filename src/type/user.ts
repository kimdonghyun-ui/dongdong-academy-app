/**
 * 로그인한 사용자 정보
 * Strapi Users & Permissions 플러그인 기준
 */
export interface User {
  id: number
  documentId: string
  username: string
  email: string
  provider: string
  confirmed: boolean
  blocked: boolean
  createdAt: string
  updatedAt: string
  publishedAt: string
  locale?: string | null
  avatar?: string | null
}
