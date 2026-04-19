// 포맷별 정보 타입
export interface UploadFormat {
  ext: string;
  url: string;
  hash: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  path: string | null;
}

// formats는 다양한 크기 키를 가질 수 있으므로 Partial<Record<string, UploadFormat>>
export type UploadFormats = Partial<Record<string, UploadFormat>>;

// Cloudinary provider_metadata 타입
export interface CloudinaryProviderMetadata {
  public_id: string;
  resource_type: string;
}

// 📌 Strapi 업로드 응답 아이템 타입
export interface UploadResponseItem {
  id: number;                // 파일 ID
  name: string;              // 파일 이름
  alternativeText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  formats?: UploadFormats;   // ✅ any 제거
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;               // Cloudinary에 업로드된 URL
  previewUrl: string | null;
  provider: string;          // ex) "cloudinary"
  provider_metadata?: CloudinaryProviderMetadata; // ✅ any 제거
  createdAt: string;
  updatedAt: string;
}

// 응답 전체는 배열
export type UploadResponse = UploadResponseItem[];
