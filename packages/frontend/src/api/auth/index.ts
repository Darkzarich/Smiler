import { apiClient } from '../ApiClient';
import * as authTypes from './types';

const CONTROLLER_URL = 'auth';

export default {
  getAuth() {
    return apiClient.get<authTypes.CurrentUserResponse>(
      `${CONTROLLER_URL}/current`,
    );
  },
  signIn(data: authTypes.SignInRequest) {
    return apiClient.post<authTypes.SignInResponse>(
      `${CONTROLLER_URL}/signin`,
      data,
    );
  },
  signUp(data: authTypes.SignUpRequest) {
    return apiClient.post<authTypes.SignUpResponse>(
      `${CONTROLLER_URL}/signup`,
      data,
    );
  },
  async logout() {
    const response = await apiClient.post(`${CONTROLLER_URL}/logout`);

    // Logging out destroys the session the CSRF token was issued for
    apiClient.resetCsrfToken();

    return response;
  },
};

export { authTypes };
