import axios, { type AxiosRequestConfig } from 'axios';
import config from '@/config/config';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';

// Matches the backend error code, which is stable unlike the error message
const CSRF_ERROR_CODE = 'CSRF_INVALID';

const GENERIC_ERROR_MESSAGE =
  'Oops! Something went wrong. Please try to reload the page and try again.';

interface OkResponse {
  ok: true;
}

/** Every failure the API itself writes carries this body, but a failure can
 * also come from anything else standing between the client and the API — a
 * proxy error page, an offline browser — so nothing here can be relied on */
interface RequestError {
  error?: {
    code?: string;
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
      error.response.data?.error?.code === CSRF_ERROR_CODE
    );
  }

  /** The session the token belongs to is gone, so the cached one is dead
   * weight: keeping it only buys a guaranteed 403 on the next request */
  public resetCsrfToken() {
    this.csrfToken = undefined;
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
        this.resetCsrfToken();

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
        notificationsStore.showErrorNotification({
          message:
            getRequestErrorMessage(requestError) ?? GENERIC_ERROR_MESSAGE,
        });

        if (requestError.response?.status === 401) {
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

/** The message the API sent for a failed request, or `undefined` when the
 * failure carries none. Callers that show the reason next to a form field need
 * it: an Axios error only says "Request failed with status code 401". */
export function getRequestErrorMessage(error: unknown) {
  if (!axios.isAxiosError<RequestError>(error)) {
    return undefined;
  }

  return error.response?.data?.error?.message;
}
