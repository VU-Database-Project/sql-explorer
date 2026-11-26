import type { ApiErrorResponse } from '../types/api';

export const USE_MOCK_API =
  String(import.meta.env.VITE_USE_MOCK_API ?? 'true').toLowerCase() === 'true';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
).replace(/\/+$/, '');

export class ApiClientError extends Error {
  readonly code: string;
  readonly httpStatus?: number;

  constructor(message: string, code = 'API_ERROR', httpStatus?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export async function fetchJson<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new ApiClientError(
      'Unable to reach the SQL Explorer API. Check that the backend server is running or enable mock mode.',
      'NETWORK_ERROR'
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiClientError(
      'The server returned an unexpected non-JSON response.',
      'INVALID_JSON',
      response.status
    );
  }

  if (!response.ok) {
    const apiErr = data as Partial<ApiErrorResponse>;
    const message =
      apiErr?.error?.message ||
      `Request failed with status ${response.status}.`;
    const code = apiErr?.error?.code || 'HTTP_ERROR';
    throw new ApiClientError(message, code, response.status);
  }

  return data as T;
}