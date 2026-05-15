export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ApiError = {
  statusCode: number;
  message: string | string[];
  error: string;
};
