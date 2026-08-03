export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export const successResponse = <T>(message: string, data?: T): ApiResponse<T> => ({
  success: true,
  message,
  data,
});

export const errorResponse = (message: string, errors: string[] = []): ApiResponse<null> => ({
  success: false,
  message,
  errors,
});
