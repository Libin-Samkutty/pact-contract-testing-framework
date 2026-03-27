// consumer/tests/setup.ts

/**
 * =============================================================================
 * JEST TEST SETUP
 * =============================================================================
 * Global setup for all tests including Pact configuration.
 * =============================================================================
 */

// Increase timeout for Pact tests (contract generation takes time)
jest.setTimeout(30000);

// Suppress console output during tests (optional)
// Uncomment if you want cleaner test output
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Global test utilities
beforeAll(() => {
  // Any global setup
});

afterAll(() => {
  // Any global cleanup
});
