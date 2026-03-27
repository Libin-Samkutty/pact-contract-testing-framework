// consumer/src/types/auth.types.ts

/**
 * =============================================================================
 * AUTHENTICATION TYPES
 * =============================================================================
 * Type definitions for DummyJSON authentication endpoints.
 * These types define the contract shape that our consumer expects.
 *
 * @see https://dummyjson.com/docs/auth
 * =============================================================================
 */

/**
 * Login request payload
 * Sent to POST /auth/login
 */
export interface LoginRequest {
  /** Username of the user attempting to log in */
  username: string;

  /** Password for authentication */
  password: string;

  /** Optional: Token expiry time in minutes (default: 60) */
  expiresInMins?: number;
}

/**
 * Successful login response
 * Returned from POST /auth/login on successful authentication
 */
export interface LoginResponse {
  /** Unique user identifier */
  id: number;

  /** Username of the authenticated user */
  username: string;

  /** User's email address */
  email: string;

  /** User's first name */
  firstName: string;

  /** User's last name */
  lastName: string;

  /** Gender of the user */
  gender: string;

  /** URL to the user's profile image */
  image: string;

  /** JWT access token for authenticated requests */
  accessToken: string;

  /** JWT refresh token for obtaining new access tokens */
  refreshToken: string;
}

/**
 * Error response for failed authentication
 * Returned when login fails (invalid credentials, etc.)
 */
export interface AuthErrorResponse {
  /** Error message describing the failure */
  message: string;
}

/**
 * Authenticated user profile
 * Returned from GET /auth/me with valid Bearer token
 */
export interface AuthenticatedUser {
  /** Unique user identifier */
  id: number;

  /** Username */
  username: string;

  /** Email address */
  email: string;

  /** First name */
  firstName: string;

  /** Last name */
  lastName: string;

  /** Gender */
  gender: string;

  /** Profile image URL */
  image: string;
}

/**
 * Token refresh request
 * Sent to POST /auth/refresh
 */
export interface RefreshTokenRequest {
  /** The refresh token obtained from login */
  refreshToken: string;

  /** Optional: New expiry time in minutes */
  expiresInMins?: number;
}

/**
 * Token refresh response
 * Returned from POST /auth/refresh
 */
export interface RefreshTokenResponse {
  /** New access token */
  accessToken: string;

  /** New refresh token */
  refreshToken: string;
}
