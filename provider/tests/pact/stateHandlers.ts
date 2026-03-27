// provider/tests/pact/stateHandlers.ts

/**
 * =============================================================================
 * PROVIDER STATE HANDLERS
 * =============================================================================
 * State handlers set up the provider to match expected states defined in
 * consumer contracts. Each handler corresponds to a "given()" clause in
 * consumer tests.
 *
 * For DummyJSON, most states are implicit (data is pre-seeded), but we
 * may need to handle authentication states differently.
 *
 * @see https://docs.pact.io/getting_started/provider_states
 * =============================================================================
 */

import fetch from 'node-fetch';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StateHandlers = Record<string, (...args: any[]) => Promise<unknown>>;

/**
 * Test credentials for DummyJSON
 * These must match the credentials used in consumer tests
 */
const TEST_USER = {
  username: 'emilys',
  password: 'emilyspass',
};

/**
 * Cache for authentication tokens
 * Reused across multiple state handler invocations
 */
interface TokenCache {
  accessToken?: string;
  refreshToken?: string;
}

const tokenCache: TokenCache = {};

/**
 * Get the provider base URL from environment or default
 */
function getProviderUrl(): string {
  return process.env.PROVIDER_BASE_URL || 'https://dummyjson.com';
}

/**
 * Helper to login and get tokens
 */
async function loginAndGetTokens(): Promise<{ accessToken: string; refreshToken: string }> {
  // Return cached tokens if available
  if (tokenCache.accessToken && tokenCache.refreshToken) {
    return {
      accessToken: tokenCache.accessToken,
      refreshToken: tokenCache.refreshToken,
    };
  }

  const response = await fetch(`${getProviderUrl()}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(TEST_USER),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { accessToken: string; refreshToken: string };

  // Cache the tokens
  tokenCache.accessToken = data.accessToken;
  tokenCache.refreshToken = data.refreshToken;

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
}

/**
 * State handlers for provider verification
 *
 * Each handler corresponds to a provider state defined in consumer contracts.
 * The handler name must exactly match the string passed to `.given()` in
 * consumer tests.
 */
export const stateHandlers: StateHandlers = {
  /**
   * -------------------------------------------------------------------------
   * Authentication States
   * -------------------------------------------------------------------------
   */

  /**
   * State: User exists for login
   * DummyJSON comes pre-seeded with test users, so no setup needed
   */
  'a user with username emilys exists': async () => {
    console.log('State: Verifying user emilys exists (pre-seeded in DummyJSON)');
    // DummyJSON is pre-seeded with test data - no action needed
    return;
  },

  /**
   * State: Invalid credentials scenario
   * Used for testing login failure
   */
  'no user exists with given credentials': async () => {
    console.log('State: Setting up invalid credentials test');
    // No setup needed - DummyJSON will reject invalid credentials
    return;
  },

  /**
   * State: Valid access token exists
   * We need to actually login to get a real token for verification
   */
  'a valid access token exists': async () => {
    console.log('State: Obtaining valid access token');
    const tokens = await loginAndGetTokens();
    console.log('State: Access token obtained successfully');

    // Return state data that can be used by the provider
    return {
      accessToken: tokens.accessToken,
    };
  },

  /**
   * State: Invalid/missing token scenario
   */
  'no valid access token is provided': async () => {
    console.log('State: Setting up invalid token test');
    // No setup needed - we'll send an invalid token
    return;
  },

  /**
   * State: Valid refresh token exists
   */
  'a valid refresh token exists': async () => {
    console.log('State: Obtaining valid refresh token');
    const tokens = await loginAndGetTokens();
    console.log('State: Refresh token obtained successfully');

    return {
      refreshToken: tokens.refreshToken,
    };
  },

  /**
   * State: Authentication required
   */
  'authentication is required': async () => {
    console.log('State: Authentication required - no setup needed');
    return;
  },

  /**
   * -------------------------------------------------------------------------
   * Product States
   * -------------------------------------------------------------------------
   */

  /**
   * State: Products exist in the system
   * DummyJSON comes pre-seeded with 194 products
   */
  'products exist': async () => {
    console.log('State: Products exist (pre-seeded in DummyJSON)');
    // DummyJSON is pre-seeded with products - no action needed
    return;
  },

  /**
   * State: Specific product exists
   */
  'a product with id 1 exists': async () => {
    console.log('State: Product with id 1 exists (pre-seeded in DummyJSON)');
    // Product ID 1 is pre-seeded - no action needed
    return;
  },

  /**
   * State: Product not found scenario
   */
  'no product with id 99999 exists': async () => {
    console.log('State: No product with id 99999 exists');
    // DummyJSON will return 404 for non-existent products
    return;
  },

  /**
   * State: Product creation enabled
   * DummyJSON simulates creation (doesn't persist) but returns valid response
   */
  'product creation is enabled': async () => {
    console.log('State: Product creation enabled (simulated by DummyJSON)');
    return;
  },

  /**
   * -------------------------------------------------------------------------
   * User States
   * -------------------------------------------------------------------------
   */

  /**
   * State: User not found scenario
   */
  'no user with id 99999 exists': async () => {
    console.log('State: No user with id 99999 exists');
    // DummyJSON will return 404 for non-existent users
    return;
  },
};

/**
 * Clear the token cache
 * Useful between test runs or when tokens expire
 */
export function clearTokenCache(): void {
  tokenCache.accessToken = undefined;
  tokenCache.refreshToken = undefined;
}

/**
 * Get cached tokens (if available)
 */
export function getCachedTokens(): TokenCache {
  return { ...tokenCache };
}
