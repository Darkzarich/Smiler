import type { PaginationRequest, PaginationResponse } from '../types';

interface CommentAuthor {
  id: string;
  login: string;
  avatar: string;
}

interface CommentRate {
  isRated: boolean;
  negative?: boolean;
}

export interface Comment {
  id: string;
  parent: string; // parent comment id
  author: CommentAuthor;
  body: string;
  children: Comment[];
  createdAt: string;
  updatedAt: string;
  rated: CommentRate;
  rating: number;
  deleted?: boolean;
}

export interface GetCommentsRequest extends PaginationRequest {
  post: string; // post id
}

export interface GetCommentsResponse extends PaginationResponse {
  comments: Comment[];
}

export interface CreateCommentRequest {
  post: string; // post id
  parent?: string;
  body: string;
}

export type CreateCommentResponse = Comment;

export interface UpdateCommentRequest {
  body: string;
}

export type UpdateCommentResponse = Comment;

export interface UpdateRateByIdRequest {
  negative: boolean;
}

export type UpdateRateByIdResponse = Comment;
