export interface PaginationRequest {
  limit: number;
  offset: number;
}

export interface PaginationResponse {
  hasNextPage: boolean;
}
