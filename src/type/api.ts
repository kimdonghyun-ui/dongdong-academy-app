// 너 apiClient용 (성공만 받을 때)
export interface ApiResponse<T> {
    data: T;
}

// 메시지 응답 (로그아웃 등)
export interface ApiMessage {
    ok: boolean;
    message?: string;
}