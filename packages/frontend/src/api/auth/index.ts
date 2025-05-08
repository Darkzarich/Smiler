import { apiClient } from '../ApiClient';
import type {
  CurrentUserResponse,
  SignInRequest,
  SignInResponse,
  SignUpRequest,
  SignUpResponse,
} from './types';

const CONTROLLER_URL = 'auth';

export default {
  getAuth() {
    return apiClient.get<CurrentUserResponse>(`${CONTROLLER_URL}/current`);
  },
  signIn(data: SignInRequest) {
    return apiClient.post<SignInResponse>(`${CONTROLLER_URL}/signin`, data);
  },
  signUp(data: SignUpRequest) {
    return apiClient.post<SignUpResponse>(`${CONTROLLER_URL}/signup`, data);
  },
  logout() {
    return apiClient.post(`${CONTROLLER_URL}/logout`);
  },
};
