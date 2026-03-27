// provider/tests/pact/provider.verification.spec.ts

/**
 * =============================================================================
 * PROVIDER VERIFICATION TESTS
 * =============================================================================
 * This file verifies that the DummyJSON provider satisfies all contracts
 * defined by consumers (FrontendApp).
 *
 * The verification process:
 * 1. Loads contract files from ./pacts or Pact Broker
 * 2. For each interaction in the contract:
 *    a. Calls the state handler (if defined)
 *    b. Makes the actual request to the provider
 *    c. Compares the response to the contract expectations
 * 3. Reports success/failure for each interaction
 *
 * @see https://docs.pact.io/implementation_guides/javascript/docs/provider
 * =============================================================================
 */

import path from 'path';
import { Verifier, VerifierOptions } from '@pact-foundation/pact';
import { stateHandlers, clearTokenCache, getCachedTokens } from './stateHandlers';

/**
 * Configuration from environment variables
 */
const config = {
  // Provider URL (DummyJSON instance)
  providerBaseUrl: process.env.PROVIDER_BASE_URL || 'https://dummyjson.com',

  // Provider name (must match consumer contract)
  providerName: process.env.PROVIDER_NAME || 'DummyJSON',

  // Pact Broker URL (for fetching contracts)
  pactBrokerUrl: process.env.PACT_BROKER_URL || 'http://localhost:9292',

  // Provider version (typically git SHA)
  providerVersion: process.env.PACT_PROVIDER_VERSION || process.env.GIT_COMMIT || '1.0.0',

  // Git branch (for tagging)
  providerBranch: process.env.GIT_BRANCH || 'main',

  // Whether to publish verification results
  publishResults: process.env.PACT_PUBLISH_VERIFICATION_RESULTS === 'true',

  // Consumer version selectors for Pact Broker
  consumerVersionSelectors: [
    { mainBranch: true },           // Contracts from main branch
    { deployedOrReleased: true },   // Contracts that are deployed
  ],
};

/**
 * Path to local pact files (for local development)
 */
const pactDir = path.resolve(__dirname, '../../../pacts');

describe('Provider Verification: DummyJSON', () => {
  // Clear token cache before verification
  beforeAll(() => {
    clearTokenCache();
    console.log('Provider Verification Configuration:');
    console.log(`  Provider URL: ${config.providerBaseUrl}`);
    console.log(`  Provider Name: ${config.providerName}`);
    console.log(`  Provider Version: ${config.providerVersion}`);
    console.log(`  Publish Results: ${config.publishResults}`);
  });

  /**
   * ---------------------------------------------------------------------------
   * LOCAL VERIFICATION (from pact files)
   * ---------------------------------------------------------------------------
   * Use this for local development when Pact Broker is not available
   */
  describe('Local Verification (from files)', () => {
    it('verifies all contracts from local pact files', async () => {
      const verifierOptions: VerifierOptions = {
        // Provider configuration
        providerBaseUrl: config.providerBaseUrl,
        provider: config.providerName,

        // Load contracts from local files
        pactUrls: [
          path.join(pactDir, 'FrontendApp-DummyJSON.json'),
        ],

        // State handlers to set up provider state
        stateHandlers,

        // Request filtering: inject real tokens for contract-defined placeholder tokens
        requestFilter: (req, _res, next) => {
          console.log(`  → ${req.method} ${req.path}`);
          // Force uncompressed responses so Pact native binary can parse the body
          req.headers['accept-encoding'] = 'identity';
          const cached = getCachedTokens();

          // Replace placeholder access tokens with real token
          const authHeader = req.headers['authorization'];
          const isPlaceholderToken = authHeader === 'Bearer valid-access-token' ||
                                     authHeader === 'Bearer flow-access-token';
          if (isPlaceholderToken && cached.accessToken) {
            req.headers['authorization'] = `Bearer ${cached.accessToken}`;
          }

          // Replace placeholder refresh token in POST /auth/refresh body
          if (req.method === 'POST' && req.path === '/auth/refresh' && cached.refreshToken && req.body) {
            req.body.refreshToken = cached.refreshToken;
            delete req.headers['content-length'];
          }

          next();
        },

        // Timeout configuration
        timeout: 60000,

        // Logging
        logLevel: 'info',
      };

      // Run verification
      const verifier = new Verifier(verifierOptions);

      try {
        const output = await verifier.verifyProvider();
        console.log('Verification Output:', output);
      } catch (error) {
        console.error('Verification failed:', error);
        throw error;
      }
    });
  });

  /**
   * ---------------------------------------------------------------------------
   * BROKER VERIFICATION (from Pact Broker)
   * ---------------------------------------------------------------------------
   * Use this in CI/CD when contracts are published to Pact Broker
   */
  describe('Broker Verification (from Pact Broker)', () => {
    // Skip if PACT_BROKER_URL is not set or is localhost and broker isn't running
    const skipBrokerTests = !process.env.PACT_BROKER_URL &&
                            process.env.CI !== 'true';

    (skipBrokerTests ? it.skip : it)(
      'verifies all contracts from Pact Broker',
      async () => {
        const verifierOptions: VerifierOptions = {
          // Provider configuration
          providerBaseUrl: config.providerBaseUrl,
          provider: config.providerName,
          providerVersion: config.providerVersion,
          providerVersionBranch: config.providerBranch,

          // Pact Broker configuration
          pactBrokerUrl: config.pactBrokerUrl,
          consumerVersionSelectors: config.consumerVersionSelectors,

          // Publish results back to broker
          publishVerificationResult: config.publishResults,

          // State handlers
          stateHandlers,

          // Enable pending pacts (new contracts that haven't been verified yet)
          enablePending: true,

          // Include WIP (work in progress) pacts
          includeWipPactsSince: '2024-01-01',

          // Timeout
          timeout: 60000,

          // Logging
          logLevel: 'info',
        };

        const verifier = new Verifier(verifierOptions);

        try {
          const output = await verifier.verifyProvider();
          console.log('Broker Verification Output:', output);
        } catch (error) {
          console.error('Broker verification failed:', error);
          throw error;
        }
      }
    );
  });
});
