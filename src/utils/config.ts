import { z } from 'zod';
import { logger } from './logger.js';

// Default Shelly Cloud server URIs by region
const DEFAULT_SERVER_URIS = {
  eu: 'https://shelly-10-eu.shelly.cloud',
  us: 'https://shelly-10-us.shelly.cloud',
};

export const ConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  serverUri: z.string().url().optional(),
  region: z.enum(['eu', 'us']).default('eu'),
  rateLimitMs: z.number().min(1000).default(1000), // 1 request per second
});

export type Config = z.infer<typeof ConfigSchema>;

export class ConfigManager {
  private config: Config;
  private lastRequestTime: number = 0;

  constructor(initialConfig: Partial<Config>) {
    try {
      // If no server URI provided, use default based on region
      if (!initialConfig.serverUri) {
        const region = initialConfig.region || 'eu';
        initialConfig.serverUri = DEFAULT_SERVER_URIS[region];
      }

      this.config = ConfigSchema.parse(initialConfig);
      logger.info('Configuration loaded successfully', {
        serverUri: this.config.serverUri,
        region: this.config.region,
      });
    } catch (error) {
      logger.error('Invalid configuration:', error);
      throw new Error(`Configuration validation failed: ${error}`);
    }
  }

  get apiKey(): string {
    return this.config.apiKey;
  }

  get serverUri(): string {
    return this.config.serverUri!;
  }

  get rateLimitMs(): number {
    return this.config.rateLimitMs;
  }

  // Rate limiting helper
  async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.config.rateLimitMs) {
      const waitTime = this.config.rateLimitMs - timeSinceLastRequest;
      logger.debug(`Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  // Mask sensitive data for logging
  getSafeConfig(): Partial<Config> {
    return {
      serverUri: this.config.serverUri,
      region: this.config.region,
      rateLimitMs: this.config.rateLimitMs,
      apiKey: this.config.apiKey.substring(0, 4) + '...',
    };
  }
}