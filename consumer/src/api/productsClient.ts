// consumer/src/api/productsClient.ts

/**
 * =============================================================================
 * PRODUCTS CLIENT
 * =============================================================================
 * Client for DummyJSON product endpoints.
 * Handles product listing, retrieval, creation, and search.
 *
 * @see https://dummyjson.com/docs/products
 * =============================================================================
 */

import { HttpClient, HttpClientConfig, HttpError } from './httpClient';
import {
  Product,
  ProductListResponse,
  CreateProductRequest,
  CreateProductResponse,
  ProductListParams,
  ProductErrorResponse,
} from '../types';

/**
 * Products client for DummyJSON API
 *
 * @example
 * ```typescript
 * const products = new ProductsClient({ baseUrl: 'https://dummyjson.com' });
 *
 * // Get all products
 * const list = await products.getProducts();
 *
 * // Get single product
 * const product = await products.getProductById(1);
 * ```
 */
export class ProductsClient {
  private readonly httpClient: HttpClient;

  constructor(config: HttpClientConfig) {
    this.httpClient = new HttpClient(config);
  }

  /**
   * Get a paginated list of products
   *
   * @param params - Pagination parameters
   * @returns Paginated product list
   *
   * @example
   * ```typescript
   * // Get first 10 products
   * const result = await client.getProducts({ limit: 10 });
   *
   * // Get next page
   * const page2 = await client.getProducts({ limit: 10, skip: 10 });
   * ```
   */
  async getProducts(params?: ProductListParams): Promise<ProductListResponse> {
    let path = '/products';

    if (params) {
      const parts: string[] = [];
      if (params.limit !== undefined) parts.push(`limit=${params.limit}`);
      if (params.skip !== undefined) parts.push(`skip=${params.skip}`);
      if (params.select !== undefined) parts.push(`select=${encodeURIComponent(params.select)}`);

      if (parts.length > 0) {
        path += `?${parts.join('&')}`;
      }
    }

    const response = await this.httpClient.get<ProductListResponse>(path);
    return response.data;
  }

  /**
   * Get a single product by ID
   *
   * @param id - Product ID
   * @returns Product details
   * @throws HttpError if product not found (404)
   *
   * @example
   * ```typescript
   * const product = await client.getProductById(1);
   * console.log(product.title); // "iPhone 9"
   * ```
   */
  async getProductById(id: number): Promise<Product> {
    const response = await this.httpClient.get<Product>(`/products/${id}`);
    return response.data;
  }

  /**
   * Create a new product
   * Note: DummyJSON simulates creation - data is not persisted
   *
   * @param product - Product data to create
   * @returns Created product with assigned ID
   *
   * @example
   * ```typescript
   * const newProduct = await client.createProduct({
   *   title: 'New Product',
   *   price: 99.99,
   *   category: 'electronics'
   * });
   * console.log(newProduct.id); // New ID assigned by server
   * ```
   */
  async createProduct(product: CreateProductRequest): Promise<CreateProductResponse> {
    const response = await this.httpClient.post<CreateProductResponse>(
      '/products/add',
      product
    );
    return response.data;
  }

  /**
   * Get a product by ID with status information
   * Useful for handling 404 cases gracefully
   *
   * @param id - Product ID
   * @returns Product or error with status
   */
  async getProductByIdWithStatus(
    id: number
  ): Promise<{ found: true; product: Product } | { found: false; error: ProductErrorResponse; status: number }> {
    try {
      const product = await this.getProductById(id);
      return { found: true, product };
    } catch (error) {
      if (error instanceof HttpError) {
        return {
          found: false,
          error: error.data as ProductErrorResponse,
          status: error.status,
        };
      }
      throw error;
    }
  }

  /**
   * Search products by query
   *
   * @param query - Search query
   * @returns Matching products
   */
  async searchProducts(query: string): Promise<ProductListResponse> {
    const response = await this.httpClient.get<ProductListResponse>(
      `/products/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  }

  /**
   * Get products by category
   *
   * @param category - Category slug
   * @returns Products in category
   */
  async getProductsByCategory(category: string): Promise<ProductListResponse> {
    const response = await this.httpClient.get<ProductListResponse>(
      `/products/category/${encodeURIComponent(category)}`
    );
    return response.data;
  }

  /**
   * Get all product categories
   *
   * @returns Array of category names
   */
  async getCategories(): Promise<string[]> {
    const response = await this.httpClient.get<string[]>('/products/categories');
    return response.data;
  }
}
