import type { PaginationRequest, PaginationResponse } from '../types';

interface CommentAuthor {
  _id: string;
  login: string;
  avatar: string;
}

interface CommentRate {
  isRated: boolean;
  negative?: boolean;
}

export interface Comment {
  _id: string;
  parent?: string; // parent comment id
  /** The comment answered, when the server stored the reply next to it
   * because it was too deep to nest under; login is null once it's deleted */
  replyTo?: { _id: string; login: string | null };
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

/** One comment, not a node of the tree: it has no `children` */
export type CreateCommentResponse = Omit<Comment, 'children'>;

export interface UpdateCommentRequest {
  body: string;
}

export type UpdateCommentResponse = Omit<Comment, 'children'>;

/** The emptied comment when it had replies, which keeps its place */
export type DeleteCommentResponse = { ok: true } | Comment;

export interface UpdateRateByIdRequest {
  negative: boolean;
}

export type UpdateRateByIdResponse = Comment;
