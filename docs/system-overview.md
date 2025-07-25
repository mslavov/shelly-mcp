# System Overview

## Project Summary

Shelly MCP is a Model Context Protocol (MCP) server that enables AI assistants like Claude to control Shelly smart home devices through natural language commands. It provides a secure bridge between AI language models and the Shelly Cloud API, allowing for intelligent home automation through conversational interfaces.

## Technology Stack

- **Runtime**: Node.js v18+ (ESM modules)
- **Language**: TypeScript 5.4.5
- **Protocol**: Model Context Protocol (MCP) SDK v0.6.0
- **API Client**: Axios 1.7.2 for HTTP requests
- **Validation**: Zod 3.23.8 for schema validation
- **Logging**: Winston 3.13.0 with daily rotation
- **Testing**: Vitest 1.6.0
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

## Architecture

### Component Architecture

```
┌─────────────────────┐
│   Claude Desktop    │
│  (or other MCP      │
│     clients)        │
└──────────┬──────────┘
           │ MCP Protocol (stdio)
           │
┌──────────▼──────────┐
│   MCP Server        │
│   (index.ts)        │
│  - Request Handler  │
│  - Tool Registry    │
└──────────┬──────────┘
           │
┌──────────▼──────────┐     ┌─────────────────┐
│   Tool Handlers     │     │  Configuration  │
│   (tools/index.ts)  │────▶│  (ConfigManager)│
│  - list_devices     │     │  - API Key      │
│  - control_light    │     │  - Server URI   │
│  - control_switch   │     │  - Rate Limit   │
│  - get_temperature  │     └─────────────────┘
│  - get_device_status│
└──────────┬──────────┘
           │
┌──────────▼──────────┐     ┌─────────────────┐
│   Shelly Client     │     │     Logger      │
│ (shelly-client.ts)  │────▶│  (logger.ts)    │
│  - HTTP requests    │     │  - File-based   │
│  - Rate limiting    │     │  - Rotation     │
│  - Response parsing │     │  - No console   │
└──────────┬──────────┘     └─────────────────┘
           │
           │ HTTPS
           │
┌──────────▼──────────┐
│  Shelly Cloud API   │
│  - EU/US regions    │
│  - Device control   │
│  - Status queries   │
└─────────────────────┘
```

### Data Flow

1. **Incoming Request**: MCP client sends tool invocation request via stdio
2. **Tool Dispatch**: Server routes request to appropriate tool handler
3. **Validation**: Zod schemas validate input parameters
4. **API Call**: Shelly client makes authenticated HTTPS request
5. **Rate Limiting**: Automatic throttling to respect API limits (1 req/sec)
6. **Response Processing**: Parse and format Shelly API response
7. **Error Handling**: Structured error responses with specific error codes
8. **Result Return**: Formatted text response back to MCP client

### Security Architecture

- **API Key Management**: Command-line argument only, never logged
- **Transport Security**: All API calls use HTTPS
- **Input Validation**: Strict schema validation on all inputs
- **Error Sanitization**: Sensitive data removed from error messages
- **File-based Logging**: No console output to prevent MCP protocol interference

## Core Components

### MCP Server (`src/index.ts`)
- Entry point and server initialization
- Command-line argument parsing
- MCP transport setup (stdio)
- Global error handling

### Tool Registry (`src/tools/index.ts`)
- Tool definition and registration
- Request routing and dispatch
- Response formatting
- Error wrapping and logging

### Shelly Client (`src/utils/shelly-client.ts`)
- HTTP client with Axios interceptors
- Device caching (1-minute TTL)
- Rate limiting enforcement
- Response parsing and validation
- Multi-component status aggregation

### Configuration Manager (`src/utils/config.ts`)
- API key and server URI management
- Regional server selection (EU/US)
- Rate limit configuration
- Safe config logging (masked secrets)

### Logger (`src/utils/logger.ts`)
- Winston-based file logging
- Daily log rotation (14-day retention)
- Separate error log file
- No console output (MCP requirement)

### Type Definitions (`src/types/index.ts`)
- Zod schemas for tool inputs
- TypeScript interfaces for responses
- Custom error types with error codes
- Shared type exports

## Development Workflow

### Build Process
- TypeScript compilation to ES modules
- Source maps for debugging
- Declaration files generation
- Executable permission setting

### Testing Strategy
- Unit tests with Vitest
- Integration tests for API calls
- Mock Shelly API responses
- Error scenario coverage

### Code Quality
- TypeScript strict mode enabled
- ESLint for code standards
- Prettier for formatting
- No unused variables/parameters
- Consistent error handling

### Deployment
- Single executable via npm bin
- Command-line interface
- File-based configuration
- Cross-platform compatibility

## Integration Points

### MCP Protocol
- Standard stdio transport
- JSON-RPC message format
- Tool capability declaration
- Structured error responses

### Shelly Cloud API
- RESTful HTTP endpoints
- Form-encoded parameters
- Device status polling
- Control command execution

### File System
- Log directory creation
- Daily log rotation
- Compressed archives
- Home directory storage (~/.shelly-mcp/)

## Performance Characteristics

### Caching Strategy
- Device list cached for 60 seconds
- Cache invalidation on explicit refresh
- Memory-based cache storage
- Per-instance cache isolation

### Rate Limiting
- 1 request per second (API limit)
- Automatic request queuing
- Millisecond precision timing
- Per-client rate tracking

### Resource Usage
- Minimal memory footprint
- Async/await for I/O operations
- Stream-based stdio transport
- Efficient log rotation

## Error Handling

### Error Categories
- `INVALID_INPUT`: Schema validation failures
- `DEVICE_NOT_FOUND`: Unknown device IDs
- `DEVICE_OFFLINE`: Unreachable devices
- `AUTH_FAILED`: API key issues
- `RATE_LIMIT`: Too many requests
- `NETWORK_ERROR`: Connection failures
- `INTERNAL_ERROR`: Unexpected conditions

### Error Recovery
- Automatic retry on rate limits
- Graceful degradation for offline devices
- Detailed error messages for debugging
- Structured error codes for handling