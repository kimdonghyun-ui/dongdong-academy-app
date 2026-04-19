// Strapi 기본 엔티티
export interface StrapiEntity<T> {
    id: number;
    attributes: T;
}

// 리스트 응답
export interface StrapiResponse<T> {
    data: StrapiEntity<T>[];
}

// 단일 응답
export interface StrapiSingleResponse<T> {
    data: StrapiEntity<T>;
}

// 에러
export interface StrapiError {
    status: number;
    name: string;
    message: string;
}

// 공통 API 응답
export interface StrapiApiResponse<T> {
    data: T;
    error?: StrapiError;
}