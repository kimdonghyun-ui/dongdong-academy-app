/**
 * Strapi 관계(relation) 필드 도우미
 *
 * Strapi는 관계를 이렇게 줄 수 있다:
 * - 객체: { documentId: "abc" }
 * - 문자열: "abc"
 * - 비어 있음: null
 *
 * 앱에서는 항상 documentId 문자열만 쓰므로 여기서 맞춰 준다.
 */

export type StrapiRelationRef =
  | { documentId: string }
  | string
  | null
  | undefined

/** 관계 필드에서 documentId 문자열만 꺼낸다 */
export function relationDocumentId(
  rel: StrapiRelationRef,
): string | undefined {
  if (!rel) return undefined
  if (typeof rel === "string") return rel
  return rel.documentId
}
