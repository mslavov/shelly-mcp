#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from './utils/logger.js';
import { ConfigManager } from './utils/config.js';
import { registerTools } from './tools/index.js';

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const apiKeyIndex = args.findIndex(arg => arg === '--api-key' || arg === '-k');
    
    if (apiKeyIndex === -1 || !args[apiKeyIndex + 1]) {
      // For MCP servers, we should not output to console
      // Log the error to file and exit
      logger.error('Error: API key is required');
      logger.error('Usage: shelly-mcp --api-key YOUR_API_KEY [--server-uri YOUR_SERVER_URI]');
      process.exit(1);
    }

    const apiKey = args[apiKeyIndex + 1];
    
    // Optional server URI
    const serverUriIndex = args.findIndex(arg => arg === '--server-uri' || arg === '-s');
    const serverUri = serverUriIndex !== -1 ? args[serverUriIndex + 1] : undefined;

    // Initialize configuration
    const config = new ConfigManager({
      apiKey,
      serverUri,
    });

    // Initialize logger
    logger.info('Starting Shelly MCP server...');

    // Create MCP server
    const server = new Server({
      name: 'shelly-mcp',
      version: '0.1.0',
    }, {
      capabilities: {
        tools: {},
      },
    });

    // Register all tools
    await registerTools(server, config);

    // Set up error handling
    server.onerror = (error: Error) => {
      logger.error('MCP server error:', error);
    };

    process.on('SIGINT', () => {
      logger.info('Shutting down Shelly MCP server...');
      process.exit(0);
    });

    // Create transport and connect
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    logger.info('Shelly MCP server started successfully');
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Run the server
main().catch((error) => {
  // Log fatal errors to file, not console (MCP requirement)
  logger.error('Fatal error:', error);
  process.exit(1);
});