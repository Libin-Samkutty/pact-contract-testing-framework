// consumer/tests/pact/errors.pact.spec.ts

/**
 * =============================================================================
 * ERROR CONTRACTS TESTS
 * =============================================================================
 * Consumer-driven contract tests for error responses.
 *
 * These tests ensure that error responses have a consistent shape
 * across all endpoints, enabling reliable error handling in the consumer.
 * =============================================================================
 */

import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { AuthClient } from '../../src/api/authClient';
import { ProductsClient } from '../../src/api/productsClient';
import { UsersClient } from '../../src/api/usersClient';
import { pactConfig } from './pactConfig';

const { like, regex } = MatchersV3;

describe('Error Response Contracts', () => {
  const provider = new PactV3(pactConfig);

  /**
   * ---------------------------------------------------------------------------
   * 401 UNAUTHORIZED ERROR CONTRACT
   * ---------------------------------------------------------------------------
   * Ensures all protected endpoints return consistent 401 responses
   */
  describe('401 Unauthorized', () => {
    it('returns consistent error structure for missing authentication', async () => {
      await provider
        .given('authentication is required')
        .uponReceiving('a request to protected endpoint without authentication')
        .withRequest({
          method: 'GET',
          path: '/auth/me',
          // No Authorization header
        })
        .willRespondWith({
          status: 401,
          headers: {
            'Content-Type': regex(/application\/json.*/, 'application/json'),
          },
          body: {
            message: like('Authentication required'),
          },
        })
        .executeTest(async (mockServer) => {
          const authClient = new AuthClient({
            baseUrl: mockServer.url,
          });

          // Pass empty string as token to simulate missing auth
          const isValid = await authClient.validateToken('');
          expect(isValid).toBe(false);
        });
    });
  });

  /**
   * ---------------------------------------------------------------------------
   * 404 NOT FOUND ERROR CONTRACT
   * ---------------------------------------------------------------------------
   * Ensures resource endpoints return consistent 404 responses
   */
  describe('404 Not Found', () => {
    it('returns consistent error structure for non-existent product', async () => {
      const nonExistentId = 99999;

      await provider
        .given('no product with id 99999 exists')
        .uponReceiving('a GET request for a non-existent product')
        .withRequest({
          method: 'GET',
          path: `/products/${nonExistentId}`,
        })
        .willRespondWith({
          status: 404,
          headers: {
            'Content-Type': regex(/application\/json.*/, 'application/json'),
          },
          body: {
            message: like("Product with id '99999' not found"),
          },
        })
        .executeTest(async (mockServer) => {
          const productsClient = new ProductsClient({
            baseUrl: mockServer.url,
          });

          const result = await productsClient.getProductByIdWithStatus(nonExistentId);

          expect(result.found).toBe(false);
          if (!result.found) {
            expect(result.status).toBe(404);
            expect(result.error).toBeDefined();
            expect(result.error.message).toBeDefined();
          }
        });
    });

    it('returns consistent error structure for non-existent user', async () => {
      const nonExistentId = 99999;

      await provider
        .given('no user with id 99999 exists')
        .uponReceiving('a GET request for a non-existent user')
        .withRequest({
          method: 'GET',
          path: `/users/${nonExistentId}`,
        })
        .willRespondWith({
          status: 404,
          headers: {
            'Content-Type': regex(/application\/json.*/, 'application/json'),
          },
          body: {
            message: like("User with id '99999' not found"),
          },
        })
        .executeTest(async (mockServer) => {
          const usersClient = new UsersClient({
            baseUrl: mockServer.url,
          });

          const result = await usersClient.getUserByIdWithStatus(nonExistentId);

          expect(result.found).toBe(false);
          if (!result.found) {
            expect(result.status).toBe(404);
            expect(result.error).toBeDefined();
            expect(result.error.message).toBeDefined();
          }
        });
    });
  });

  /**
   * ---------------------------------------------------------------------------
   * 400 BAD REQUEST ERROR CONTRACT
   * ---------------------------------------------------------------------------
   * Ensures validation errors return consistent responses
   */
  describe('400 Bad Request', () => {
    it('returns consistent error structure for invalid login', async () => {
      await provider
        .given('no user exists with given credentials')
        .uponReceiving('a login request with invalid credentials causing 400')
        .withRequest({
          method: 'POST',
          path: '/auth/login',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            username: '',
            password: '',
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

          const result = await authClient.loginWithStatus({
            username: '',
            password: '',
          });

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.status).toBe(400);
            expect(result.error).toBeDefined();
            expect(result.error.message).toBeDefined();
          }
        });
    });
  });
});
