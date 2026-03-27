// consumer/tests/pact/products.pact.spec.ts

/**
 * =============================================================================
 * PRODUCTS CONTRACT TESTS
 * =============================================================================
 * Consumer-driven contract tests for DummyJSON product endpoints.
 *
 * Tests cover:
 * - GET /products (product list with pagination)
 * - GET /products/{id} (single product)
 * - POST /products/add (create product)
 * - GET /products/{id} - 404 case (not found)
 *
 * @see https://dummyjson.com/docs/products
 * =============================================================================
 */

import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { ProductsClient } from '../../src/api/productsClient';
import { pactConfig } from './pactConfig';

const { like, eachLike, integer, decimal, string, regex } = MatchersV3;

describe('Products API Contract', () => {
  const provider = new PactV3(pactConfig);

  /**
   * ---------------------------------------------------------------------------
   * PRODUCT LIST CONTRACT
   * ---------------------------------------------------------------------------
   */
  describe('GET /products', () => {
    it('returns a paginated list of products', async () => {
      await provider
        .given('products exist')
        .uponReceiving('a request for all products')
        .withRequest({
          method: 'GET',
          path: '/products',
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': regex(/application\/json.*/, 'application/json'),
          },
          body: {
            /**
             * eachLike() - specifies that this is an array with at least one
             * element matching the given shape. The actual number of elements
             * doesn't matter for contract verification.
             */
            products: eachLike({
              id: integer(1),
              title: like('iPhone 9'),
              description: like('An apple mobile which is nothing like apple'),
              category: like('smartphones'),
              price: decimal(549.0),
              discountPercentage: like(12.96),
              rating: decimal(4.69),
              stock: integer(94),
              tags: eachLike('smartphone'),
              sku: like('RCH45Q1A'),
              weight: integer(2),
              dimensions: {
                width: decimal(6.62),
                height: decimal(10.01),
                depth: decimal(6.65),
              },
              warrantyInformation: like('1 month warranty'),
              shippingInformation: like('Ships in 1 month'),
              availabilityStatus: like('Low Stock'),
              reviews: eachLike({
                rating: integer(5),
                comment: like('Great product!'),
                date: like('2024-05-23T08:56:21.618Z'),
                reviewerName: like('John Doe'),
                reviewerEmail: like('john.doe@x.dummyjson.com'),
              }),
              returnPolicy: like('30 days return policy'),
              minimumOrderQuantity: integer(1),
              meta: {
                createdAt: like('2024-05-23T08:56:21.618Z'),
                updatedAt: like('2024-05-23T08:56:21.618Z'),
                barcode: like('2517819903837'),
                qrCode: like('https://assets.dummyjson.com/public/qr-code.png'),
              },
              images: eachLike('https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/1.png'),
              thumbnail: like('https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/thumbnail.png'),
            }),
            total: integer(194),
            skip: integer(0),
            limit: integer(30),
          },
        })
        .executeTest(async (mockServer) => {
          const productsClient = new ProductsClient({
            baseUrl: mockServer.url,
          });

          const result = await productsClient.getProducts();

          // Verify structure
          expect(result).toBeDefined();
          expect(result.products).toBeInstanceOf(Array);
          expect(result.products.length).toBeGreaterThan(0);
          expect(result.total).toBeGreaterThan(0);
          expect(result.skip).toBeDefined();
          expect(result.limit).toBeDefined();

          // Verify product structure
          const firstProduct = result.products[0];
          expect(firstProduct).toBeDefined();
          expect(firstProduct!.id).toBeDefined();
          expect(firstProduct!.title).toBeDefined();
          expect(firstProduct!.price).toBeDefined();
          expect(firstProduct!.rating).toBeDefined();
        });
    });

    it('supports pagination with skip and limit', async () => {
      await provider
        .given('products exist')
        .uponReceiving('a request for products with pagination')
        .withRequest({
          method: 'GET',
          path: '/products',
          query: {
            limit: '10',
            skip: '10',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': regex(/application\/json.*/, 'application/json'),
          },
          body: {
            products: eachLike({
              id: integer(11),
              title: like('Product Name'),
              price: decimal(99.99),
              rating: decimal(4.5),
              thumbnail: like('https://example.com/image.png'),
            }),
            total: integer(194),
            skip: integer(10),
            limit: integer(10),
          },
        })
        .executeTest(async (mockServer) => {
          const productsClient = new ProductsClient({
            baseUrl: mockServer.url,
          });

          const result = await productsClient.getProducts({ limit: 10, skip: 10 });

          expect(result.skip).toBe(10);
          expect(result.limit).toBe(10);
          expect(result.products.length).toBeGreaterThan(0);
        });
    });
  });

  /**
   * ---------------------------------------------------------------------------
   * SINGLE PRODUCT CONTRACT
   * ---------------------------------------------------------------------------
   */
  describe('GET /products/{id}', () => {
    describe('when product exists', () => {
      it('returns the product details', async () => {
        const productId = 1;

        await provider
          .given('a product with id 1 exists')
          .uponReceiving('a request for product with id 1')
          .withRequest({
            method: 'GET',
            path: `/products/${productId}`,
          })
          .willRespondWith({
            status: 200,
            headers: {
              'Content-Type': regex(/application\/json.*/, 'application/json'),
            },
            body: {
              id: integer(productId),
              title: like('iPhone 9'),
              description: like('An apple mobile which is nothing like apple'),
              category: like('smartphones'),
              price: decimal(549.0),
              discountPercentage: decimal(12.96),
              rating: decimal(4.69),
              stock: integer(94),
              tags: eachLike('smartphone'),
              brand: like('Apple'),
              sku: like('RCH45Q1A'),
              weight: integer(2),
              dimensions: {
                width: decimal(6.62),
                height: decimal(10.01),
                depth: decimal(6.65),
              },
              warrantyInformation: like('1 month warranty'),
              shippingInformation: like('Ships in 1 month'),
              availabilityStatus: like('Low Stock'),
              reviews: eachLike({
                rating: integer(5),
                comment: like('Great value!'),
                date: like('2024-05-23T08:56:21.618Z'),
                reviewerName: like('John Doe'),
                reviewerEmail: like('john.doe@x.dummyjson.com'),
              }),
              returnPolicy: like('30 days return policy'),
              minimumOrderQuantity: integer(1),
              meta: {
                createdAt: like('2024-05-23T08:56:21.618Z'),
                updatedAt: like('2024-05-23T08:56:21.618Z'),
                barcode: like('2517819903837'),
                qrCode: like('https://assets.dummyjson.com/public/qr-code.png'),
              },
              images: eachLike('https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/1.png'),
              thumbnail: like('https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/thumbnail.png'),
            },
          })
          .executeTest(async (mockServer) => {
            const productsClient = new ProductsClient({
              baseUrl: mockServer.url,
            });

            const product = await productsClient.getProductById(productId);

            expect(product).toBeDefined();
            expect(product.id).toBe(productId);
            expect(product.title).toBeDefined();
            expect(product.price).toBeGreaterThan(0);
            expect(product.category).toBeDefined();
            expect(product.stock).toBeDefined();
          });
      });
    });

    /**
     * -------------------------------------------------------------------------
     * PRODUCT NOT FOUND CONTRACT
     * -------------------------------------------------------------------------
     */
    describe('when product does not exist', () => {
      it('returns 404 with error message', async () => {
        const nonExistentId = 99999;

        await provider
          .given('no product with id 99999 exists')
          .uponReceiving('a request for non-existent product')
          .withRequest({
            method: 'GET',
            path: `/products/${nonExistentId}`,
          })
          .willRespondWith({
            status: 404,
            headers: {
              'Content-Type': regex(/application\/json.*/, 'application/json'),
            },
            body: {
              message: like("Product with id '99999' not found"),
            },
          })
          .executeTest(async (mockServer) => {
            const productsClient = new ProductsClient({
              baseUrl: mockServer.url,
            });

            const result = await productsClient.getProductByIdWithStatus(nonExistentId);

            expect(result.found).toBe(false);
            if (!result.found) {
              expect(result.status).toBe(404);
              expect(result.error.message).toBeDefined();
            }
          });
      });
    });
  });

  /**
   * ---------------------------------------------------------------------------
   * CREATE PRODUCT CONTRACT
   * ---------------------------------------------------------------------------
   */
  describe('POST /products/add', () => {
    it('creates a new product and returns it with an id', async () => {
      const newProduct = {
        title: 'Test Product',
        description: 'A product created for contract testing',
        price: 99.99,
        stock: 50,
        category: 'electronics',
        brand: 'TestBrand',
      };

      await provider
        .given('product creation is enabled')
        .uponReceiving('a request to create a new product')
        .withRequest({
          method: 'POST',
          path: '/products/add',
          headers: {
            'Content-Type': 'application/json',
          },
          body: newProduct,
        })
        .willRespondWith({
          status: 201,
          headers: {
            'Content-Type': regex(/application\/json.*/, 'application/json'),
          },
          body: {
            // The response should include the generated id plus all input fields
            id: integer(195), // Server assigns the next available ID
            title: like(newProduct.title),
            description: like(newProduct.description),
            price: decimal(newProduct.price),
            stock: integer(newProduct.stock),
            category: like(newProduct.category),
            brand: like(newProduct.brand),
          },
        })
        .executeTest(async (mockServer) => {
          const productsClient = new ProductsClient({
            baseUrl: mockServer.url,
          });

          const createdProduct = await productsClient.createProduct(newProduct);

          expect(createdProduct).toBeDefined();
          expect(createdProduct.id).toBeDefined();
          expect(createdProduct.id).toBeGreaterThan(0);
          expect(createdProduct.title).toBe(newProduct.title);
          expect(createdProduct.price).toBe(newProduct.price);
        });
    });
  });
});
