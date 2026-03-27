// consumer/src/types/product.types.ts

/**
 * =============================================================================
 * PRODUCT TYPES
 * =============================================================================
 * Type definitions for DummyJSON product endpoints.
 * These types define the product data structure our consumer expects.
 *
 * @see https://dummyjson.com/docs/products
 * =============================================================================
 */

/**
 * Product dimensions
 */
export interface ProductDimensions {
  width: number;
  height: number;
  depth: number;
}

/**
 * Product review
 */
export interface ProductReview {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

/**
 * Product metadata
 */
export interface ProductMeta {
  createdAt: string;
  updatedAt: string;
  barcode: string;
  qrCode: string;
}

/**
 * Single product entity
 * Returned from GET /products/{id} or as items in product list
 */
export interface Product {
  /** Unique product identifier */
  id: number;

  /** Product title/name */
  title: string;

  /** Detailed product description */
  description: string;

  /** Product category */
  category: string;

  /** Current price */
  price: number;

  /** Discount percentage (0-100) */
  discountPercentage: number;

  /** Average customer rating (0-5) */
  rating: number;

  /** Available stock quantity */
  stock: number;

  /** Tags associated with the product */
  tags: string[];

  /** Brand name */
  brand?: string;

  /** Stock-keeping unit identifier */
  sku: string;

  /** Product weight in grams */
  weight: number;

  /** Product dimensions */
  dimensions: ProductDimensions;

  /** Warranty information */
  warrantyInformation: string;

  /** Shipping information */
  shippingInformation: string;

  /** Product availability status */
  availabilityStatus: string;

  /** Customer reviews */
  reviews: ProductReview[];

  /** Return policy details */
  returnPolicy: string;

  /** Minimum order quantity */
  minimumOrderQuantity: number;

  /** Product metadata */
  meta: ProductMeta;

  /** Array of product image URLs */
  images: string[];

  /** Primary thumbnail image URL */
  thumbnail: string;
}

/**
 * Simplified product for list views (consumer's actual needs)
 * This represents what our frontend actually uses from the product list
 */
export interface ProductSummary {
  id: number;
  title: string;
  price: number;
  rating: number;
  thumbnail: string;
  category: string;
}

/**
 * Paginated product list response
 * Returned from GET /products
 */
export interface ProductListResponse {
  /** Array of products */
  products: Product[];

  /** Total number of products available */
  total: number;

  /** Number of products skipped (for pagination) */
  skip: number;

  /** Maximum products returned per request */
  limit: number;
}

/**
 * Request payload for creating a new product
 * Sent to POST /products/add
 */
export interface CreateProductRequest {
  /** Product title (required) */
  title: string;

  /** Product description */
  description?: string;

  /** Product price (required) */
  price: number;

  /** Discount percentage */
  discountPercentage?: number;

  /** Customer rating */
  rating?: number;

  /** Stock quantity */
  stock?: number;

  /** Brand name */
  brand?: string;

  /** Product category */
  category?: string;

  /** Product images */
  images?: string[];
}

/**
 * Response from creating a new product
 * Returned from POST /products/add
 * Note: DummyJSON simulates creation - data is not persisted
 */
export interface CreateProductResponse extends Product {
  /** The newly assigned product ID */
  id: number;
}

/**
 * Parameters for fetching product list
 */
export interface ProductListParams {
  /** Number of products to skip */
  skip?: number;

  /** Maximum products to return */
  limit?: number;

  /** Field to select (comma-separated) */
  select?: string;
}

/**
 * Error response from product endpoints
 */
export interface ProductErrorResponse {
  /** Error message */
  message: string;
}
