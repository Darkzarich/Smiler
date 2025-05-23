import { apiClient } from '../ApiClient';
import * as commentTypes from './types';

const CONTROLLER_URL = 'comments';

export default {
  getComments(params: commentTypes.GetCommentsRequest) {
    return apiClient.get<commentTypes.GetCommentsResponse>(
      CONTROLLER_URL,
      params,
    );
  },
  createComment(data: commentTypes.CreateCommentRequest) {
    return apiClient.post<commentTypes.CreateCommentResponse>(
      CONTROLLER_URL,
      data,
    );
  },
  updateComment(id: string, data: commentTypes.UpdateCommentRequest) {
    return apiClient.put<commentTypes.UpdateCommentResponse>(
      `${CONTROLLER_URL}/${id}`,
      data,
    );
  },
  deleteComment(id: string) {
    return apiClient.delete(`${CONTROLLER_URL}/${id}`);
  },
  updateRateById(id: string, data: commentTypes.UpdateRateByIdRequest) {
    return apiClient.put<commentTypes.UpdateRateByIdResponse>(
      `${CONTROLLER_URL}/${id}/vote`,
      data,
    );
  },
  removeRate(id: string) {
    return apiClient.delete<commentTypes.UpdateRateByIdResponse>(
      `${CONTROLLER_URL}/${id}/vote`,
    );
  },
};

export { commentTypes };
