/**
 * 이미지 한 장을 Strapi(/api/upload)에 올린다.
 * 회원가입 프로필 사진 등에서 사용.
 * (Upload는 Users 플러그인과 달라서 응답이 배열이다)
 */
import { apiClient } from "@/lib/apiClient"
import type { UploadResponse, UploadResponseItem } from "@/type"

export async function uploadImage(file: File): Promise<UploadResponseItem> {
  const formData = new FormData()
  // Strapi Upload가 요구하는 필드명
  formData.append("files", file)

  const result = await apiClient<UploadResponse>("/api/upload", {
    method: "POST",
    body: formData,
    auth: false,
  })

  // 여러 장도 가능하지만, 여기선 첫 장만 쓴다
  return result[0]
}
