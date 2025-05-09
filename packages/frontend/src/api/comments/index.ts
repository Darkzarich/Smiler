import { apiClient } from '../ApiClient';
import type * as types from './types';

const CONTROLLER_URL = 'comments';

export default {
  getComments(params: types.GetCommentsRequest) {
    return apiClient.get<types.GetCommentsResponse>(CONTROLLER_URL, params);
  },
  createComment(data: types.CreateCommentRequest) {
    return apiClient.post<types.CreateCommentResponse>(CONTROLLER_URL, data);
  },
  updateComment(id: string, data: types.UpdateCommentRequest) {
    return apiClient.put<types.UpdateCommentResponse>(
      `${CONTROLLER_URL}/${id}`,
      data,
    );
  },
  deleteComment(id: string) {
    return apiClient.delete(`${CONTROLLER_URL}/${id}`);
  },
  updateRateById(id: string, data: types.UpdateRateByIdRequest) {
    return apiClient.put<types.UpdateRateByIdResponse>(
      `${CONTROLLER_URL}/${id}/vote`,
      data,
    );
  },
  removeRate(id: string) {
    return apiClient.delete<types.UpdateRateByIdResponse>(
      `${CONTROLLER_URL}/${id}/vote`,
    );
  },
};
