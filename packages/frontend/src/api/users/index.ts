import { apiClient } from '../ApiClient';
import type * as types from './types';

const CONTROLLER_URL = 'users';

export default {
  getUserProfile(login: string) {
    return apiClient.get<types.GetUserProfileResponse>(
      `${CONTROLLER_URL}/${login}`,
    );
  },
  updateUserProfile(data: types.UpdateUserProfileRequest) {
    return apiClient.put<types.UpdateUserProfileResponse>(
      `${CONTROLLER_URL}/me`,
      data,
    );
  },
  removeFilePicSection(hash: string) {
    return apiClient.delete(`${CONTROLLER_URL}/me/template/${hash}`);
  },
  getUserTemplate(id: string) {
    return apiClient.get<types.GetUserTemplateResponse>(
      `${CONTROLLER_URL}/${id}/template`,
    );
  },
  updateUserTemplate(id: string, data: types.UpdateUserTemplateRequest) {
    return apiClient.put<types.UpdateUserTemplateResponse>(
      `${CONTROLLER_URL}/${id}/template`,
      data,
    );
  },
  followUser(id: string) {
    return apiClient.put(`${CONTROLLER_URL}/${id}/follow`);
  },
  unfollowUser(id: string) {
    return apiClient.delete(`${CONTROLLER_URL}/${id}/follow`);
  },
  getCurrentUserSettings() {
    return apiClient.get<types.GetCurrentUserSettings>(
      `${CONTROLLER_URL}/me/settings`,
    );
  },
};
