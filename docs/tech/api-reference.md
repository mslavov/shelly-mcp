# API Reference

## Overview

The Shelly MCP server exposes five main tools through the Model Context Protocol. Each tool is designed to interact with Shelly smart home devices via the Shelly Cloud API.

## Authentication

All API calls require authentication using your Shelly Cloud API key, provided as a command-line argument when starting the server:

```bash
shelly-mcp --api-key YOUR_API_KEY [--server-uri SERVER_URI]
```

## Tools

### `list_devices`

Lists all Shelly devices connected to your account.

#### Input Schema

```typescript
{
  refresh?: boolean  // Force refresh device list (bypass cache)
}
```

#### Response

Returns a formatted list of devices with:
- Device name and ID
- Device type (switch, light, dimmer, sensor, etc.)
- Model information
- Online/offline status

#### Example Response

```
Found 3 device(s):

" SPDM-002CE3A8 (7c87ce65a8d8)
  Type: dimmer
  Model: SPDM-002CE3A8
  Status: =â Online

" SPSW-202XE1 (3494546bbf7e)
  Type: switch
  Model: SPSW-202XE1
  Status: =4 Offline
```

#### Error Codes
- `AUTH_FAILED`: Invalid API key
- `NETWORK_ERROR`: Connection issues
- `RATE_LIMIT`: Too many requests

---

### `control_light`

Control a Shelly light device (turn on/off, set brightness).

#### Input Schema

```typescript
{
  deviceId: string      // The device ID to control
  turn: "on" | "off"    // Turn the light on or off
  brightness?: number   // Brightness level (0-100), optional
  channel?: number      // Channel number (default: 0), optional
}
```

#### Response

Confirmation message indicating success:
- "Successfully turned on light 'Device Name'"
- "Successfully turned on light 'Device Name' with brightness set to 50%"

#### Example Usage

```json
{
  "deviceId": "7c87ce65a8d8",
  "turn": "on",
  "brightness": 75,
  "channel": 0
}
```

#### Error Codes
- `DEVICE_NOT_FOUND`: Invalid device ID
- `DEVICE_OFFLINE`: Device is not reachable
- `INVALID_INPUT`: Invalid parameters

---

### `control_switch`

Control a Shelly switch/relay device (turn on/off).

#### Input Schema

```typescript
{
  deviceId: string      // The device ID to control
  turn: "on" | "off"    // Turn the switch on or off
  channel?: number      // Channel number (default: 0), optional
}
```

#### Response

Confirmation message:
- "Successfully turned on switch 'Device Name' (channel 0)"

#### Example Usage

```json
{
  "deviceId": "3494546bbf7e",
  "turn": "off",
  "channel": 1
}
```

#### Error Codes
- `DEVICE_NOT_FOUND`: Invalid device ID
- `DEVICE_OFFLINE`: Device is not reachable
- `INVALID_INPUT`: Invalid parameters

---

### `get_temperature`

Get temperature reading from a Shelly device with temperature sensor.

#### Input Schema

```typescript
{
  deviceId: string                              // The device ID to get temperature from
  unit?: "celsius" | "fahrenheit" | "both"     // Temperature unit (default: "celsius")
}
```

#### Response

Temperature reading in requested format:
- Celsius: "Temperature at 'Device Name': 22.3°C"
- Fahrenheit: "Temperature at 'Device Name': 72.1°F"
- Both: "Temperature at 'Device Name': 22.3°C (72.1°F)"

#### Example Usage

```json
{
  "deviceId": "7c87ce65a8d8",
  "unit": "both"
}
```

#### Error Codes
- `DEVICE_NOT_FOUND`: Invalid device ID
- `DEVICE_OFFLINE`: Device is not reachable
- `INTERNAL_ERROR`: Device has no temperature sensor

---

### `get_device_status`

Get comprehensive status information for a Shelly device.

#### Input Schema

```typescript
{
  deviceId: string      // The device ID to get status for
}
```

#### Response

Detailed status report including:

##### Basic Information
- Device name and ID
- Model and type
- Online/offline status

##### Network Information
- WiFi SSID and signal strength
- IP address
- Ethernet connection (if applicable)

##### System Information
- Uptime
- RAM usage
- Available firmware updates

##### Component Status
Depending on device type:

**Lights**
- On/off state per channel
- Brightness levels
- Power consumption
- Temperature readings

**Switches/Relays**
- On/off state per channel
- Power consumption (Watts)
- Voltage and current readings
- Temperature readings

**Energy Meters**
- Total power consumption
- Per-phase measurements (3-phase meters)
- Voltage readings

**Sensors**
- Temperature readings
- Humidity readings (if available)
- Battery status (battery-powered devices)

#### Example Response

```
Status for 'SPDM-002CE3A8' (dimmer):
" Device ID: 7c87ce65a8d8
" Model: SPDM-002CE3A8
" Online: 

Network:
" WiFi SSID: HomeNetwork
" IP Address: 192.168.1.100
" Signal Strength: -45 dBm

System:
" Uptime: 5d 12h
" RAM Usage: 42.3%

Lights:
" Channel 0: =¡ ON (75% brightness) - 12.5W - 24.3°C
```

#### Error Codes
- `DEVICE_NOT_FOUND`: Invalid device ID
- `NETWORK_ERROR`: Unable to reach device

## Rate Limiting

The Shelly Cloud API enforces a rate limit of 1 request per second. The MCP server automatically handles rate limiting by:
- Queuing requests when rate limit is approached
- Adding appropriate delays between requests
- Caching device lists for 60 seconds

## Error Handling

All tools return structured error responses with:
- Error code (see Error Codes section)
- Human-readable error message
- Additional details when available

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `INVALID_INPUT` | Invalid parameters provided | Check parameter types and values |
| `DEVICE_NOT_FOUND` | Device ID not found | Use `list_devices` to get valid IDs |
| `DEVICE_OFFLINE` | Device is not reachable | Check device power and network |
| `AUTH_FAILED` | Authentication failed | Verify API key is correct |
| `RATE_LIMIT` | Too many requests | Wait before retrying |
| `NETWORK_ERROR` | Network connectivity issue | Check internet connection |
| `INTERNAL_ERROR` | Unexpected error | Check logs for details |

## Caching

- **Device List**: Cached for 60 seconds to reduce API calls
- **Cache Bypass**: Use `refresh: true` in `list_devices` to force update
- **Per-Instance**: Each server instance maintains its own cache

## Logging

All API interactions are logged to `~/.shelly-mcp/logs/`:
- Request details (method, endpoint, masked auth)
- Response status and data
- Error details with stack traces
- Performance metrics

## Best Practices

1. **Device Discovery**: Always use `list_devices` first to get valid device IDs
2. **Error Handling**: Check device online status before control operations
3. **Rate Limiting**: Batch operations when possible, respect 1 req/sec limit
4. **Monitoring**: Use `get_device_status` for detailed diagnostics
5. **Security**: Never log or share your API key