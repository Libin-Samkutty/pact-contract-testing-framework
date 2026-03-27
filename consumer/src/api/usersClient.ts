// consumer/src/api/usersClient.ts

/**
 * =============================================================================
 * USERS CLIENT
 * =============================================================================
 * Client for DummyJSON user endpoints.
 *
 * @see https://dummyjson.com/docs/users
 * =============================================================================
 */

import { HttpClient, HttpClientConfig, HttpError } from './httpClient';
import { User, UserListResponse, UserErrorResponse } from '../types';

/**
 * Users client for DummyJSON API
 */
export class UsersClient {
  private readonly httpClient: HttpClient;

  constructor(config: HttpClientConfig) {
    this.httpClient = new HttpClient(config);
  }

  /**
   * Get a paginated list of users
   */
  async getUsers(params?: { limit?: number; skip?: number }): Promise<UserListResponse> {
    let path = '/users';

    if (params) {
      const parts: string[] = [];
      if (params.limit !== undefined) parts.push(`limit=${params.limit}`);
      if (params.skip !== undefined) parts.push(`skip=${params.skip}`);

      if (parts.length > 0) {
        path += `?${parts.join('&')}`;
      }
    }

    const response = await this.httpClient.get<UserListResponse>(path);
    return response.data;
  }

  /**
   * Get a single user by ID
   */
  async getUserById(id: number): Promise<User> {
    const response = await this.httpClient.get<User>(`/users/${id}`);
    return response.data;
  }

  /**
   * Get a user by ID with status information
   */
  async getUserByIdWithStatus(
    id: number
  ): Promise<{ found: true; user: User } | { found: false; error: UserErrorResponse; status: number }> {
    try {
      const user = await this.getUserById(id);
      return { found: true, user };
    } catch (error) {
      if (error instanceof HttpError) {
        return {
          found: false,
          error: error.data as UserErrorResponse,
          status: error.status,
        };
      }
      throw error;
    }
  }

  /**
   * Search users by query
   */
  async searchUsers(query: string): Promise<UserListResponse> {
    const response = await this.httpClient.get<UserListResponse>(
      `/users/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  }
}
