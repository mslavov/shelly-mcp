# Shelly MCP Server

A Model Context Protocol (MCP) server that enables AI assistants like Claude to control Shelly smart home devices through natural language commands.

## Features

- 🏠 **Device Management**: List and monitor all your Shelly devices
- 💡 **Light Control**: Turn lights on/off and adjust brightness
- 🔌 **Switch Control**: Control relays and switches
- 🌡️ **Temperature Monitoring**: Read temperature from compatible sensors
- 📊 **Status Monitoring**: Get comprehensive device status including power consumption
- 📝 **Detailed Logging**: File-based logging to `~/.shelly-mcp/logs/`

## Prerequisites

- Node.js v18 or higher
- A Shelly Cloud account with API access
- One or more Shelly devices configured in your account

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shelly-mcp.git
cd shelly-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Getting Your Shelly API Key

1. Open the Shelly Cloud app on your mobile device
2. Go to **User Settings** → **Authorization Cloud Key**
3. Generate or copy your existing authorization key
4. Keep this key secure - anyone with this key can control your devices

## Usage

### Running the Server

The server requires your Shelly Cloud API key to be provided as a command-line argument:

```bash
shelly-mcp --api-key YOUR_API_KEY
```

Optional parameters:
- `--server-uri` or `-s`: Specify a custom Shelly Cloud server URI (defaults to EU region)

Example:
```bash
shelly-mcp --api-key YOUR_API_KEY --server-uri https://shelly-10-us.shelly.cloud
```

### Configuring with Claude Desktop

1. Open Claude Desktop settings
2. Navigate to the MCP servers configuration
3. Add the following configuration:

```json
{
  "shelly-mcp": {
    "command": "/path/to/shelly-mcp",
    "args": ["--api-key", "YOUR_API_KEY"]
  }
}
```

## Available Tools

### `list_devices`
Lists all Shelly devices connected to your account.

**Parameters:**
- `refresh` (optional): Force refresh device list, bypassing cache

**Example:** "Show me all my Shelly devices"

### `control_light`
Control Shelly light devices.

**Parameters:**
- `deviceId`: The device ID to control
- `turn`: "on" or "off"
- `brightness` (optional): Brightness level 0-100%
- `channel` (optional): Channel number (default: 0)

**Example:** "Turn on the bedroom light at 50% brightness"

### `control_switch`
Control Shelly relay/switch devices.

**Parameters:**
- `deviceId`: The device ID to control
- `turn`: "on" or "off"
- `channel` (optional): Channel number (default: 0)

**Example:** "Turn off the living room switch"

### `get_temperature`
Get temperature reading from devices with temperature sensors.

**Parameters:**
- `deviceId`: The device ID to read from
- `unit`: "celsius", "fahrenheit", or "both" (default: "celsius")

**Example:** "What's the temperature in the kitchen?"

### `get_device_status`
Get comprehensive status information for a device.

**Parameters:**
- `deviceId`: The device ID to check

**Example:** "Show me the status of device abc123"

## Development

### Running in Development Mode

```bash
npm run dev
```

### Testing with MCP Inspector

```bash
npm run inspector
```

### Running Tests

```bash
npm test
```

### Code Formatting

```bash
npm run format
npm run lint
```

## Logging

Logs are stored in `~/.shelly-mcp/logs/` with daily rotation:
- `shelly-mcp-YYYY-MM-DD.log`: General logs
- `error.log`: Error logs only

Log files are automatically compressed after rotation and kept for 14 days.

## Troubleshooting

### Authentication Failed
- Verify your API key is correct
- Check if your Shelly Cloud account is active
- Ensure you're using the correct server region (EU/US)

### Device Not Found
- Run `list_devices` to see available devices
- Ensure the device is added to your Shelly Cloud account
- Check if the device is online

### Rate Limiting
The Shelly API has a rate limit of 1 request per second. The server automatically handles this, but rapid consecutive commands may be delayed.

### Device Offline
Offline devices cannot be controlled. Check:
- Device power supply
- Network connectivity
- Shelly Cloud app for device status

## Security Considerations

- **Never share your API key** - it provides full control over your devices
- API keys are not logged by the server
- Use environment variables or secure credential management in production
- Consider network security when exposing the MCP server

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- Integrates with [Shelly Cloud API](https://shelly-api-docs.shelly.cloud/)

## Support

For issues and feature requests, please use the GitHub issue tracker.

For Shelly device support, refer to the [official Shelly support](https://www.shelly.cloud/support/)