import type { PostSection } from '@/api/posts/types';

export interface GetUserProfileResponse {
  _id: string;
  login: string;
  rating: number;
  bio: string;
  avatar: string;
  createdAt: string;
  /** Absent for users who never signed in since it started being tracked */
  lastLoginAt?: string;
  followersAmount: number;
  isFollowed: boolean;
}

export type UpdateUserProfileRequest = Partial<
  Pick<GetUserProfileResponse, 'bio'>
>;

export type UpdateUserProfileResponse = GetUserProfileResponse;

export interface UpdateMyAvatarRequest {
  url: string;
}

export type UpdateMyAvatarResponse = Pick<GetUserProfileResponse, 'avatar'>;

export interface GetUserTemplateResponse {
  title: string;
  tags: string[];
  sections: PostSection[];
  /** When the server last saved the template, absent on templates last saved
   * before it started being stamped. The editor compares it against the draft
   * it keeps in localStorage to decide which of the two to open. */
  updatedAt?: string;
}

/** The server stamps `updatedAt` itself, so it is never sent. */
export type UpdateUserTemplateRequest = Omit<
  GetUserTemplateResponse,
  'updatedAt'
>;

export type UpdateUserTemplateResponse = GetUserTemplateResponse;

export interface GetCurrentUserSettings {
  tags: string[];
  authors: Pick<GetUserProfileResponse, 'login' | 'avatar' | '_id'>[];
  bio: string;
  avatar: string;
}
