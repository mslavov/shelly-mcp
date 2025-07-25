# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Actions workflows for Claude Code Review and Claude PR Assistant

### Changed
- Updates to existing functionality

### Deprecated
- Features marked for removal

### Removed
- Features removed in this release

### Fixed
- Bug fixes

### Security
- Security vulnerability fixes

---

## [0.1.0] - 2025-07-25

### Added
- Initial release of Shelly MCP Server
- Model Context Protocol (MCP) server implementation for controlling Shelly smart home devices
- Support for Shelly Cloud API integration with EU and US regions
- Tool: `list_devices` - List all connected Shelly devices with online/offline status
- Tool: `control_light` - Control lights with on/off and brightness settings
- Tool: `control_switch` - Control relay/switch devices
- Tool: `get_temperature` - Read temperature from compatible sensors
- Tool: `get_device_status` - Get comprehensive device status including:
  - Network information (WiFi/Ethernet)
  - System uptime and RAM usage
  - Power consumption monitoring
  - Multi-channel component status
  - Battery level for battery-powered devices
  - Humidity readings where available
- Winston-based file logging to `~/.shelly-mcp/logs/`
- Rate limiting to respect Shelly API constraints (1 req/sec)
- Device list caching with 60-second TTL
- TypeScript with strict mode and ESM modules
- Comprehensive error handling with custom error codes
- Input validation using Zod schemas
- Full test suite with Vitest
- ESLint and Prettier configuration for code quality
- Detailed documentation including setup guides and API reference

### Security
- API key provided only via command-line arguments (never stored in files)
- Sensitive information masked in logs
- All external API calls use HTTPS

---

<!-- 
Template for new versions:

## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Vulnerability fixes
-->