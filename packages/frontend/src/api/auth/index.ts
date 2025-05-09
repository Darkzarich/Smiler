import { apiClient } from '../ApiClient';
import type * as types from './types';

const CONTROLLER_URL = 'auth';

export default {
  getAuth() {
    return apiClient.get<types.CurrentUserResponse>(
      `${CONTROLLER_URL}/current`,
    );
  },
  signIn(data: types.SignInRequest) {
    return apiClient.post<types.SignInResponse>(
      `${CONTROLLER_URL}/signin`,
      data,
    );
  },
  signUp(data: SignUpRequest) {
    return apiClient.post<types.SignUpResponse>(
      `${CONTROLLER_URL}/signup`,
      data,
    );
  },
  logout() {
    return apiClient.post(`${CONTROLLER_URL}/logout`);
  },
};
