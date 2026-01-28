// ==========================================
// Generic API Response Types
// ==========================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

// HTTP Error Response
export interface HttpErrorResponse {
  error: ApiError;
  status: number;
  statusText: string;
  message: string;
}
