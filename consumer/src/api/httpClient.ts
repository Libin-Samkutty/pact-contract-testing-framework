// consumer/src/api/httpClient.ts

/**
 * =============================================================================
 * HTTP CLIENT
 * =============================================================================
 * Base HTTP client with consistent error handling and configuration.
 * All API clients extend this for DRY implementation.
 *
 * This client is designed to be mockable by Pact during contract tests.
 * =============================================================================
 */

import fetch, { Response, RequestInit } from 'node-fetch';
import { ApiError } from '../types';

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  /** Base URL for all requests */
  baseUrl: string;

  /** Default headers to include in all requests */
  defaultHeaders?: Record<string, string>;

  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * HTTP response wrapper with typed body
 */
export interface HttpResponse<T> {
  /** Response status code */
  status: number;

  /** Response status text */
  statusText: string;

  /** Parsed response body */
  data: T;

  /** Response headers */
  headers: Record<string, string>;
}

/**
 * Custom error class for HTTP errors
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Base HTTP client for API communication
 *
 * @example
 * ```typescript
 * const client = new HttpClient({ baseUrl: 'https://api.example.com' });
 * const response = await client.get<User>('/users/1');
 * console.log(response.data);
 * ```
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeout: number;

  constructor(config: HttpClientConfig) {
    // Remove trailing slash from base URL for consistent path joining
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.defaultHeaders,
    };
    this.timeout = config.timeout ?? 30000;
  }

  /**
   * Perform a GET request
   */
  async get<T>(
    path: string,
    options?: { headers?: Record<string, string> }
  ): Promise<HttpResponse<T>> {
    return this.request<T>('GET', path, undefined, options?.headers);
  }

  /**
   * Perform a POST request
   */
  async post<T>(
    path: string,
    body?: unknown,
    options?: { headers?: Record<string, string> }
  ): Promise<HttpResponse<T>> {
    return this.request<T>('POST', path, body, options?.headers);
  }

  /**
   * Perform a PUT request
   */
  async put<T>(
    path: string,
    body?: unknown,
    options?: { headers?: Record<string, string> }
  ): Promise<HttpResponse<T>> {
    return this.request<T>('PUT', path, body, options?.headers);
  }

  /**
   * Perform a DELETE request
   */
  async delete<T>(
    path: string,
    options?: { headers?: Record<string, string> }
  ): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', path, undefined, options?.headers);
  }

  /**
   * Core request method
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    additionalHeaders?: Record<string, string>
  ): Promise<HttpResponse<T>> {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...additionalHeaders,
    };

    const requestInit: RequestInit = {
      method,
      headers,
      timeout: this.timeout,
    };

    // Add body for methods that support it
    if (body !== undefined && ['POST', 'PUT', 'PATCH'].includes(method)) {
      requestInit.body = JSON.stringify(body);
    }

    try {
      const response: Response = await fetch(url, requestInit);

      // Parse response body
      const contentType = response.headers.get('content-type') ?? '';
      let data: T;

      if (contentType.includes('application/json')) {
        data = await response.json() as T;
      } else {
        data = await response.text() as unknown as T;
      }

      // Build headers object
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Throw error for non-2xx responses
      if (!response.ok) {
        throw new HttpError(
          (data as ApiError)?.message ?? response.statusText,
          response.status,
          response.statusText,
          data
        );
      }

      return {
        status: response.status,
        statusText: response.statusText,
        data,
        headers: responseHeaders,
      };
    } catch (error) {
      // Re-throw HttpError as-is
      if (error instanceof HttpError) {
        throw error;
      }

      // Wrap other errors
      throw new HttpError(
        error instanceof Error ? error.message : 'Unknown error',
        0,
        'Network Error',
        error
      );
    }
  }

  /**
   * Create a new client with additional headers
   * Useful for adding authentication
   */
  withHeaders(headers: Record<string, string>): HttpClient {
    return new HttpClient({
      baseUrl: this.baseUrl,
      defaultHeaders: { ...this.defaultHeaders, ...headers },
      timeout: this.timeout,
    });
  }
}
