# Shelly MCP Project Rules

## Project Overview

This is a Model Context Protocol (MCP) server for controlling Shelly smart home devices. The project uses TypeScript with Node.js and follows strict MCP protocol requirements.

## Technology Stack

- **Runtime**: Node.js v18+ with ESM modules
- **Language**: TypeScript 5.4.5 with strict mode
- **Package Manager**: npm (lock file committed)
- **Testing**: Vitest
- **Code Quality**: ESLint + Prettier

## Code Conventions

### TypeScript Patterns
- Use ESM imports with `.js` extensions: `import { foo } from './bar.js'`
- Enable all strict TypeScript options
- Prefer interfaces over types for object shapes
- Use Zod for runtime validation
- Export types from centralized `types/index.ts`

### File Organization
```
src/
  index.ts         # Entry point with shebang
  tools/
    index.ts       # Tool registration and handlers
  types/
    index.ts       # Centralized type definitions
  utils/
    *.ts           # Utility modules
```

### Naming Conventions
- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Zod schemas: `PascalCaseSchema`

### Error Handling
- Use custom `McpError` class with error codes
- Never expose sensitive data in errors
- Log errors to file, not console
- Return structured error responses

## MCP-Specific Rules

### No Console Output
- NEVER use `console.log()` or similar
- All logging must go through Winston to files
- Console output breaks MCP protocol

### Tool Implementation
- Register all tools in `tools/index.ts`
- Use Zod schemas for input validation
- Return text content in MCP format
- Handle errors gracefully with error codes

### Security
- API keys only via command-line arguments
- Never log sensitive information
- Mask secrets in safe logging methods
- Use HTTPS for all external calls

## Development Workflow

### Building
```bash
npm run build    # Compile TypeScript
npm run dev      # Development mode with tsx
```

### Code Quality
```bash
npm run lint     # ESLint check
npm run format   # Prettier format
npm test         # Run Vitest tests
```

### Testing
- Mock external API calls
- Test error scenarios
- Validate schema parsing
- Check rate limiting logic

## API Integration

### Shelly Cloud API
- Base URLs: EU and US regions
- Authentication: API key in form data
- Rate limit: 1 request/second
- Response format: Nested JSON

### Request Pattern
```typescript
await this.axios.post('/endpoint',
  `param1=${encodeURIComponent(value1)}&auth_key=${encodeURIComponent(apiKey)}`
);
```

## Project-Specific Patterns

### Device Status Parsing
- Check multiple component locations (light:0, switch:0, etc.)
- Handle missing fields gracefully
- Aggregate data from various sources

### Caching Strategy
- 60-second TTL for device lists
- Memory-based Map storage
- Manual cache invalidation option

### Rate Limiting
- Track last request timestamp
- Calculate wait time if needed
- Use setTimeout for delays

## Available MCP Servers

The project has the following MCP servers configured:

1. **context7** (`@upstash/context7-mcp`)
   - Purpose: Context management and retrieval
   - Use this for managing and accessing project context information

## Important Reminders

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary
- ALWAYS prefer editing existing files to creating new ones
- NEVER proactively create documentation files unless explicitly requested
- Follow existing patterns in the codebase
- Respect MCP protocol requirements (no console output)
