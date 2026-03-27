// consumer/jest.config.js

/** @type {import('jest').Config} */
module.exports = {
  // Display name for this project
  displayName: 'consumer',

  // Use ts-jest to transform TypeScript files
  preset: 'ts-jest',

  // Test environment
  testEnvironment: 'node',

  // Root directory for tests
  rootDir: '.',

  // Where to find test files
  testMatch: [
    '<rootDir>/tests/**/*.spec.ts',
    '<rootDir>/tests/**/*.test.ts',
  ],

  // Module path aliases (must match tsconfig.json paths)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Timeout for tests (Pact tests may take longer)
  testTimeout: 30000,

  // Run tests sequentially for Pact (required for contract generation)
  maxWorkers: 1,

  // Verbose output
  verbose: true,

  // Reporters: console output + HTML report
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './reports',
      filename: 'test-report.html',
      openReport: false,
      pageTitle: 'Consumer Pact Tests',
    }],
  ],

  // Clear mocks between tests
  clearMocks: true,

  // TypeScript configuration
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.strict.json',
      },
    ],
  },

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transformIgnorePatterns: ['/node_modules/'],
};
