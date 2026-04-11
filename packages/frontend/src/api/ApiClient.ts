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

interface CsrfResponse {
  csrfToken: string;
}

class ApiClient {
  private axiosClient = axios.create({
    baseURL: `${config.VUE_APP_API_URL}/api`,
    withCredentials: true,
  });

  private csrfToken?: string;

  private csrfTokenRequest?: Promise<string>;

  private async getCsrfToken() {
    if (this.csrfToken) {
      return this.csrfToken;
    }

    if (!this.csrfTokenRequest) {
      this.csrfTokenRequest = this.axiosClient
        .get<CsrfResponse>('auth/csrf')
        .then((res) => {
          this.csrfToken = res.data.csrfToken;

          return res.data.csrfToken;
        })
        .finally(() => {
          this.csrfTokenRequest = undefined;
        });
    }

    return this.csrfTokenRequest;
  }

  private async addCsrfHeader(requestData: AxiosRequestConfig) {
    const method = requestData.method?.toLowerCase();

    if (!method || ['get', 'head', 'options'].includes(method)) {
      return requestData;
    }

    return {
      ...requestData,
      headers: {
        ...requestData.headers,
        'X-CSRF-Token': await this.getCsrfToken(),
      },
    };
  }

  private isCsrfError(error: unknown) {
    return (
      axios.isAxiosError<RequestError>(error) &&
      error.response?.status === 403 &&
      error.response.data.error.message === 'Invalid or missing CSRF token'
    );
  }

  private async request<Response = OkResponse>(
    requestData: AxiosRequestConfig,
  ) {
    const notificationsStore = useNotificationsStore();
    const userStore = useUserStore();

    try {
      const res = await this.axiosClient.request<Response>(
        await this.addCsrfHeader(requestData),
      );

      return res.data;
    } catch (error) {
      let requestError = error;

      if (this.isCsrfError(requestError)) {
        this.csrfToken = undefined;

        try {
          const res = await this.axiosClient.request<Response>(
            await this.addCsrfHeader(requestData),
          );

          return res.data;
        } catch (retryError) {
          requestError = retryError;
        }
      }

      if (axios.isAxiosError<RequestError>(requestError)) {
        const { response } = requestError;

        if (!response || !response.data || !response.data.error.message) {
          notificationsStore.showErrorNotification({
            message:
              'Oops! Something went wrong. Please try to reload the page and try again.',
          });

          throw requestError;
        }

        notificationsStore.showErrorNotification({
          message: response.data.error.message,
        });

        if (response.status === 401) {
          userStore.clearUser();
        }
      }

      throw requestError;
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
