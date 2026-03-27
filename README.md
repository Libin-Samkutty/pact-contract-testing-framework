# Pact Contract Testing Framework

A production-grade **consumer-driven contract testing** framework using [Pact](https://docs.pact.io/) to verify API contracts between a `FrontendApp` consumer and the [DummyJSON](https://dummyjson.com) provider API.

---

## Table of Contents

1. [What is Contract Testing?](#what-is-contract-testing)
2. [How Pact Works](#how-pact-works)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Project Structure](#project-structure)
6. [Running Tests](#running-tests)
7. [Postman Collection](#postman-collection)
8. [Test Coverage](#test-coverage)
9. [Writing New Contract Tests](#writing-new-contract-tests)
10. [Pact Matchers Reference](#pact-matchers-reference)
11. [Configuration](#configuration)
12. [Docker Setup (Optional)](#docker-setup-optional)
13. [CI/CD Workflow](#cicd-workflow)
14. [Pact Broker](#pact-broker)
15. [Troubleshooting](#troubleshooting)
16. [Further Reading](#further-reading)

---

## What is Contract Testing?

Traditional API testing approaches have a fundamental problem: **integration tests are slow, brittle, and require both services to be running at the same time**. Unit tests with mocks are fast, but the mocks can drift out of sync with the real API.

**Contract testing** solves this by:

1. The **consumer** (frontend/client) defines exactly what it expects from the API — this becomes the *contract*
2. The **provider** (backend/API) verifies it can honour that contract independently
3. Both sides can be tested in isolation, without needing each other running

```
Consumer (FrontendApp)          Provider (DummyJSON)
        |                               |
  Runs mock-based tests          Verifies real API
  Generates contract file   -->  matches the contract
        |                               |
  pacts/FrontendApp-DummyJSON.json -----^
```

This means:
- Consumers can develop against a mock immediately, without waiting for the provider
- Providers know exactly which consumers will break if they change their API
- Broken contracts are caught *before* deployment, not after

---

## How Pact Works

Pact implements consumer-driven contract testing in three phases:

### Phase 1 — Consumer generates the contract

The consumer writes tests that interact with a **Pact mock server** instead of the real API. The mock server records every request/response pair as an *interaction*. When the tests pass, Pact writes these interactions to a JSON contract file.

```
Consumer test → Pact mock server → Records interactions → Contract JSON file
```

### Phase 2 — Contract is shared

The contract file (`pacts/FrontendApp-DummyJSON.json`) is either:
- Committed to the repo and shared via Git (simple, local)
- Published to a **Pact Broker** (recommended for teams/CI)

### Phase 3 — Provider verifies the contract

The provider side loads the contract file and **replays every recorded interaction** against the real provider API. If the real API returns what the contract says it should, verification passes.

```
Contract JSON → Pact Verifier → Real Provider API → Pass/Fail
```

---

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** (optional — only needed for the local Pact Broker and DummyJSON container)

Check your versions:

```bash
node --version
npm --version
docker --version  # optional
```

---

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd pact-contract-testing-framework

# 2. Install all dependencies
npm install

# 3. Copy environment config
cp .env.example .env

# 4. Run consumer tests (generates the contract file)
npm run pact:consumer

# 5. Run provider verification (verifies against https://dummyjson.com)
npm run pact:provider
```

No Docker required for local development — the provider tests hit the public `https://dummyjson.com` API by default.

---

## Project Structure

```
pact-contract-testing-framework/
├── consumer/                             # Consumer workspace (FrontendApp)
│   ├── src/
│   │   ├── api/
│   │   │   ├── authClient.ts             # Authentication API client
│   │   │   ├── productsClient.ts         # Products API client
│   │   │   ├── usersClient.ts            # Users API client
│   │   │   └── httpClient.ts             # Base HTTP client (shared fetch wrapper)
│   │   └── types/
│   │       ├── auth.types.ts             # Auth request/response types
│   │       ├── product.types.ts          # Product types
│   │       └── user.types.ts             # User types
│   ├── tests/
│   │   ├── pact/
│   │   │   ├── pactConfig.ts             # Shared Pact config, credentials, regex patterns
│   │   │   ├── auth.pact.spec.ts         # Auth contract tests (login, /me, refresh)
│   │   │   ├── products.pact.spec.ts     # Products contract tests (list, get, create)
│   │   │   ├── errors.pact.spec.ts       # Error response contracts (400, 401, 404)
│   │   │   └── multiInteraction.pact.spec.ts  # Multi-step flow tests
│   │   └── setup.ts                      # Jest global setup
│   ├── jest.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── provider/                             # Provider workspace (DummyJSON verifier)
│   ├── tests/pact/
│   │   ├── provider.verification.spec.ts # Verifies contracts against DummyJSON
│   │   └── stateHandlers.ts              # Provider state setup (auth token caching)
│   ├── jest.config.js
│   └── package.json
│
├── pacts/
│   └── FrontendApp-DummyJSON.json        # Generated contract file (committed to repo)
│
├── docker/
│   └── docker-compose.yml                # Pact Broker (port 9292) + DummyJSON (port 3000)
│
├── scripts/
│   ├── setup.sh                          # Initial setup script
│   ├── publish-pacts.sh                  # Publish contracts to Pact Broker
│   ├── verify-provider.sh                # Run provider verification
│   └── can-i-deploy.sh                   # Check if safe to deploy
│
├── postman/
│   ├── DummyJSON-Pact-Collection.postman_collection.json  # Postman collection (13 requests)
│   └── reports/                          # Newman HTML reports (generated, git-ignored)
│
├── .env.example                          # Environment variable reference
├── package.json                          # Root workspace config + scripts
└── CLAUDE.md                             # AI assistant instructions for this repo
```

This is an **npm workspaces monorepo**. The root `package.json` orchestrates both `consumer/` and `provider/` workspaces.

---

## Running Tests

### Run everything (consumer + provider)

```bash
npm run pact:all
```

### Consumer only — generates the contract file

```bash
npm run pact:consumer
# Equivalent to:
npm run test:pact -w consumer
```

This runs all `*.pact.spec.ts` files and writes the contract to `pacts/FrontendApp-DummyJSON.json`.

### Provider only — verifies the contract

```bash
npm run pact:provider
# Equivalent to:
npm run test:pact -w provider
```

This replays every interaction in the contract file against `https://dummyjson.com` (or your `PROVIDER_BASE_URL`).

### Code coverage (consumer only)

```bash
npm run test:coverage -w consumer
# Report: consumer/coverage/index.html
```

Coverage thresholds enforced: **80%** for branches, functions, lines, and statements.

### HTML test reports

Generated automatically after each run:
- `consumer/reports/test-report.html`
- `provider/reports/test-report.html`

---

## Postman Collection

The collection at [postman/DummyJSON-Pact-Collection.postman_collection.json](postman/DummyJSON-Pact-Collection.postman_collection.json) covers the same 13 endpoints validated by the Pact tests and lets you explore them manually — or run them headlessly via Newman in CI.

### Requests included

| Folder | Request | Method | Endpoint |
|--------|---------|--------|----------|
| Auth | Login - Valid Credentials | POST | `/auth/login` |
| Auth | Login - Invalid Credentials | POST | `/auth/login` |
| Auth | Get Authenticated User | GET | `/auth/me` |
| Auth | Get Authenticated User - Invalid Token | GET | `/auth/me` |
| Auth | Refresh Token | POST | `/auth/refresh` |
| Products | Get All Products | GET | `/products` |
| Products | Get Products - Paginated | GET | `/products?limit=10&skip=10` |
| Products | Get Product by ID | GET | `/products/1` |
| Products | Get Product - Not Found | GET | `/products/99999` |
| Products | Create Product | POST | `/products/add` |
| Users | Get All Users | GET | `/users` |
| Users | Get User by ID | GET | `/users/1` |
| Users | Get User - Not Found | GET | `/users/99999` |

All requests hit the public `https://dummyjson.com` API — no local server required.

### Using in Postman (GUI)

**Prerequisites:** [Postman desktop app](https://www.postman.com/downloads/) (free) — no account needed for local use.

1. Open Postman → **Import** → select `postman/DummyJSON-Pact-Collection.postman_collection.json`
2. Run **Auth → Login - Valid Credentials** first — the test script automatically saves `accessToken` and `refreshToken` as collection variables
3. All other requests are ready to run in any order

### Running via Newman (terminal)

**Prerequisites:** Newman is installed as a dev dependency — just run `npm install` from the root.

```bash
# Run all 13 requests with CLI output
npm run test:api

# Run with an HTML report saved to postman/reports/report.html
npm run test:api:html
```

Newman runs requests in collection order, so `Login - Valid Credentials` fires first and the access token is available to all authenticated requests automatically.

> **Note on real API vs Pact mock behaviour:** The Pact consumer tests use a mock server that is configured to return `401` when no `Authorization` header is present. The real DummyJSON API returns `200` in that case. The Postman collection accounts for this — the "invalid token" request sends `Bearer this-is-not-a-valid-token` explicitly, which the real API correctly rejects with `401`.

---

## Test Coverage

### Consumer tests — 16 tests across 4 files

| File | Interactions |
|------|-------------|
| [auth.pact.spec.ts](consumer/tests/pact/auth.pact.spec.ts) | POST /auth/login (valid credentials), POST /auth/login (invalid credentials), GET /auth/me (valid token), GET /auth/me (invalid token), POST /auth/refresh |
| [products.pact.spec.ts](consumer/tests/pact/products.pact.spec.ts) | GET /products (list), GET /products?limit=5&skip=0 (pagination), GET /products/1 (found), GET /products/9999 (not found), POST /products/add |
| [errors.pact.spec.ts](consumer/tests/pact/errors.pact.spec.ts) | 401 missing auth header, 404 product not found, 404 user not found, 400 bad login body |
| [multiInteraction.pact.spec.ts](consumer/tests/pact/multiInteraction.pact.spec.ts) | Full auth flow (login → /me → refresh), product browse flow (list → detail) |

### Provider tests

| Mode | When it runs | Contract source |
|------|-------------|-----------------|
| **Local Verification** | Always | `pacts/FrontendApp-DummyJSON.json` (local file) |
| **Broker Verification** | Only when `PACT_BROKER_URL` is set and `CI=true` | Pact Broker API |

---

## Writing New Contract Tests

### Step 1 — Add the consumer test

Create or extend a `*.pact.spec.ts` file in `consumer/tests/pact/`.

```typescript
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { pactConfig } from './pactConfig';
import { MyApiClient } from '../../src/api/myApiClient';

const { like, integer, string } = MatchersV3;

describe('My API Contract', () => {
  const provider = new PactV3(pactConfig);  // shares consumer/provider name + output dir

  it('GET /my-resource returns data', async () => {
    await provider
      // Provider state: describes what must be true on the provider side
      .given('a resource exists')
      // Unique description — appears in the contract file and Pact Broker
      .uponReceiving('a request to get a resource')
      // The exact request the consumer will make
      .withRequest({
        method: 'GET',
        path: '/my-resource',
        headers: { Authorization: 'Bearer some-token' },
      })
      // What the consumer expects back (use matchers, not exact values)
      .willRespondWith({
        status: 200,
        body: {
          id: integer(1),        // must be an integer
          name: like('example'), // must be a string, value flexible
        },
      })
      // Execute: Pact spins up a mock server and runs this callback
      .executeTest(async (mockServer) => {
        const client = new MyApiClient({ baseUrl: mockServer.url });
        const result = await client.getResource();
        expect(result.id).toBeDefined();
      });
  });
});
```

**Key rules:**
- Use `pactConfig` from [pactConfig.ts](consumer/tests/pact/pactConfig.ts) — do not hard-code consumer/provider names
- Use Pact **matchers** (`like`, `integer`, `regex`, etc.) instead of exact values — contracts should be flexible enough to survive minor API changes
- Each interaction needs a **unique** `.uponReceiving()` description within the contract

### Step 2 — Run consumer tests to regenerate the contract

```bash
npm run pact:consumer
```

The contract at `pacts/FrontendApp-DummyJSON.json` will be updated with your new interaction.

### Step 3 — Add a provider state handler (if needed)

If your test uses `.given('some state')`, add a matching handler in [stateHandlers.ts](provider/tests/pact/stateHandlers.ts):

```typescript
export const stateHandlers: StateHandlers = {
  'a resource exists': async () => {
    // Set up any state the provider needs (e.g., seed data, cache auth token)
    console.log('State: resource exists');
  },
};
```

For the DummyJSON provider (a public API), state handlers are mostly no-ops or token-caching logic since the data is pre-seeded.

### Step 4 — Run provider verification

```bash
npm run pact:provider
```

---

## Pact Matchers Reference

Matchers let contracts be flexible — they check *structure and type*, not exact values. This prevents contracts from breaking due to trivial data changes (e.g., a user's name changing).

| Matcher | Import | What it checks | Example |
|---------|--------|---------------|---------|
| `like(value)` | `MatchersV3` | Type only — value is just a sample | `like('Emily')` → any string |
| `integer(n)` | `MatchersV3` | Must be an integer | `integer(1)` → any integer |
| `decimal(n)` | `MatchersV3` | Must be a decimal number | `decimal(9.99)` → any float |
| `string(s)` | `MatchersV3` | Must be a string | `string('token')` → any string |
| `boolean(b)` | `MatchersV3` | Must be a boolean | `boolean(true)` → any boolean |
| `eachLike(item)` | `MatchersV3` | Array with at least one item matching the template | `eachLike({ id: integer(1) })` |
| `regex(pattern, sample)` | `MatchersV3` | Must match the regex | `regex(/^\d+$/, '123')` |
| `atLeastOneLike(item, n)` | `MatchersV3` | Array with at least n items | `atLeastOneLike({ id: 1 }, 2)` |

### Regex patterns defined in this project

See [pactConfig.ts](consumer/tests/pact/pactConfig.ts) for reusable patterns:

```typescript
PATTERNS.JWT_TOKEN     // /^eyJ.../   — JWT access/refresh tokens
PATTERNS.ISO_DATETIME  // ISO 8601 datetime strings
PATTERNS.EMAIL         // email addresses
PATTERNS.URL           // http/https URLs
PATTERNS.UUID          // UUID v4 format
```

**Usage example:**

```typescript
import { MatchersV3 } from '@pact-foundation/pact';
import { PATTERNS } from './pactConfig';

const { regex } = MatchersV3;

body: {
  accessToken: regex(PATTERNS.JWT_TOKEN, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'),
  createdAt: regex(PATTERNS.ISO_DATETIME, '2024-01-01T00:00:00.000Z'),
}
```

---

## Configuration

### Environment variables

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

| Variable | Default | Purpose |
|----------|---------|---------|
| `PROVIDER_BASE_URL` | `https://dummyjson.com` | Provider URL for verification. Set to `http://localhost:3000` to use Docker |
| `PACT_BROKER_BASE_URL` | `http://localhost:9292` | Pact Broker URL for publishing/fetching contracts |
| `PACT_BROKER_USERNAME` | _(empty)_ | Broker basic auth username |
| `PACT_BROKER_PASSWORD` | _(empty)_ | Broker basic auth password |
| `PACT_BROKER_TOKEN` | _(empty)_ | Broker token-based auth (alternative to username/password) |
| `PACT_PUBLISH_VERIFICATION_RESULTS` | `false` | Set `true` in CI to publish results to broker |
| `PACT_LOG_LEVEL` | `info` | Pact log verbosity (`trace`, `debug`, `info`, `warn`, `error`) |
| `GIT_BRANCH` | `main` | Branch name used for Pact Broker tagging |
| `GIT_COMMIT` | `local` | Git SHA used as provider version in Pact Broker |
| `CI` | `false` | Set `true` in CI — enables broker verification |
| `DEPLOY_ENVIRONMENT` | `production` | Target environment for `can-i-deploy` checks |

### Test credentials

The DummyJSON test account used across consumer and provider tests:

```
username: emilys
password: emilyspass
```

Defined in [pactConfig.ts](consumer/tests/pact/pactConfig.ts) and [stateHandlers.ts](provider/tests/pact/stateHandlers.ts). **Keep these in sync** if you change them.

### Jest configuration

**Consumer** ([consumer/jest.config.js](consumer/jest.config.js)):
- Preset: `ts-jest` with strict TypeScript (`tsconfig.strict.json`)
- Timeout: **30 seconds**
- `maxWorkers: 1` — **required** for Pact (contract file writes must be sequential)
- Coverage threshold: **80%** across all metrics

**Provider** ([provider/jest.config.js](provider/jest.config.js)):
- Preset: `ts-jest`
- Timeout: **120 seconds** (provider verification hits a real API and takes longer)
- `maxWorkers: 1`

---

## Docker Setup (Optional)

Docker is **not required** for local development. The provider tests default to `https://dummyjson.com`.

Use Docker when you want to:
- Run a **local Pact Broker** to publish/share contracts without PactFlow
- Run a **local DummyJSON** instance for offline development

### Start services

```bash
npm run docker:up
# Starts:
#   Pact Broker → http://localhost:9292
#   DummyJSON   → http://localhost:3000
```

### Other Docker commands

```bash
npm run docker:down    # Stop services
npm run docker:logs    # Stream logs from all containers
npm run docker:clean   # Stop and remove volumes (full reset)
```

### Use Docker DummyJSON for provider verification

```bash
PROVIDER_BASE_URL=http://localhost:3000 npm run pact:provider
```

### Pact Broker UI

Once running, open [http://localhost:9292](http://localhost:9292) to browse published contracts, view verification results, and use the network diagram.

### Docker architecture

```
docker-compose.yml
├── pact-broker (pactfoundation/pact-broker:latest)
│   ├── Port: 9292
│   └── Storage: SQLite (dev) / PostgreSQL (prod — see commented section)
└── dummyjson (ovi2406/dummyjson:latest)
    └── Port: 3000
```

For production Pact Broker deployments, uncomment the PostgreSQL section in [docker/docker-compose.yml](docker/docker-compose.yml).

---

## CI/CD Workflow

The full contract testing pipeline runs in four steps:

```
┌─────────────────────────────────────────────────────────────────┐
│                     CI/CD Pipeline                              │
│                                                                 │
│  1. Consumer tests     2. Publish       3. Provider verify      │
│  ─────────────────     ───────────      ───────────────────     │
│  npm run pact:consumer → pact:publish → pact:provider           │
│                                              ↓                  │
│                        4. can-i-deploy check                    │
│                        ──────────────────────                   │
│                        npm run pact:can-i-deploy                │
└─────────────────────────────────────────────────────────────────┘
```

### Step-by-step

```bash
# 1. Consumer: run tests and generate contract file
npm run pact:consumer

# 2. Publish contract to Pact Broker (requires broker running)
npm run pact:publish

# 3. Provider: verify contracts published to broker
PACT_BROKER_URL=http://localhost:9292 CI=true npm run pact:provider

# 4. Check if this version is safe to deploy
npm run pact:can-i-deploy
```

### One-command demo (requires Docker)

```bash
npm run demo
# Starts Docker, runs consumer, publishes, verifies provider
```

### CI environment variables to set

```bash
CI=true
GIT_COMMIT=$(git rev-parse HEAD)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
PACT_BROKER_URL=http://your-broker
PACT_PUBLISH_VERIFICATION_RESULTS=true
```

### Consumer version selectors (broker verification)

When verifying from the Pact Broker, the provider uses these selectors to know which contracts to verify:

```typescript
consumerVersionSelectors: [
  { mainBranch: true },         // contracts from main branch
  { deployedOrReleased: true }, // contracts currently deployed to any environment
]
```

This ensures the provider always verifies against the consumer versions that matter.

---

## Pact Broker

The Pact Broker is a central store for contracts and verification results. It enables:

- **Contract sharing** between consumer and provider teams without repo coupling
- **Verification history** — see which provider versions pass which contracts
- **Network diagram** — visualise all consumer/provider relationships
- **`can-i-deploy`** — check if a version is safe to deploy based on verification results
- **Webhooks** — trigger CI pipelines when new contracts are published

### Publishing contracts

```bash
# Using the publish script
./scripts/publish-pacts.sh

# Or directly with pact-broker CLI
npx pact-broker publish pacts/ \
  --broker-base-url http://localhost:9292 \
  --consumer-app-version $(git rev-parse HEAD) \
  --branch $(git rev-parse --abbrev-ref HEAD)
```

### can-i-deploy

Before deploying, check that all required verifications have passed:

```bash
./scripts/can-i-deploy.sh
# or
npx pact-broker can-i-deploy \
  --pacticipant FrontendApp \
  --version $(git rev-parse HEAD) \
  --to-environment production \
  --broker-base-url http://localhost:9292
```

### PactFlow (hosted Pact Broker)

For teams wanting a managed broker, [PactFlow](https://pactflow.io) is the official hosted option with additional features (secrets, bi-directional contracts, RBAC). Replace `PACT_BROKER_BASE_URL` with your PactFlow URL and set `PACT_BROKER_TOKEN`.

---

## Troubleshooting

### Consumer tests fail with port conflicts

Pact starts a mock HTTP server during consumer tests. If a port is already in use:

```
Error: listen EADDRINUSE: address already in use :::PORT
```

Fix: ensure `maxWorkers: 1` in `consumer/jest.config.js` (already set). This prevents parallel Pact instances from competing for ports.

### Provider verification fails with 401 Unauthorized

The provider uses real tokens from a login flow. Check that:
1. The DummyJSON API is reachable (`curl https://dummyjson.com/auth/login`)
2. Test credentials in [stateHandlers.ts](provider/tests/pact/stateHandlers.ts) match [pactConfig.ts](consumer/tests/pact/pactConfig.ts)
3. The `requestFilter` in [provider.verification.spec.ts](provider/tests/pact/provider.verification.spec.ts) is replacing placeholder tokens with the cached real token

### Contract file is out of date

Re-run consumer tests to regenerate:

```bash
npm run pact:consumer
```

Then commit the updated `pacts/FrontendApp-DummyJSON.json`.

### Provider tests timeout

The default provider timeout is 120 seconds. If DummyJSON is slow:

```bash
# Use the local Docker instance instead
npm run docker:up
PROVIDER_BASE_URL=http://localhost:3000 npm run pact:provider
```

### Pact Broker not reachable

```bash
# Check if broker is running
npm run docker:logs

# Or start it
npm run docker:up

# Verify it's healthy
curl http://localhost:9292/diagnostic/status/heartbeat
```

### Clean slate

```bash
# Remove generated pact files
npm run clean:pacts

# Remove all node_modules and reinstall
npm run clean
npm install
```

---

## Further Reading

### Pact documentation
- [Pact docs](https://docs.pact.io/) — main documentation site
- [Pact JS implementation guide](https://docs.pact.io/implementation_guides/javascript) — JavaScript/TypeScript specific
- [Consumer tests guide](https://docs.pact.io/consumer) — writing consumer contract tests
- [Provider verification guide](https://docs.pact.io/provider) — verifying provider contracts
- [Pact matchers](https://docs.pact.io/getting_started/matching) — all available matchers explained
- [Pact Broker docs](https://docs.pact.io/pact_broker) — setting up and using the broker
- [can-i-deploy](https://docs.pact.io/pact_broker/can_i_deploy) — pre-deployment verification checks

### DummyJSON API
- [DummyJSON docs](https://dummyjson.com/docs) — full API reference
- [Auth endpoints](https://dummyjson.com/docs/auth) — login, refresh, /me
- [Products endpoints](https://dummyjson.com/docs/products) — product CRUD
- [Users](https://dummyjson.com/users) — list of test accounts (including `emilys`)

### Contract testing concepts
- [Consumer-driven contract testing](https://martinfowler.com/articles/consumerDrivenContracts.html) — Martin Fowler's foundational article
- [Contract testing vs integration testing](https://docs.pact.io/faq/convinceme) — when to use each
- [PactFlow](https://pactflow.io) — hosted Pact Broker with extra features

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@pact-foundation/pact` | `^12.1.0` | Pact contract testing library |
| `jest` | `^29.7.0` | Test runner |
| `ts-jest` | `^29.1.1` | TypeScript support for Jest |
| `jest-html-reporters` | `^3.1.7` | HTML test reports |
| `node-fetch` | `^2.7.0` | HTTP client for API calls |
| `typescript` | `^5.3.0` | TypeScript compiler |
| `newman` | `^6.1.3` | CLI runner for Postman collections |
| `newman-reporter-htmlextra` | `^1.23.1` | HTML report generator for Newman runs |

**Runtime requirements:** Node.js >= 18, npm >= 9
