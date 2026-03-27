// provider/jest.config.js

/** @type {import('jest').Config} */
module.exports = {
  displayName: 'provider',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',

  testMatch: [
    '<rootDir>/tests/**/*.spec.ts',
    '<rootDir>/tests/**/*.test.ts',
  ],

  testTimeout: 120000, // Provider verification can take longer
  maxWorkers: 1,
  verbose: true,

  // Reporters: console output + HTML report
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './reports',
      filename: 'test-report.html',
      openReport: false,
      pageTitle: 'Provider Verification Tests',
    }],
  ],

  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },

  // Environment variables for provider verification
  globals: {
    PROVIDER_BASE_URL: process.env.PROVIDER_BASE_URL || 'http://localhost:3000',
    PACT_BROKER_URL: process.env.PACT_BROKER_URL || 'http://localhost:9292',
  },
};
