# Shelly MCP Documentation Hub

Welcome to the Shelly MCP documentation! This index provides navigation to all project documentation.

## Quick Links

- [System Overview](./system-overview.md) - Architecture and technical stack
- [API Reference](./tech/api-reference.md) - Complete tool documentation
- [README](../README.md) - Quick start guide
- [CHANGELOG](../CHANGELOG.md) - Version history

## Documentation Structure

### 📋 Overview Documentation
- **[System Overview](./system-overview.md)**
  - Project architecture
  - Technology stack  
  - Component descriptions
  - Development workflow

### 🔧 Technical Documentation
- **[API Reference](./tech/api-reference.md)**
  - Tool specifications
  - Input/output schemas
  - Error codes
  - Best practices

### 📝 Development Guides
- **Setup & Configuration**
  - Getting Shelly API key
  - MCP server configuration
  - Claude Desktop integration

- **Usage Examples**
  - Basic device control
  - Status monitoring
  - Error handling patterns

### 🏗️ Architecture Details
- **Component Design**
  - MCP server implementation
  - Tool handler patterns
  - Shelly client architecture
  - Configuration management

- **Integration Points**
  - MCP protocol details
  - Shelly Cloud API
  - Logging system
  - Error handling

## Key Features

### 🏠 Smart Home Control
- List all Shelly devices
- Control lights with dimming
- Switch relays on/off
- Monitor temperatures
- Get detailed device status

### 🔒 Security
- Secure API key handling
- HTTPS communication
- Input validation
- Error sanitization

### 📊 Monitoring
- File-based logging
- Daily log rotation  
- Detailed error tracking
- Performance metrics

### ⚡ Performance
- Request rate limiting
- Device list caching
- Async operations
- Minimal resource usage

## Getting Started

1. **Installation**: See [README](../README.md#installation)
2. **Get API Key**: See [README](../README.md#getting-your-shelly-api-key)
3. **Configure MCP**: See [README](../README.md#configuring-with-claude-desktop)
4. **Use Tools**: See [API Reference](./tech/api-reference.md)

## Tool Overview

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `list_devices` | Show all devices | `refresh` |
| `control_light` | Control lights | `deviceId`, `turn`, `brightness` |
| `control_switch` | Control switches | `deviceId`, `turn`, `channel` |
| `get_temperature` | Read temperatures | `deviceId`, `unit` |
| `get_device_status` | Get full status | `deviceId` |

## Common Tasks

### Control a Light
```
1. List devices to get ID
2. Use control_light with deviceId
3. Set turn="on" and brightness=50
```

### Monitor Temperature
```
1. Find device with sensor
2. Use get_temperature with deviceId  
3. Choose unit: celsius/fahrenheit/both
```

### Check Device Health
```
1. Use get_device_status with deviceId
2. Review network, system, and component info
3. Check for firmware updates
```

## Troubleshooting

- **Authentication Issues**: Verify API key
- **Device Offline**: Check power and network
- **Rate Limits**: Wait 1 second between requests
- **Not Found**: Use list_devices for valid IDs

## Support

- **Issues**: Use GitHub issue tracker
- **Logs**: Check `~/.shelly-mcp/logs/`
- **Shelly Support**: [Official Shelly support](https://www.shelly.cloud/support/)

---

*This documentation is for Shelly MCP v0.1.0*