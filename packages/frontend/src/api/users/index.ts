import { apiClient } from '../ApiClient';
import type {
  GetUserProfileResponse,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
  GetUserTemplateResponse,
  UpdateUserTemplateRequest,
  UpdateUserTemplateResponse,
  GetCurrentUserSettings,
} from './types';

const CONTROLLER_URL = 'users';

export default {
  getUserProfile(login: string) {
    return apiClient.get<GetUserProfileResponse>(`${CONTROLLER_URL}/${login}`);
  },
  updateUserProfile(data: UpdateUserProfileRequest) {
    return apiClient.put<UpdateUserProfileResponse>(
      `${CONTROLLER_URL}/me`,
      data,
    );
  },
  removeFilePicSection(hash: string) {
    return apiClient.delete(`${CONTROLLER_URL}/me/template/${hash}`);
  },
  getUserTemplate(id: string) {
    return apiClient.get<GetUserTemplateResponse>(
      `${CONTROLLER_URL}/${id}/template`,
    );
  },
  updateUserTemplate(id: string, data: UpdateUserTemplateRequest) {
    return apiClient.put<UpdateUserTemplateResponse>(
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
    return apiClient.get<GetCurrentUserSettings>(
      `${CONTROLLER_URL}/me/settings`,
    );
  },
};
