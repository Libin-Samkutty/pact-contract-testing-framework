// consumer/tests/pact/pactConfig.ts

/**
 * =============================================================================
 * PACT CONFIGURATION
 * =============================================================================
 * Shared Pact configuration for all consumer contract tests.
 * This file centralizes all Pact settings for consistency.
 *
 * @see https://docs.pact.io/implementation_guides/javascript/docs/configuration
 * =============================================================================
 */

import path from 'path';
import { LogLevel } from '@pact-foundation/pact';

/**
 * Consumer name - identifies who is consuming the API
 * This name will appear in the generated contract and Pact Broker
 */
export const CONSUMER_NAME = 'FrontendApp';

/**
 * Provider name - identifies the API provider
 * Must match the provider's name during verification
 */
export const PROVIDER_NAME = 'DummyJSON';

/**
 * Directory where Pact contract files will be written
 */
export const PACT_DIR = path.resolve(__dirname, '../../../pacts');

/**
 * Pact log level
 * Options: 'trace' | 'debug' | 'info' | 'warn' | 'error'
 */
export const LOG_LEVEL: LogLevel = (process.env.PACT_LOG_LEVEL as LogLevel) || 'info';

/**
 * Shared Pact configuration object
 * Use this to create PactV3 instances in test files
 */
export const pactConfig = {
  consumer: CONSUMER_NAME,
  provider: PROVIDER_NAME,
  dir: PACT_DIR,
  logLevel: LOG_LEVEL,
};

/**
 * Test credentials for DummyJSON
 * These are valid credentials from DummyJSON's test data
 * @see https://dummyjson.com/users
 */
export const TEST_CREDENTIALS = {
  valid: {
    username: 'emilys',
    password: 'emilyspass',
  },
  invalid: {
    username: 'invalid_user',
    password: 'wrong_password',
  },
};

/**
 * Regex patterns for common matchers
 */
export const PATTERNS = {
  /** JWT token pattern */
  JWT_TOKEN: /^eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]+$/,

  /** ISO 8601 datetime pattern */
  ISO_DATETIME: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,

  /** Email pattern */
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  /** URL pattern */
  URL: /^https?:\/\/.+/,

  /** UUID pattern */
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
};
