import { Logger } from './logger';
import { supabase } from './supabase';

const logger = new Logger({ module: 'bulk-import-service' });

export interface CsvRow {
  productUrl: string;
  productName?: string;
  category?: string;
  tags?: string[];
  customData?: Record<string, any>;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  productUrl: string;
  images: string[];
  variants: Array<{
    id: string;
    title: string;
    price: string;
    sku?: string;
  }>;
  tags?: string[];
  productType?: string;
}

export interface BulkImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  failureCount: number;
  projectIds: string[];
  errors: Array<{ row: number; error: string }>;
  warnings: string[];
}

export class BulkImportService {
  async importFromCsv(
    csvContent: string,
    userId: string,
    options?: { skipHeader?: boolean; delimiter?: string }
  ): Promise<BulkImportResult> {
    logger.info('Starting CSV import', {
      userId,
      contentLength: csvContent.length,
    });

    const delimiter = options?.delimiter || ',';
    const skipHeader = options?.skipHeader ?? true;

    const rows = this.parseCsv(csvContent, delimiter, skipHeader);

    logger.info('CSV parsed', {
      rowCount: rows.length,
    });

    const result: BulkImportResult = {
      success: true,
      totalRows: rows.length,
      successCount: 0,
      failureCount: 0,
      projectIds: [],
      errors: [],
      warnings: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        if (!row.productUrl || row.productUrl.trim() === '') {
          result.errors.push({
            row: i + 1,
            error: 'Missing product URL',
          });
          result.failureCount++;
          continue;
        }

        const projectId = await this.createProjectFromUrl(userId, row);

        result.projectIds.push(projectId);
        result.successCount++;

        logger.info('Project created from CSV row', {
          row: i + 1,
          projectId,
          productUrl: row.productUrl,
        });
      } catch (error) {
        logger.error('Failed to create project from CSV row', {
          row: i + 1,
          error,
        });

        result.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : String(error),
        });
        result.failureCount++;
      }
    }

    result.success = result.failureCount === 0;

    logger.info('CSV import complete', {
      userId,
      totalRows: result.totalRows,
      successCount: result.successCount,
      failureCount: result.failureCount,
    });

    return result;
  }

  async importFromShopify(
    shopifyStoreUrl: string,
    accessToken: string,
    userId: string,
    options?: { productIds?: string[]; limit?: number }
  ): Promise<BulkImportResult> {
    logger.info('Starting Shopify import', {
      userId,
      shopifyStoreUrl,
      limit: options?.limit,
    });

    const result: BulkImportResult = {
      success: true,
      totalRows: 0,
      successCount: 0,
      failureCount: 0,
      projectIds: [],
      errors: [],
      warnings: [],
    };

    try {
      const products = await this.fetchShopifyProducts(
        shopifyStoreUrl,
        accessToken,
        options
      );

      result.totalRows = products.length;

      logger.info('Shopify products fetched', {
        productCount: products.length,
      });

      for (let i = 0; i < products.length; i++) {
        const product = products[i];

        try {
          const projectId = await this.createProjectFromShopify(userId, product);

          result.projectIds.push(projectId);
          result.successCount++;

          logger.info('Project created from Shopify product', {
            productIndex: i + 1,
            projectId,
            productTitle: product.title,
          });
        } catch (error) {
          logger.error('Failed to create project from Shopify product', {
            productIndex: i + 1,
            productTitle: product.title,
            error,
          });

          result.errors.push({
            row: i + 1,
            error: error instanceof Error ? error.message : String(error),
          });
          result.failureCount++;
        }
      }

      result.success = result.failureCount === 0;
    } catch (error) {
      logger.error('Shopify import failed', {
        userId,
        shopifyStoreUrl,
        error,
      });

      result.success = false;
      result.errors.push({
        row: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    logger.info('Shopify import complete', {
      userId,
      totalRows: result.totalRows,
      successCount: result.successCount,
      failureCount: result.failureCount,
    });

    return result;
  }

  private parseCsv(
    csvContent: string,
    delimiter: string,
    skipHeader: boolean
  ): CsvRow[] {
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');

    const startIndex = skipHeader ? 1 : 0;
    const dataLines = lines.slice(startIndex);

    return dataLines.map(line => {
      const columns = this.parseCsvLine(line, delimiter);

      return {
        productUrl: columns[0] || '',
        productName: columns[1] || undefined,
        category: columns[2] || undefined,
        tags: columns[3] ? columns[3].split(';').map(t => t.trim()) : undefined,
        customData: columns[4] ? this.tryParseJson(columns[4]) : undefined,
      };
    });
  }

  private parseCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());

    return result;
  }

  private tryParseJson(value: string): Record<string, any> | undefined {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  private async fetchShopifyProducts(
    storeUrl: string,
    accessToken: string,
    options?: { productIds?: string[]; limit?: number }
  ): Promise<ShopifyProduct[]> {
    const apiVersion = '2024-01';
    const baseUrl = `https://${storeUrl}/admin/api/${apiVersion}`;

    let endpoint = `${baseUrl}/products.json`;
    const params = new URLSearchParams();

    if (options?.limit) {
      params.append('limit', String(Math.min(options.limit, 250)));
    }

    if (options?.productIds && options.productIds.length > 0) {
      params.append('ids', options.productIds.join(','));
    }

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    logger.info('Fetching Shopify products', { endpoint });

    const response = await fetch(endpoint, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return data.products.map((p: any) => ({
      id: String(p.id),
      title: p.title,
      handle: p.handle,
      productUrl: `https://${storeUrl}/products/${p.handle}`,
      images: p.images?.map((img: any) => img.src) || [],
      variants: p.variants?.map((v: any) => ({
        id: String(v.id),
        title: v.title,
        price: v.price,
        sku: v.sku,
      })) || [],
      tags: p.tags?.split(',').map((t: string) => t.trim()) || [],
      productType: p.product_type,
    }));
  }

  private async createProjectFromUrl(
    userId: string,
    row: CsvRow
  ): Promise<string> {
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        source_url: row.productUrl,
        source_type: 'shopify',
        status: 'pending',
        metadata: {
          productName: row.productName,
          category: row.category,
          tags: row.tags,
          ...row.customData,
          importedFrom: 'csv',
          importedAt: new Date().toISOString(),
        },
      })
      .select('id')
      .single();

    if (error || !project) {
      throw new Error(`Failed to create project: ${error?.message || 'Unknown error'}`);
    }

    return project.id;
  }

  private async createProjectFromShopify(
    userId: string,
    product: ShopifyProduct
  ): Promise<string> {
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        source_url: product.productUrl,
        source_type: 'shopify',
        status: 'pending',
        metadata: {
          shopifyProductId: product.id,
          productName: product.title,
          productHandle: product.handle,
          productType: product.productType,
          tags: product.tags,
          variantCount: product.variants.length,
          imageCount: product.images.length,
          importedFrom: 'shopify_api',
          importedAt: new Date().toISOString(),
        },
      })
      .select('id')
      .single();

    if (error || !project) {
      throw new Error(`Failed to create project: ${error?.message || 'Unknown error'}`);
    }

    return project.id;
  }

  async getBulkImportStatus(projectIds: string[]): Promise<Array<{
    projectId: string;
    status: string;
    progress: number;
  }>> {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, status, metadata')
      .in('id', projectIds);

    if (error) {
      logger.error('Failed to fetch bulk import status', { error });
      return [];
    }

    return (projects || []).map(project => ({
      projectId: project.id,
      status: project.status,
      progress: this.calculateProgress(project.status),
    }));
  }

  private calculateProgress(status: string): number {
    const progressMap: Record<string, number> = {
      pending: 0,
      ingesting: 25,
      planning: 50,
      previewing: 75,
      done: 100,
      error: 0,
    };

    return progressMap[status] || 0;
  }
}

export const bulkImportService = new BulkImportService();
