import { apiClient } from '../ApiClient';
import type { RequestOptions } from '../types';
import * as postTypes from './types';

const CONTROLLER_URL = 'posts';

export default {
  search(params: postTypes.PostsSearchRequest, options?: RequestOptions) {
    return apiClient.get<postTypes.PostsSearchResponse>(
      CONTROLLER_URL,
      params,
      options,
    );
  },
  /** Same endpoint as `search`, but filtering by author switches the backend to
   * a list sorted by the date of creation, which pages by cursor. */
  getPostsByAuthor(
    params: postTypes.GetPostsByAuthorRequest,
    options?: RequestOptions,
  ) {
    return apiClient.get<postTypes.GetPostsByAuthorResponse>(
      CONTROLLER_URL,
      params,
      options,
    );
  },
  getMyVotes(ids: string[]) {
    return apiClient.get<postTypes.GetMyVotesResponse>(
      `${CONTROLLER_URL}/votes`,
      { ids: ids.join(',') },
    );
  },
  getAll(params: postTypes.GetAllRequest, options?: RequestOptions) {
    return apiClient.get<postTypes.GetAllResponse>(
      `${CONTROLLER_URL}/categories/all`,
      params,
      options,
    );
  },
  getToday(params: postTypes.GetTodayRequest, options?: RequestOptions) {
    return apiClient.get<postTypes.GetTodayResponse>(
      `${CONTROLLER_URL}/categories/today`,
      params,
      options,
    );
  },
  getBlowing(params: postTypes.GetBlowingRequest, options?: RequestOptions) {
    return apiClient.get<postTypes.GetBlowingResponse>(
      `${CONTROLLER_URL}/categories/blowing`,
      params,
      options,
    );
  },
  getRecent(params: postTypes.GetRecentRequest, options?: RequestOptions) {
    return apiClient.get<postTypes.GetRecentResponse>(
      `${CONTROLLER_URL}/categories/recent`,
      params,
      options,
    );
  },
  getTopThisWeek(
    params: postTypes.GetTopThisWeekRequest,
    options?: RequestOptions,
  ) {
    return apiClient.get<postTypes.GetTopThisWeekResponse>(
      `${CONTROLLER_URL}/categories/top-this-week`,
      params,
      options,
    );
  },
  getFeed(params: postTypes.GetFeedRequest, options?: RequestOptions) {
    return apiClient.get<postTypes.GetFeedResponse>(
      `${CONTROLLER_URL}/feed`,
      params,
      options,
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
  /** Hands the backend a url to download the picture from. What comes back is
   * a section pointing at our own uploads, exactly like a file upload. */
  uploadAttachmentByUrl(data: postTypes.UploadAttachmentByUrlRequest) {
    return apiClient.post<postTypes.UploadAttachmentResponse>(
      `${CONTROLLER_URL}/upload/url`,
      data,
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
