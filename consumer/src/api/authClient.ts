// consumer/src/api/authClient.ts

/**
 * =============================================================================
 * AUTHENTICATION CLIENT
 * =============================================================================
 * Client for DummyJSON authentication endpoints.
 * Handles login, token refresh, and authenticated user retrieval.
 *
 * @see https://dummyjson.com/docs/auth
 * =============================================================================
 */

import { HttpClient, HttpClientConfig, HttpResponse, HttpError } from './httpClient';
import {
  LoginRequest,
  LoginResponse,
  AuthenticatedUser,
  RefreshTokenRequest,
  RefreshTokenResponse,
  AuthErrorResponse,
} from '../types';

/**
 * Authentication client for DummyJSON API
 *
 * @example
 * ```typescript
 * const auth = new AuthClient({ baseUrl: 'https://dummyjson.com' });
 *
 * // Login
 * const loginResult = await auth.login({
 *   username: 'emilys',
 *   password: 'emilyspass'
 * });
 *
 * // Get authenticated user
 * const user = await auth.getAuthenticatedUser(loginResult.accessToken);
 * ```
 */
export class AuthClient {
  private readonly httpClient: HttpClient;

  constructor(config: HttpClientConfig) {
    this.httpClient = new HttpClient(config);
  }

  /**
   * Authenticate a user with username and password
   *
   * @param credentials - Login credentials
   * @returns Login response with tokens and user info
   * @throws HttpError on invalid credentials or server error
   *
   * @example
   * ```typescript
   * const result = await authClient.login({
   *   username: 'emilys',
   *   password: 'emilyspass'
   * });
   * console.log(result.accessToken);
   * ```
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.httpClient.post<LoginResponse>(
      '/auth/login',
      credentials
    );
    return response.data;
  }

  /**
   * Get the currently authenticated user's profile
   *
   * @param accessToken - Valid JWT access token from login
   * @returns Authenticated user profile
   * @throws HttpError if token is invalid or expired (401)
   *
   * @example
   * ```typescript
   * const user = await authClient.getAuthenticatedUser(token);
   * console.log(`Hello, ${user.firstName}!`);
   * ```
   */
  async getAuthenticatedUser(accessToken: string): Promise<AuthenticatedUser> {
    const authenticatedClient = this.httpClient.withHeaders({
      'Authorization': `Bearer ${accessToken}`,
    });

    const response = await authenticatedClient.get<AuthenticatedUser>('/auth/me');
    return response.data;
  }

  /**
   * Refresh an access token using a refresh token
   *
   * @param request - Refresh token request
   * @returns New access and refresh tokens
   * @throws HttpError if refresh token is invalid
   *
   * @example
   * ```typescript
   * const newTokens = await authClient.refreshToken({
   *   refreshToken: oldRefreshToken,
   *   expiresInMins: 60
   * });
   * ```
   */
  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await this.httpClient.post<RefreshTokenResponse>(
      '/auth/refresh',
      request
    );
    return response.data;
  }

  /**
   * Attempt login and return either success or error response
   * Useful for testing both success and failure paths
   *
   * @param credentials - Login credentials
   * @returns Login response or error with status
   */
  async loginWithStatus(
    credentials: LoginRequest
  ): Promise<{ success: true; data: LoginResponse } | { success: false; error: AuthErrorResponse; status: number }> {
    try {
      const data = await this.login(credentials);
      return { success: true, data };
    } catch (error) {
      if (error instanceof HttpError) {
        return {
          success: false,
          error: error.data as AuthErrorResponse,
          status: error.status,
        };
      }
      throw error;
    }
  }

  /**
   * Check if an access token is valid by attempting to fetch the user
   *
   * @param accessToken - Token to validate
   * @returns true if token is valid, false otherwise
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await this.getAuthenticatedUser(accessToken);
      return true;
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        return false;
      }
      throw error;
    }
  }
}
