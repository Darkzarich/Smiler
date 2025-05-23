import { apiClient } from '../ApiClient';
import * as userTypes from './types';

const CONTROLLER_URL = 'users';

export default {
  getUserProfile(login: string) {
    return apiClient.get<userTypes.GetUserProfileResponse>(
      `${CONTROLLER_URL}/${login}`,
    );
  },
  updateUserProfile(data: userTypes.UpdateUserProfileRequest) {
    return apiClient.put<userTypes.UpdateUserProfileResponse>(
      `${CONTROLLER_URL}/me`,
      data,
    );
  },
  removeFilePicSection(hash: string) {
    return apiClient.delete(`${CONTROLLER_URL}/me/template/${hash}`);
  },
  getUserTemplate(id: string) {
    return apiClient.get<userTypes.GetUserTemplateResponse>(
      `${CONTROLLER_URL}/${id}/template`,
    );
  },
  updateUserTemplate(id: string, data: userTypes.UpdateUserTemplateRequest) {
    return apiClient.put<userTypes.UpdateUserTemplateResponse>(
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
    return apiClient.get<userTypes.GetCurrentUserSettings>(
      `${CONTROLLER_URL}/me/settings`,
    );
  },
};

export { userTypes };
