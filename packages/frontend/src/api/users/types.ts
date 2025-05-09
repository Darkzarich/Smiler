import type { PostSection } from '@/api/posts/types';

export interface GetUserProfileResponse {
  id: string;
  login: string;
  rating: number;
  bio: string;
  avatar: string;
  createdAt: string;
  followersCount: number;
  isFollowed: boolean;
}

export type UpdateUserProfileRequest = Partial<
  Pick<GetUserProfileResponse, 'bio' | 'avatar'>
>;

export type UpdateUserProfileResponse = GetUserProfileResponse;

export interface GetUserTemplateResponse {
  title: string;
  tags: string[];
  sections: PostSection[];
}

export type UpdateUserTemplateRequest = GetUserTemplateResponse;

export type UpdateUserTemplateResponse = GetUserTemplateResponse;

export interface GetCurrentUserSettings {
  tags: string[];
  authors: Pick<GetUserProfileResponse, 'login' | 'avatar' | 'id'>[];
  bio: string;
  avatar: string;
}
