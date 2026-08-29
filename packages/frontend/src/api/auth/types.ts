export interface CurrentUser {
  isAuth: true;
  _id: string;
  email: string;
  login: string;
  avatar: string;
  rating: number;
  followersAmount: number;
  tagsFollowed: string[];
}

interface NotLoggedInUser {
  isAuth: false;
}

/** `/auth/current` answers 200 with `{ isAuth: false }` when there is no
 * session, so callers must narrow on `isAuth` before reading user fields */
export type CurrentUserResponse = CurrentUser | NotLoggedInUser;

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
