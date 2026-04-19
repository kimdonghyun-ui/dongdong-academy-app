import { apiClient } from "@/lib/apiClient";
import type { UploadResponse, UploadResponseItem } from "@/type";

// utils/uploadImage.ts
export async function uploadImage(file: File): Promise<UploadResponseItem> {
    const formData = new FormData();
    formData.append("files", file); // files는 Strapi의 필수 필드명
    
    const result = await apiClient<UploadResponse>('/api/upload', {
        method: 'POST',
        body: formData,
        auth: false,
        // credentials: 'include',
    });

    return result[0]; // ✅ Cloudinary 이미지 URL만 반환
}
