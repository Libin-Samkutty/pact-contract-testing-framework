// consumer/src/types/index.ts

/**
 * =============================================================================
 * TYPE EXPORTS
 * =============================================================================
 * Central export point for all type definitions.
 * =============================================================================
 */

export * from './auth.types';
export * from './product.types';
export * from './user.types';

/**
 * Common API error response structure
 */
export interface ApiError {
  message: string;
  statusCode?: number;
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  limit: number;
}

/**
 * HTTP request configuration
 */
export interface RequestConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}
