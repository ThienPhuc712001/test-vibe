import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch } from 'meilisearch';

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private readonly logger = new Logger(MeilisearchService.name);
  private client: MeiliSearch;
  private readonly host: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.host = this.configService.get<string>('MEILISEARCH_HOST') || 'http://localhost:7700';
    this.apiKey = this.configService.get<string>('MEILISEARCH_API_KEY') || '';
  }

  async onModuleInit() {
    try {
      this.client = new MeiliSearch({
        host: this.host,
        apiKey: this.apiKey,
      });

      // Test connection
      await this.client.health();
      this.logger.log(`Connected to Meilisearch at ${this.host}`);
    } catch (error) {
      this.logger.error(`Failed to connect to Meilisearch: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Create a new index
   */
  async createIndex(uid: string, options?: { primaryKey?: string; settings?: any }) {
    try {
      const index = await this.client.createIndex(uid, options);
      this.logger.log(`Created Meilisearch index: ${uid}`);
      return index;
    } catch (error) {
      this.logger.error(`Failed to create index ${uid}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get index
   */
  getIndex(uid: string) {
    try {
      return this.client.index(uid);
    } catch (error) {
      this.logger.error(`Failed to get index ${uid}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Delete an index
   */
  async deleteIndex(uid: string) {
    try {
      await this.client.deleteIndex(uid);
      this.logger.log(`Deleted Meilisearch index: ${uid}`);
    } catch (error) {
      this.logger.error(`Failed to delete index ${uid}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Add or update documents
   */
  async addDocuments(indexUid: string, documents: any[], primaryKey?: string) {
    try {
      const index = this.getIndex(indexUid);
      const result = await index.addDocuments(documents, { primaryKey });
      this.logger.log(`Added ${documents.length} documents to index ${indexUid}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to add documents to index ${indexUid}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Update documents
   */
  async updateDocuments(indexUid: string, documents: any[], primaryKey?: string) {
    try {
      const index = this.getIndex(indexUid);
      const result = await index.updateDocuments(documents, { primaryKey });
      this.logger.log(`Updated ${documents.length} documents in index ${indexUid}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update documents in index ${indexUid}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(indexUid: string, documentId: string) {
    try {
      const index = this.getIndex(indexUid);
      return await index.getDocument(documentId);
    } catch (error) {
      this.logger.error(`Failed to get document ${documentId} from index ${indexUid}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Delete document by ID
   */
  async deleteDocument(indexUid: string, documentId: string) {
    try {
      const index = this.getIndex(indexUid);
      await index.deleteDocument(documentId);
      this.logger.log(`Deleted document ${documentId} from index ${indexUid}`);
    } catch (error) {
      this.logger.error(`Failed to delete document ${documentId} from index ${indexUid}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Delete multiple documents
   */
  async deleteDocuments(indexUid: string, documentIds: string[]) {
    try {
      const index = this.getIndex(indexUid);
      await index.deleteDocuments(documentIds);
      this.logger.log(`Deleted ${documentIds.length} documents from index ${indexUid}`);
    } catch (error) {
      this.logger.error(`Failed to delete documents from index ${indexUid}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Search documents
   */
  async search(indexUid: string, query: string, options?: any) {
    try {
      const index = this.getIndex(indexUid);
      const result = await index.search(query, options);
      return result;
    } catch (error) {
      this.logger.error(`Failed to search in index ${indexUid}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Search across multiple indexes
   */
  async multiSearch(queries: any[]) {
    try {
      const result = await this.client.multiSearch(queries);
      return result;
    } catch (error) {
      this.logger.error(`Failed to perform multi-search: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(indexUid: string, query: string, options?: any) {
    try {
      const index = this.getIndex(indexUid);
      const result = await index.search(query, {
        limit: 5,
        attributesToHighlight: ['name', 'title', 'description'],
        ...options,
      });
      
      return result.hits.map((hit: any) => ({
        id: hit.id,
        suggestion: hit._formatted?.name || hit._formatted?.title || hit.name || hit.title,
        type: hit.type || 'product',
      }));
    } catch (error) {
      this.logger.error(`Failed to get suggestions from index ${indexUid}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async autocomplete(indexUid: string, query: string, options?: any) {
    try {
      const index = this.getIndex(indexUid);
      const result = await index.search(query, {
        limit: 10,
        attributesToSearchOn: ['name', 'title', 'description', 'tags'],
        attributesToHighlight: ['name', 'title'],
        ...options,
      });
      
      return result.hits.map((hit: any) => ({
        id: hit.id,
        text: hit._formatted?.name || hit._formatted?.title || hit.name || hit.title,
        type: hit.type || 'product',
        image: hit.image,
        price: hit.price,
      }));
    } catch (error) {
      this.logger.error(`Failed to get autocomplete from index ${indexUid}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Update index settings
   */
  async updateIndexSettings(indexUid: string, settings: any) {
    try {
      const index = this.getIndex(indexUid);
      const result = await index.updateSettings(settings);
      this.logger.log(`Updated settings for index ${indexUid}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update settings for index ${indexUid}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get index settings
   */
  async getIndexSettings(indexUid: string) {
    try {
      const index = this.getIndex(indexUid);
      return await index.getSettings();
    } catch (error) {
      this.logger.error(`Failed to get settings for index ${indexUid}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get index stats
   */
  async getIndexStats(indexUid: string) {
    try {
      const index = this.getIndex(indexUid);
      return await index.getStats();
    } catch (error) {
      this.logger.error(`Failed to get stats for index ${indexUid}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get all indexes
   */
  async getIndexes() {
    try {
      return await this.client.getIndexes();
    } catch (error) {
      this.logger.error(`Failed to get indexes: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get server stats
   */
  async getStats() {
    try {
      return await this.client.getStats();
    } catch (error) {
      this.logger.error(`Failed to get server stats: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get server health
   */
  async getHealth() {
    try {
      return await this.client.health();
    } catch (error) {
      this.logger.error(`Failed to get health: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get server version
   */
  async getVersion() {
    try {
      return await this.client.getVersion();
    } catch (error) {
      this.logger.error(`Failed to get version: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Create a task and wait for completion
   */
  async waitForTask(taskUid: number, timeoutMs?: number) {
    try {
      return await this.client.waitForTask(taskUid, timeoutMs);
    } catch (error) {
      this.logger.error(`Failed to wait for task ${taskUid}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get task
   */
  async getTask(taskUid: number) {
    try {
      return await this.client.getTask(taskUid);
    } catch (error) {
      this.logger.error(`Failed to get task ${taskUid}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get all tasks
   */
  async getTasks() {
    try {
      return await this.client.getTasks();
    } catch (error) {
      this.logger.error(`Failed to get tasks: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Index products from database
   */
  async indexProducts(products: any[]) {
    try {
      const formattedProducts = products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        discount: product.discount,
        rating: product.rating,
        reviewCount: product.reviewCount,
        salesCount: product.salesCount,
        categoryId: product.categoryId,
        brandId: product.brandId,
        shopId: product.shopId,
        tags: product.tags,
        images: product.images,
        status: product.status,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        type: 'product',
      }));

      return await this.addDocuments('products', formattedProducts, 'id');
    } catch (error) {
      this.logger.error(`Failed to index products: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Index shops from database
   */
  async indexShops(shops: any[]) {
    try {
      const formattedShops = shops.map(shop => ({
        id: shop.id,
        name: shop.name,
        description: shop.description,
        logo: shop.logo,
        banner: shop.banner,
        rating: shop.rating,
        reviewCount: shop.reviewCount,
        followerCount: shop.followerCount,
        productCount: shop.productCount,
        categoryId: shop.categoryId,
        tags: shop.tags,
        location: shop.location,
        status: shop.status,
        createdAt: shop.createdAt,
        updatedAt: shop.updatedAt,
        type: 'shop',
      }));

      return await this.addDocuments('shops', formattedShops, 'id');
    } catch (error) {
      this.logger.error(`Failed to index shops: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Index categories from database
   */
  async indexCategories(categories: any[]) {
    try {
      const formattedCategories = categories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        image: category.image,
        parentId: category.parentId,
        level: category.level,
        productCount: category.productCount,
        status: category.status,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        type: 'category',
      }));

      return await this.addDocuments('categories', formattedCategories, 'id');
    } catch (error) {
      this.logger.error(`Failed to index categories: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Index brands from database
   */
  async indexBrands(brands: any[]) {
    try {
      const formattedBrands = brands.map(brand => ({
        id: brand.id,
        name: brand.name,
        description: brand.description,
        logo: brand.logo,
        website: brand.website,
        productCount: brand.productCount,
        status: brand.status,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt,
        type: 'brand',
      }));

      return await this.addDocuments('brands', formattedBrands, 'id');
    } catch (error) {
      this.logger.error(`Failed to index brands: ${(error as Error).message}`);
      throw error;
    }
  }
}