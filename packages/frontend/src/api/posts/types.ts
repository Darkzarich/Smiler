import type { PaginationRequest, PaginationResponse } from '../types';

/** TODO: Think about sharing these types with backend */
export enum POST_SECTION_TYPES {
  PICTURE = 'pic',
  VIDEO = 'vid',
  TEXT = 'text',
}

export interface PostPictureSection {
  type: POST_SECTION_TYPES.PICTURE;
  hash: string;
  url: string;
  isFile?: boolean;
}

export interface PostVideoSection {
  type: POST_SECTION_TYPES.VIDEO;
  hash: string;
  url: string;
}

export interface PostTextSection {
  type: POST_SECTION_TYPES.TEXT;
  content: string;
  hash: string;
}

export type PostSection =
  | PostPictureSection
  | PostVideoSection
  | PostTextSection;

export interface PostAuthor {
  id: string;
  login: string;
  avatar: string;
}

export interface PostRate {
  isRated: boolean;
  negative?: boolean;
}

export interface Post {
  id: string;
  author: PostAuthor;
  title: string;
  sections: PostSection[];
  slug: string;
  commentCount: number;
  rating: number;
  tags: string[];
  rated: PostRate;
  createdAt: string;
  updatedAt: string;
}

export interface PostsSearchRequest extends PaginationRequest {
  title?: string;
  dateFrom?: string;
  dateTo?: string;
  ratingFrom?: number;
  ratingTo?: number;
}

export interface PostsSearchResponse extends PaginationResponse {
  posts: Post[];
}

export interface GetCommonListResponse extends PaginationRequest {
  posts: Post[];
}

export type GetAllRequest = PaginationRequest;
export type GetAllResponse = GetCommonListResponse;

export type GetTodayRequest = PaginationRequest;
export type GetTodayResponse = GetCommonListResponse;

export type GetBlowingRequest = PaginationRequest;
export type GetBlowingResponse = GetCommonListResponse;

export type GetRecentRequest = PaginationRequest;
export type GetRecentResponse = GetCommonListResponse;

export type GetTopThisWeekRequest = PaginationRequest;
export type GetTopThisWeekResponse = GetCommonListResponse;

export type GetFeedRequest = PaginationRequest;
export type GetFeedResponse = GetCommonListResponse;

export interface GetPostBySlugRequest {
  slug: string;
}

export type GetPostBySlugResponse = Post;

export interface CreatePostRequest {
  title: string;
  sections: PostSection[];
  tags: string[];
}

export type CreatePostResponse = Post;

export type UpdatePostByIdRequest = Partial<CreatePostRequest>;

export type UpdatePostByIdResponse = Post;

export interface DeletePostByIdRequest {
  id: string;
}

export type UploadAttachmentResponse = PostPictureSection;

export interface UpdateRateByIdRequest {
  negative: boolean;
}

export type UpdateRateByIdResponse = Post;
