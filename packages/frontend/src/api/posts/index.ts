import { apiClient } from '../ApiClient';
import * as postTypes from './types';

const CONTROLLER_URL = 'posts';

export default {
  search(params: postTypes.PostsSearchRequest) {
    return apiClient.get<postTypes.PostsSearchResponse>(CONTROLLER_URL, params);
  },
  getAll(params: postTypes.GetAllRequest) {
    return apiClient.get<postTypes.GetAllResponse>(
      `${CONTROLLER_URL}/categories/all`,
      params,
    );
  },
  getToday(params: postTypes.GetTodayRequest) {
    return apiClient.get<postTypes.GetTodayResponse>(
      `${CONTROLLER_URL}/categories/today`,
      params,
    );
  },
  getBlowing(params: postTypes.GetBlowingRequest) {
    return apiClient.get<postTypes.GetBlowingResponse>(
      `${CONTROLLER_URL}/categories/blowing`,
      params,
    );
  },
  getRecent(params: postTypes.GetRecentRequest) {
    return apiClient.get<postTypes.GetRecentResponse>(
      `${CONTROLLER_URL}/categories/recent`,
      params,
    );
  },
  getTopThisWeek(params: postTypes.GetTopThisWeekRequest) {
    return apiClient.get<postTypes.GetTopThisWeekResponse>(
      `${CONTROLLER_URL}/categories/top-this-week`,
      params,
    );
  },
  getFeed(params: postTypes.GetFeedRequest) {
    return apiClient.get<postTypes.GetFeedResponse>(
      `${CONTROLLER_URL}/feed`,
      params,
    );
  },
  createPost(data: postTypes.CreatePostRequest) {
    return apiClient.post<postTypes.CreatePostResponse>(CONTROLLER_URL, data);
  },
  uploadAttachment(formData: FormData) {
    return apiClient.post<postTypes.UploadAttachmentResponse>(
      `${CONTROLLER_URL}/upload`,
      formData,
    );
  },
  getPostBySlug(params: postTypes.GetPostBySlugRequest) {
    return apiClient.get<postTypes.GetPostBySlugResponse>(
      `${CONTROLLER_URL}/${params.slug}`,
    );
  },
  updatePostById(id: string, data: postTypes.UpdatePostByIdRequest) {
    return apiClient.put<postTypes.UpdatePostByIdResponse>(
      `${CONTROLLER_URL}/${id}`,
      data,
    );
  },
  deletePostById(params: postTypes.DeletePostByIdRequest) {
    return apiClient.delete(`${CONTROLLER_URL}/${params.id}`, {});
  },
  updateRateById(id: string, data: postTypes.UpdateRateByIdRequest) {
    return apiClient.put<postTypes.UpdateRateByIdResponse>(
      `${CONTROLLER_URL}/${id}/vote`,
      data,
    );
  },
  removeRateById(id: string) {
    return apiClient.delete<postTypes.UpdateRateByIdResponse>(
      `${CONTROLLER_URL}/${id}/vote`,
    );
  },
};

export { postTypes };
