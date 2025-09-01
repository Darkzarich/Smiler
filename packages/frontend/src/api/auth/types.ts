interface CurrentUser {
  isAuth: boolean;
  id: string;
  email: string;
  login: string;
  avatar: string;
  rating: number;
  followersAmount: number;
  tagsFollowed: string[];
}

export type CurrentUserResponse = CurrentUser;

export interface SignInRequest {
  email: string;
  password: string;
}

export type SignInResponse = CurrentUser;

export interface SignUpRequest {
  login: string;
  email: string;
  password: string;
  confirm: string;
}

export type SignUpResponse = CurrentUser;
