import axios, { type AxiosRequestConfig } from 'axios';
import config from '@/config/config';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';

interface OkResponse {
  ok: true;
}

interface RequestError {
  error: {
    code: string;
    message?: string;
  };
}

class ApiClient {
  private axiosClient = axios.create({
    baseURL: `${config.VUE_APP_API_URL}/api`,
    withCredentials: true,
  });

  private notificationsStore = useNotificationsStore();
  private userStore = useUserStore();

  private async request<Response = OkResponse>(
    requestData: AxiosRequestConfig,
  ) {
    try {
      const res = await this.axiosClient.request<Response>(requestData);

      return res.data;
    } catch (error) {
      if (axios.isAxiosError<RequestError>(error)) {
        const { response } = error;

        if (!response || !response.data || !response.data.error.message) {
          this.notificationsStore.showErrorNotification({
            message:
              'Oops! Something went wrong. Please try to reload the page and try again.',
          });

          throw error;
        }

        this.notificationsStore.showErrorNotification({
          message: response.data.error.message,
        });

        if (response.status === 401) {
          this.userStore.clearUser();
        }
      }

      throw error;
    }
  }

  public async post<Response = OkResponse, Data = unknown>(
    url: string,
    data?: Data,
    options?: AxiosRequestConfig,
  ) {
    return await this.request<Response>({
      url,
      method: 'post',
      data,
      ...options,
    });
  }

  public async put<Response = OkResponse, Data = unknown>(
    url: string,
    data?: Data,
    options?: AxiosRequestConfig,
  ) {
    return await this.request<Response>({
      url,
      method: 'put',
      data,
      ...options,
    });
  }

  public async delete<Response = OkResponse>(
    url: string,
    options?: AxiosRequestConfig,
  ) {
    return await this.request<Response>({
      url,
      method: 'delete',
      ...options,
    });
  }

  public async get<Response = OkResponse, Params = unknown>(
    url: string,
    params?: Params,
    options?: AxiosRequestConfig,
  ) {
    return await this.request<Response>({
      url,
      method: 'get',
      params,
      ...options,
    });
  }
}

export const apiClient = new ApiClient();
