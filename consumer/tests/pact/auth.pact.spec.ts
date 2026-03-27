// consumer/tests/pact/auth.pact.spec.ts

/**
 * =============================================================================
 * AUTHENTICATION CONTRACT TESTS
 * =============================================================================
 * Consumer-driven contract tests for DummyJSON authentication endpoints.
 *
 * These tests define the contract (expected request/response) for:
 * - POST /auth/login (success and failure)
 * - GET /auth/me (authenticated user retrieval)
 * - POST /auth/refresh (token refresh)
 *
 * The generated contract will be verified by the provider to ensure
 * both consumer and provider agree on the API shape.
 *
 * @see https://dummyjson.com/docs/auth
 * =============================================================================
 */

import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { AuthClient } from '../../src/api/authClient';
import { pactConfig, TEST_CREDENTIALS } from './pactConfig';

// Destructure Pact matchers for cleaner test code
const { like, regex, integer, string } = MatchersV3;

describe('Authentication API Contract', () => {
  // Create a new Pact instance for this test suite
  // This will generate a contract file: FrontendApp-DummyJSON.json
  const provider = new PactV3(pactConfig);

  /**
   * ---------------------------------------------------------------------------
   * LOGIN SUCCESS CONTRACT
   * ---------------------------------------------------------------------------
   * Verifies the contract for successful login:
   * - Request: POST /auth/login with valid credentials
   * - Response: 200 with accessToken, refreshToken, and user data
   */
  describe('POST /auth/login', () => {
    describe('when credentials are valid', () => {
      it('returns access token and user data', async () => {
        // ARRANGE: Define the expected interaction
        await provider
          // Provider state: describes preconditions the provider needs
          .given('a user with username emilys exists')
          // Unique description for this interaction
          .uponReceiving('a login request with valid credentials')
          // Expected request from consumer
          .withRequest({
            method: 'POST',
            path: '/auth/login',
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              username: TEST_CREDENTIALS.valid.username,
              password: TEST_CREDENTIALS.valid.password,
            },
          })
          // Expected response from provider
          .willRespondWith({
            status: 200,
            headers: {
              'Content-Type': regex(/application\/json.*/, 'application/json'),
            },
            body: {
              // Using matchers instead of exact values for flexibility
              // like() - matches type, not exact value
              // integer() - must be an integer
              // string() - must be a string
              id: integer(1),
              username: like('emilys'),
              email: like('emily.johnson@x.dummyjson.com'),
              firstName: like('Emily'),
              lastName: like('Johnson'),
              gender: like('female'),
              image: like('https://dummyjson.com/icon/emilys/128'),
              accessToken: string('mock-access-token'),
              refreshToken: string('mock-refresh-token'),
            },
          })
          // Execute the test with Pact mock server
          .executeTest(async (mockServer) => {
            // ACT: Create client pointing to Pact mock server
            const authClient = new AuthClient({
              baseUrl: mockServer.url,
            });

            // Make the actual API call
            const result = await authClient.login({
              username: TEST_CREDENTIALS.valid.username,
              password: TEST_CREDENTIALS.valid.password,
            });

            // ASSERT: Verify the response matches our expectations
            expect(result).toBeDefined();
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(result.id).toBeGreaterThan(0);
            expect(result.username).toBe('emilys');
          });
      });
    });

    /**
     * -------------------------------------------------------------------------
     * LOGIN FAILURE CONTRACT
     * -------------------------------------------------------------------------
     * Verifies the contract for failed login:
     * - Request: POST /auth/login with invalid credentials
     * - Response: 400 with error message
     */
    describe('when credentials are invalid', () => {
      it('returns 400 with error message', async () => {
        await provider
          .given('no user exists with given credentials')
          .uponReceiving('a login request with invalid credentials')
          .withRequest({
            method: 'POST',
            path: '/auth/login',
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              username: TEST_CREDENTIALS.invalid.username,
              password: TEST_CREDENTIALS.invalid.password,
            },
          })
          .willRespondWith({
            status: 400,
            headers: {
              'Content-Type': regex(/application\/json.*/, 'application/json'),
            },
            body: {
              message: like('Invalid credentials'),
            },
          })
          .executeTest(async (mockServer) => {
            const authClient = new AuthClient({
              baseUrl: mockServer.url,
            });

            // Expect the login to fail
            const result = await authClient.loginWithStatus({
              username: TEST_CREDENTIALS.invalid.username,
              password: TEST_CREDENTIALS.invalid.password,
            });

            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.status).toBe(400);
              expect(result.error.message).toBeDefined();
            }
          });
      });
    });
  });

  /**
   * ---------------------------------------------------------------------------
   * AUTHENTICATED USER CONTRACT
   * ---------------------------------------------------------------------------
   * Verifies the contract for getting the current user:
   * - Request: GET /auth/me with valid Bearer token
   * - Response: 200 with user profile data
   */
  describe('GET /auth/me', () => {
    describe('when token is valid', () => {
      it('returns the authenticated user profile', async () => {
        // Mock token for testing (provider will handle actual validation)
        const mockAccessToken = 'valid-access-token';

        await provider
          .given('a valid access token exists')
          .uponReceiving('a request for the authenticated user')
          .withRequest({
            method: 'GET',
            path: '/auth/me',
            headers: {
              // Bearer token authentication
              Authorization: `Bearer ${mockAccessToken}`,
            },
          })
          .willRespondWith({
            status: 200,
            headers: {
              'Content-Type': regex(/application\/json.*/, 'application/json'),
            },
            body: {
              id: integer(1),
              username: like('emilys'),
              email: like('emily.johnson@x.dummyjson.com'),
              firstName: like('Emily'),
              lastName: like('Johnson'),
              gender: like('female'),
              image: like('https://dummyjson.com/icon/emilys/128'),
            },
          })
          .executeTest(async (mockServer) => {
            const authClient = new AuthClient({
              baseUrl: mockServer.url,
            });

            const user = await authClient.getAuthenticatedUser(mockAccessToken);

            expect(user).toBeDefined();
            expect(user.id).toBeGreaterThan(0);
            expect(user.username).toBeDefined();
            expect(user.email).toBeDefined();
          });
      });
    });

    /**
     * -------------------------------------------------------------------------
     * UNAUTHORIZED CONTRACT
     * -------------------------------------------------------------------------
     * Verifies the contract for unauthorized access:
     * - Request: GET /auth/me without token or with invalid token
     * - Response: 401 with error message
     */
    describe('when token is missing or invalid', () => {
      it('returns 401 Unauthorized', async () => {
        await provider
          .given('no valid access token is provided')
          .uponReceiving('a request for authenticated user without valid token')
          .withRequest({
            method: 'GET',
            path: '/auth/me',
            headers: {
              Authorization: 'Bearer invalid-or-expired-token',
            },
          })
          .willRespondWith({
            status: 401,
            headers: {
              'Content-Type': regex(/application\/json.*/, 'application/json'),
            },
            body: {
              message: like('Invalid/Expired Token!'),
            },
          })
          .executeTest(async (mockServer) => {
            const authClient = new AuthClient({
              baseUrl: mockServer.url,
            });

            const isValid = await authClient.validateToken('invalid-or-expired-token');

            expect(isValid).toBe(false);
          });
      });
    });
  });

  /**
   * ---------------------------------------------------------------------------
   * TOKEN REFRESH CONTRACT
   * ---------------------------------------------------------------------------
   * Verifies the contract for refreshing access tokens:
   * - Request: POST /auth/refresh with valid refresh token
   * - Response: 200 with new access and refresh tokens
   */
  describe('POST /auth/refresh', () => {
    describe('when refresh token is valid', () => {
      it('returns new tokens', async () => {
        const mockRefreshToken = 'valid-refresh-token';

        await provider
          .given('a valid refresh token exists')
          .uponReceiving('a token refresh request')
          .withRequest({
            method: 'POST',
            path: '/auth/refresh',
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              refreshToken: mockRefreshToken,
              expiresInMins: 60,
            },
          })
          .willRespondWith({
            status: 200,
            headers: {
              'Content-Type': regex(/application\/json.*/, 'application/json'),
            },
            body: {
              accessToken: string('new-access-token'),
              refreshToken: string('new-refresh-token'),
            },
          })
          .executeTest(async (mockServer) => {
            const authClient = new AuthClient({
              baseUrl: mockServer.url,
            });

            const result = await authClient.refreshToken({
              refreshToken: mockRefreshToken,
              expiresInMins: 60,
            });

            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
          });
      });
    });
  });
});
