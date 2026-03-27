// consumer/tests/pact/multiInteraction.pact.spec.ts

/**
 * =============================================================================
 * MULTI-INTERACTION CONTRACT TESTS
 * =============================================================================
 * Tests that verify sequences of interactions work together.
 * These represent real user flows through the application.
 *
 * Each interaction is stored separately in the contract file but
 * together they validate the complete user journey.
 * =============================================================================
 */

import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { AuthClient } from '../../src/api/authClient';
import { ProductsClient } from '../../src/api/productsClient';
import { pactConfig, TEST_CREDENTIALS } from './pactConfig';

const { like, eachLike, integer, decimal, regex, string } = MatchersV3;

describe('Multi-Interaction User Flows', () => {
  const provider = new PactV3(pactConfig);

  /**
   * ---------------------------------------------------------------------------
   * COMPLETE AUTH FLOW
   * ---------------------------------------------------------------------------
   * Simulates: Login → Get User Profile → Refresh Token
   */
  describe('Complete Authentication Flow', () => {
    it('completes full auth cycle: login, get profile, refresh', async () => {
      // Step 1: Login
      await provider
        .given('a user with username emilys exists')
        .uponReceiving('auth flow: login request')
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
            accessToken: string('flow-access-token'),
            refreshToken: string('flow-refresh-token'),
          },
        })
        .executeTest(async (mockServer) => {
          const authClient = new AuthClient({ baseUrl: mockServer.url });

          const loginResult = await authClient.login({
            username: TEST_CREDENTIALS.valid.username,
            password: TEST_CREDENTIALS.valid.password,
          });

          expect(loginResult.accessToken).toBeDefined();
          expect(loginResult.refreshToken).toBeDefined();
        });

      // Step 2: Get User Profile
      await provider
        .given('a valid access token exists')
        .uponReceiving('auth flow: get user profile')
        .withRequest({
          method: 'GET',
          path: '/auth/me',
          headers: {
            'Authorization': 'Bearer flow-access-token',
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
          const authClient = new AuthClient({ baseUrl: mockServer.url });

          const user = await authClient.getAuthenticatedUser('flow-access-token');

          expect(user.id).toBeDefined();
          expect(user.email).toBeDefined();
        });

      // Step 3: Refresh Token
      await provider
        .given('a valid refresh token exists')
        .uponReceiving('auth flow: refresh token')
        .withRequest({
          method: 'POST',
          path: '/auth/refresh',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            refreshToken: 'flow-refresh-token',
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
          const authClient = new AuthClient({ baseUrl: mockServer.url });

          const newTokens = await authClient.refreshToken({
            refreshToken: 'flow-refresh-token',
          });

          expect(newTokens.accessToken).toBeDefined();
          expect(newTokens.refreshToken).toBeDefined();
        });
    });
  });

  /**
   * ---------------------------------------------------------------------------
   * E-COMMERCE FLOW
   * ---------------------------------------------------------------------------
   * Simulates: Browse Products → View Single Product → (Optional: Add to Cart)
   */
  describe('E-Commerce Browse Flow', () => {
    it('completes product browsing: list products, view details', async () => {
      // Step 1: Browse products
      await provider
        .given('products exist')
        .uponReceiving('ecommerce flow: browse products')
        .withRequest({
          method: 'GET',
          path: '/products',
          query: {
            limit: '5',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': regex(/application\/json.*/, 'application/json'),
          },
          body: {
            products: eachLike({
              id: integer(1),
              title: like('iPhone 9'),
              price: decimal(549.0),
              rating: decimal(4.69),
              thumbnail: like('https://cdn.dummyjson.com/products/thumbnail.png'),
            }),
            total: integer(194),
            skip: integer(0),
            limit: integer(5),
          },
        })
        .executeTest(async (mockServer) => {
          const productsClient = new ProductsClient({ baseUrl: mockServer.url });

          const products = await productsClient.getProducts({ limit: 5 });

          expect(products.products.length).toBeGreaterThan(0);
          expect(products.products[0]!.id).toBeDefined();
        });

      // Step 2: View product details
      await provider
        .given('a product with id 1 exists')
        .uponReceiving('ecommerce flow: view product details')
        .withRequest({
          method: 'GET',
          path: '/products/1',
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': regex(/application\/json.*/, 'application/json'),
          },
          body: {
            id: integer(1),
            title: like('iPhone 9'),
            description: like('An apple mobile which is nothing like apple'),
            price: decimal(549.0),
            discountPercentage: decimal(12.96),
            rating: decimal(4.69),
            stock: integer(94),
            category: like('smartphones'),
            brand: like('Apple'),
            images: eachLike('https://cdn.dummyjson.com/products/images/1.png'),
            thumbnail: like('https://cdn.dummyjson.com/products/thumbnail.png'),
          },
        })
        .executeTest(async (mockServer) => {
          const productsClient = new ProductsClient({ baseUrl: mockServer.url });

          const product = await productsClient.getProductById(1);

          expect(product.id).toBe(1);
          expect(product.description).toBeDefined();
          expect(product.images.length).toBeGreaterThan(0);
        });
    });
  });
});
