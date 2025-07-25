import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  ListToolsRequestSchema, 
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ConfigManager } from '../utils/config.js';
import { ShellyClient } from '../utils/shelly-client.js';
import { logger } from '../utils/logger.js';
import { 
  ListDevicesInputSchema,
  ControlLightInputSchema,
  ControlSwitchInputSchema,
  GetTemperatureInputSchema,
  GetDeviceStatusInputSchema,
  McpError,
  ErrorCode
} from '../types/index.js';

// Tool definitions
const TOOLS = [
  {
    name: 'list_devices',
    description: 'List all Shelly devices connected to your account',
    inputSchema: ListDevicesInputSchema,
  },
  {
    name: 'control_light',
    description: 'Control a Shelly light device (turn on/off, set brightness)',
    inputSchema: ControlLightInputSchema,
  },
  {
    name: 'control_switch',
    description: 'Control a Shelly switch/relay device (turn on/off)',
    inputSchema: ControlSwitchInputSchema,
  },
  {
    name: 'get_temperature',
    description: 'Get temperature reading from a Shelly device with temperature sensor',
    inputSchema: GetTemperatureInputSchema,
  },
  {
    name: 'get_device_status',
    description: 'Get comprehensive status information for a Shelly device',
    inputSchema: GetDeviceStatusInputSchema,
  },
];

export async function registerTools(server: Server, config: ConfigManager): Promise<void> {
  logger.info('Registering Shelly MCP tools...');
  
  // Create Shelly client instance
  const shellyClient = new ShellyClient(config);
  
  // Register the list tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOLS.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: zodToJsonSchema(tool.inputSchema),
      })),
    };
  });

  // Register the call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    logger.info(`Executing tool: ${name}`, { args });
    
    try {
      let result: string;
      
      switch (name) {
        case 'list_devices': {
          const { refresh = false } = args as z.infer<typeof ListDevicesInputSchema>;
          const devices = await shellyClient.listDevices(!refresh);
          
          if (devices.length === 0) {
            result = 'No devices found. Make sure you have devices added to your Shelly Cloud account.';
          } else {
            const deviceList = devices.map(device => {
              const status = device.online ? '🟢 Online' : '🔴 Offline';
              return `• ${device.name} (${device.id})\n  Type: ${device.type}\n  Model: ${device.model || 'Unknown'}\n  Status: ${status}`;
            }).join('\n\n');
            result = `Found ${devices.length} device(s):\n\n${deviceList}`;
          }
          break;
        }
        
        case 'control_light': {
          const { deviceId, turn, brightness, channel } = args as z.infer<typeof ControlLightInputSchema>;
          
          // Check device exists and is online
          const devices = await shellyClient.listDevices();
          const device = devices.find(d => d.id === deviceId);
          
          if (!device) {
            throw new McpError(
              ErrorCode.DeviceNotFound,
              `Device with ID '${deviceId}' not found. Use list_devices to see available devices.`
            );
          }
          
          if (!device.online) {
            throw new McpError(
              ErrorCode.DeviceOffline,
              `Device '${device.name}' is offline and cannot be controlled.`
            );
          }
          
          await shellyClient.controlLight(deviceId, channel, turn, brightness);
          
          result = `Successfully turned ${turn} light '${device.name}'`;
          if (brightness !== undefined) {
            result += ` with brightness set to ${brightness}%`;
          }
          break;
        }
        
        case 'control_switch': {
          const { deviceId, turn, channel } = args as z.infer<typeof ControlSwitchInputSchema>;
          
          // Check device exists and is online
          const devices = await shellyClient.listDevices();
          const device = devices.find(d => d.id === deviceId);
          
          if (!device) {
            throw new McpError(
              ErrorCode.DeviceNotFound,
              `Device with ID '${deviceId}' not found. Use list_devices to see available devices.`
            );
          }
          
          if (!device.online) {
            throw new McpError(
              ErrorCode.DeviceOffline,
              `Device '${device.name}' is offline and cannot be controlled.`
            );
          }
          
          await shellyClient.controlRelay(deviceId, channel, turn);
          result = `Successfully turned ${turn} switch '${device.name}' (channel ${channel})`;
          break;
        }
        
        case 'get_temperature': {
          const { deviceId, unit } = args as z.infer<typeof GetTemperatureInputSchema>;
          
          // Check device exists and is online
          const devices = await shellyClient.listDevices();
          const device = devices.find(d => d.id === deviceId);
          
          if (!device) {
            throw new McpError(
              ErrorCode.DeviceNotFound,
              `Device with ID '${deviceId}' not found. Use list_devices to see available devices.`
            );
          }
          
          if (!device.online) {
            throw new McpError(
              ErrorCode.DeviceOffline,
              `Device '${device.name}' is offline and cannot provide temperature readings.`
            );
          }
          
          const temperature = await shellyClient.getTemperature(deviceId);
          
          if (!temperature) {
            throw new McpError(
              ErrorCode.InternalError,
              `Device '${device.name}' does not have a temperature sensor or temperature data is not available.`
            );
          }
          
          switch (unit) {
            case 'celsius':
              result = `Temperature at '${device.name}': ${temperature.celsius.toFixed(1)}°C`;
              break;
            case 'fahrenheit':
              result = `Temperature at '${device.name}': ${temperature.fahrenheit.toFixed(1)}°F`;
              break;
            case 'both':
              result = `Temperature at '${device.name}': ${temperature.celsius.toFixed(1)}°C (${temperature.fahrenheit.toFixed(1)}°F)`;
              break;
          }
          break;
        }
        
        case 'get_device_status': {
          const { deviceId } = args as z.infer<typeof GetDeviceStatusInputSchema>;
          
          // Check device exists
          const devices = await shellyClient.listDevices();
          const device = devices.find(d => d.id === deviceId);
          
          if (!device) {
            throw new McpError(
              ErrorCode.DeviceNotFound,
              `Device with ID '${deviceId}' not found. Use list_devices to see available devices.`
            );
          }
          
          if (!device.online) {
            result = `Device '${device.name}' is currently offline. No status information available.`;
          } else {
            const status = await shellyClient.getDeviceStatus(deviceId);
            
            // Build status message
            let statusMessage = `Status for '${device.name}' (${device.type}):\n`;
            statusMessage += `• Device ID: ${deviceId}\n`;
            statusMessage += `• Model: ${device.model || 'Unknown'}\n`;
            statusMessage += `• Online: ✅\n`;
            
            // Network info
            if (status.wifi) {
              statusMessage += `\nNetwork:\n`;
              statusMessage += `• WiFi SSID: ${status.wifi.ssid || 'N/A'}\n`;
              statusMessage += `• IP Address: ${status.wifi.sta_ip || 'N/A'}\n`;
              if (status.wifi.rssi) {
                statusMessage += `• Signal Strength: ${status.wifi.rssi} dBm\n`;
              }
            } else if (status.eth?.ip) {
              statusMessage += `\nNetwork:\n`;
              statusMessage += `• Ethernet IP: ${status.eth.ip}\n`;
            }
            
            // System info
            if (status.sys) {
              statusMessage += `\nSystem:\n`;
              if (status.sys.uptime) {
                const hours = Math.floor(status.sys.uptime / 3600);
                const days = Math.floor(hours / 24);
                statusMessage += `• Uptime: ${days}d ${hours % 24}h\n`;
              }
              if (status.sys.ram_free && status.sys.ram_size) {
                const ramUsedPercent = ((status.sys.ram_size - status.sys.ram_free) / status.sys.ram_size * 100).toFixed(1);
                statusMessage += `• RAM Usage: ${ramUsedPercent}%\n`;
              }
              if (status.sys.available_updates?.stable?.version) {
                statusMessage += `• Update Available: ${status.sys.available_updates.stable.version}\n`;
              }
            }
            
            // Check for temperature in various components
            let hasTemperature = false;
            
            // Temperature sensor
            const tempSensor = (status as any)['temperature:0'];
            if (tempSensor?.tC !== undefined) {
              statusMessage += `\nTemperature:\n`;
              statusMessage += `• ${tempSensor.tC.toFixed(1)}°C (${tempSensor.tF.toFixed(1)}°F)\n`;
              hasTemperature = true;
            }
            
            // Light components
            let hasLights = false;
            for (let i = 0; i < 2; i++) {
              const light = (status as any)[`light:${i}`];
              if (light) {
                if (!hasLights) {
                  statusMessage += `\nLights:\n`;
                  hasLights = true;
                }
                statusMessage += `• Channel ${i}: ${light.output ? '💡 ON' : '⚫ OFF'}`;
                if (light.brightness !== undefined) {
                  statusMessage += ` (${light.brightness}% brightness)`;
                }
                if (light.apower !== undefined) {
                  statusMessage += ` - ${light.apower.toFixed(1)}W`;
                }
                if (light.temperature?.tC !== undefined && !hasTemperature) {
                  statusMessage += ` - ${light.temperature.tC.toFixed(1)}°C`;
                }
                statusMessage += '\n';
              }
            }
            
            // Switch/relay components
            let hasSwitches = false;
            for (let i = 0; i < 4; i++) {
              const sw = (status as any)[`switch:${i}`];
              if (sw) {
                if (!hasSwitches) {
                  statusMessage += `\nSwitches/Relays:\n`;
                  hasSwitches = true;
                }
                statusMessage += `• Channel ${i}: ${sw.output ? '🔌 ON' : '⭕ OFF'}`;
                if (sw.apower !== undefined) {
                  statusMessage += ` - ${sw.apower.toFixed(1)}W`;
                }
                if (sw.voltage !== undefined) {
                  statusMessage += ` - ${sw.voltage.toFixed(1)}V`;
                }
                if (sw.current !== undefined && sw.current > 0) {
                  statusMessage += ` - ${sw.current.toFixed(3)}A`;
                }
                if (sw.temperature?.tC !== undefined && !hasTemperature) {
                  statusMessage += ` - ${sw.temperature.tC.toFixed(1)}°C`;
                }
                statusMessage += '\n';
              }
            }
            
            // Energy meter component
            const em = (status as any)['em:0'];
            if (em) {
              statusMessage += `\nEnergy Meter:\n`;
              if (em.total_act_power !== undefined) {
                statusMessage += `• Total Power: ${em.total_act_power.toFixed(1)}W\n`;
              }
              if (em.a_act_power !== undefined) {
                statusMessage += `• Phase A: ${em.a_act_power.toFixed(1)}W @ ${em.a_voltage?.toFixed(1) || '0'}V\n`;
              }
              if (em.b_act_power !== undefined) {
                statusMessage += `• Phase B: ${em.b_act_power.toFixed(1)}W @ ${em.b_voltage?.toFixed(1) || '0'}V\n`;
              }
              if (em.c_act_power !== undefined) {
                statusMessage += `• Phase C: ${em.c_act_power.toFixed(1)}W @ ${em.c_voltage?.toFixed(1) || '0'}V\n`;
              }
            }
            
            // Humidity sensor
            const humidity = (status as any)['humidity:0'];
            if (humidity?.rh !== undefined) {
              statusMessage += `\nHumidity:\n`;
              statusMessage += `• ${humidity.rh.toFixed(1)}%\n`;
            }
            
            // Battery power
            const devicepower = (status as any)['devicepower:0'];
            if (devicepower?.battery) {
              statusMessage += `\nBattery:\n`;
              statusMessage += `• Level: ${devicepower.battery.percent}%\n`;
              statusMessage += `• Voltage: ${devicepower.battery.V}V\n`;
            }
            
            result = statusMessage.trim();
          }
          break;
        }
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
      
      return {
        content: [
          {
            type: 'text' as const,
            text: result,
          },
        ],
      };
    } catch (error) {
      logger.error(`Error executing tool ${name}:`, error);
      
      if (error instanceof McpError) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
      
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          },
        ],
        isError: true,
      };
    }
  });
  
  logger.info('All tools registered successfully');
}