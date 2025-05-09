import { apiClient } from '../ApiClient';
import type * as types from './types';

const CONTROLLER_URL = 'posts';

export default {
  search(params: types.PostsSearchRequest) {
    return apiClient.get<types.PostsSearchResponse>(CONTROLLER_URL, params);
  },
  getAll(params: types.GetAllRequest) {
    return apiClient.get<types.GetAllResponse>(
      `${CONTROLLER_URL}/categories/all`,
      params,
    );
  },
  getToday(params: types.GetTodayRequest) {
    return apiClient.get<types.GetTodayResponse>(
      `${CONTROLLER_URL}/categories/today`,
      params,
    );
  },
  getBlowing(params: types.GetBlowingRequest) {
    return apiClient.get<types.GetBlowingResponse>(
      `${CONTROLLER_URL}/categories/blowing`,
      params,
    );
  },
  getRecent(params: types.GetRecentRequest) {
    return apiClient.get<types.GetRecentResponse>(
      `${CONTROLLER_URL}/categories/recent`,
      params,
    );
  },
  getTopThisWeek(params: types.GetTopThisWeekRequest) {
    return apiClient.get<types.GetTopThisWeekResponse>(
      `${CONTROLLER_URL}/categories/top-this-week`,
      params,
    );
  },
  getFeed(params: types.GetFeedRequest) {
    return apiClient.get<types.GetFeedResponse>(
      `${CONTROLLER_URL}/feed`,
      params,
    );
  },
  createPost(data: types.CreatePostRequest) {
    return apiClient.post<types.CreatePostResponse>(CONTROLLER_URL, data);
  },
  uploadAttachment(formData: FormData) {
    return apiClient.post<types.UploadAttachmentResponse>(
      `${CONTROLLER_URL}/upload`,
      formData,
    );
  },
  getPostBySlug(slug: string) {
    return apiClient.get<types.GetPostBySlugResponse>(
      `${CONTROLLER_URL}/${slug}`,
    );
  },
  updatePostById(id: string, data: types.UpdatePostByIdRequest) {
    return apiClient.put<types.UpdatePostByIdResponse>(
      `${CONTROLLER_URL}/${id}`,
      data,
    );
  },
  deletePostById(id: string) {
    return apiClient.delete(`${CONTROLLER_URL}/${id}`, {});
  },
  updateRateById(id: string, data: types.UpdateRateByIdRequest) {
    return apiClient.put<types.UpdateRateByIdResponse>(
      `${CONTROLLER_URL}/${id}/vote`,
      data,
    );
  },
  removeRateById(id: string) {
    return apiClient.delete(`${CONTROLLER_URL}/${id}/vote`);
  },
};
