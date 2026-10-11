/**
 * 이미지 업로드 응답 타입
 * (/api/upload — Cloudinary 등 미디어 라이브러리)
 */

/** 리사이즈된 이미지 한 장 정보 */
export interface UploadFormat {
  ext: string
  url: string
  hash: string
  mime: string
  width: number
  height: number
  size: number
  path: string | null
}

/** thumbnail, small 등 크기별 포맷 (키 이름이 가변) */
export type UploadFormats = Partial<Record<string, UploadFormat>>

/** Cloudinary가 붙여 주는 메타 */
export interface CloudinaryProviderMetadata {
  public_id: string
  resource_type: string
}

/** 업로드된 파일 하나 */
export interface UploadResponseItem {
  id: number
  name: string
  alternativeText: string | null
  caption: string | null
  width: number | null
  height: number | null
  formats?: UploadFormats
  hash: string
  ext: string
  mime: string
  size: number
  url: string
  previewUrl: string | null
  provider: string
  provider_metadata?: CloudinaryProviderMetadata
  createdAt: string
  updatedAt: string
}

/** 업로드 API는 파일 배열을 돌려준다 */
export type UploadResponse = UploadResponseItem[]
