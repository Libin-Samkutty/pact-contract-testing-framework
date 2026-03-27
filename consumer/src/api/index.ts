// consumer/src/api/index.ts

/**
 * =============================================================================
 * API CLIENT EXPORTS
 * =============================================================================
 * Central export point for all API clients.
 * =============================================================================
 */

export { HttpClient, HttpClientConfig, HttpResponse, HttpError } from './httpClient';
export { AuthClient } from './authClient';
export { ProductsClient } from './productsClient';
export { UsersClient } from './usersClient';

import { HttpClientConfig } from './httpClient';
import { AuthClient } from './authClient';
import { ProductsClient } from './productsClient';
import { UsersClient } from './usersClient';

/**
 * Factory function to create all API clients with shared configuration
 *
 * @param config - HTTP client configuration
 * @returns Object containing all API clients
 *
 * @example
 * ```typescript
 * const api = createApiClients({ baseUrl: 'https://dummyjson.com' });
 *
 * const products = await api.products.getProducts();
 * const user = await api.auth.login({ username: 'emilys', password: 'emilyspass' });
 * ```
 */
export function createApiClients(config: HttpClientConfig) {
  return {
    auth: new AuthClient(config),
    products: new ProductsClient(config),
    users: new UsersClient(config),
  };
}
