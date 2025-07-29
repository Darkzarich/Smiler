export interface PaginationRequest {
  limit: number;
  offset: number;
}

export interface PaginationResponse {
  total: number;
  pages: number;
  hasNextPage: boolean;
}
