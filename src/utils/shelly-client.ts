import axios, { AxiosInstance, AxiosError } from 'axios';
import { z } from 'zod';
import { ConfigManager } from './config.js';
import { logger } from './logger.js';

// Device schemas
export const ShellyDeviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  online: z.boolean(),
  model: z.string().optional(),
  gen: z.string().optional(),
  mac: z.string().optional(),
});

export const DeviceStatusSchema = z.object({
  id: z.string(),
  code: z.string().optional(),
  cloud: z.object({
    connected: z.boolean(),
  }).optional(),
  wifi: z.object({
    sta_ip: z.string().optional(),
    ssid: z.string().optional(),
    rssi: z.number().optional(),
    status: z.string().optional(),
  }).optional(),
  eth: z.object({
    ip: z.string().nullable().optional(),
  }).optional(),
  sys: z.object({
    mac: z.string().optional(),
    time: z.string().nullable().optional(),
    unixtime: z.number().nullable().optional(),
    uptime: z.number().optional(),
    ram_size: z.number().optional(),
    ram_free: z.number().optional(),
    fs_size: z.number().optional(),
    fs_free: z.number().optional(),
    cfg_rev: z.number().optional(),
    kvs_rev: z.number().optional(),
    schedule_rev: z.number().optional(),
    webhook_rev: z.number().optional(),
    available_updates: z.object({
      stable: z.object({ version: z.string() }).optional(),
      beta: z.object({ version: z.string() }).optional(),
    }).optional(),
    reset_reason: z.number().optional(),
    restart_required: z.boolean().optional(),
  }).optional(),
  // Light components
  'light:0': z.any().optional(),
  'light:1': z.any().optional(),
  // Switch components
  'switch:0': z.any().optional(),
  'switch:1': z.any().optional(),
  'switch:2': z.any().optional(),
  'switch:3': z.any().optional(),
  // Temperature sensors
  'temperature:0': z.any().optional(),
  // Other components
  mqtt: z.object({ connected: z.boolean() }).optional(),
  ws: z.object({ connected: z.boolean() }).optional(),
  ble: z.array(z.any()).optional(),
}).passthrough(); // Allow additional fields

export type ShellyDevice = z.infer<typeof ShellyDeviceSchema>;
export type DeviceStatus = z.infer<typeof DeviceStatusSchema>;

export class ShellyClient {
  private axios: AxiosInstance;
  private config: ConfigManager;
  private deviceCache: Map<string, ShellyDevice> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION_MS = 60000; // 1 minute cache

  constructor(config: ConfigManager) {
    this.config = config;
    this.axios = axios.create({
      baseURL: config.serverUri,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Add request interceptor for logging
    this.axios.interceptors.request.use(
      (config) => {
        logger.debug('Shelly API request:', {
          method: config.method,
          url: config.url,
          baseURL: config.baseURL,
        });
        return config;
      },
      (error) => {
        logger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => {
        logger.debug('Shelly API response:', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
        return response;
      },
      (error: AxiosError) => {
        logger.error('Shelly API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        return Promise.reject(this.formatError(error));
      }
    );
  }

  private formatError(error: AxiosError): Error {
    if (error.response?.status === 401) {
      return new Error('Authentication failed. Please check your API key.');
    }
    if (error.response?.status === 429) {
      return new Error('Rate limit exceeded. Please try again later.');
    }
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timeout. Please check your network connection.');
    }
    return new Error(`Shelly API error: ${error.message}`);
  }

  async listDevices(useCache = true): Promise<ShellyDevice[]> {
    try {
      // Check cache
      if (useCache && this.deviceCache.size > 0 && 
          Date.now() - this.cacheTimestamp < this.CACHE_DURATION_MS) {
        logger.debug('Returning cached device list');
        return Array.from(this.deviceCache.values());
      }

      await this.config.enforceRateLimit();
      
      const response = await this.axios.post('/device/all_status', 
        `auth_key=${encodeURIComponent(this.config.apiKey)}`
      );

      logger.debug('Raw response from /device/all_status:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: JSON.stringify(response.data, null, 2),
      });

      const devices: ShellyDevice[] = [];
      
      if (response.data && response.data.data && response.data.data.devices_status) {
        const devicesStatus = response.data.data.devices_status;
        logger.debug(`Found devices_status with ${Object.keys(devicesStatus).length} devices`);
        
        for (const [deviceId, deviceData] of Object.entries(devicesStatus)) {
          try {
            const data = deviceData as any;
            logger.debug(`Processing device ${deviceId}:`, data);
            
            // Determine device type from code
            let deviceType = 'unknown';
            if (data.code) {
              if (data.code.includes('SPDM')) deviceType = 'dimmer';
              else if (data.code.includes('SPSW')) deviceType = 'switch';
              else if (data.code.includes('SPEM')) deviceType = 'energy_meter';
              else if (data.code.includes('S3SN')) deviceType = 'sensor';
              else if (data.code.includes('S3SW')) deviceType = 'switch';
              else if (data.code.includes('SNGW')) deviceType = 'gateway';
              else if (data.code === 'THERMOSTAT') deviceType = 'thermostat';
              else deviceType = data.code.toLowerCase();
            }
            
            // Determine if device is online
            const isOnline = data.cloud?.connected || false;
            
            // Get MAC address from sys object
            const macAddress = data.sys?.mac || data.mac || '';
            
            // Use code as model, or extract from other fields
            const model = data.code || data.model || '';
            
            // Extract generation info
            const gen = data._dev_info?.gen || data.gen || '';
            
            // Create a display name
            let displayName = deviceId;
            if (data.code) {
              displayName = `${data.code} (${deviceId})`;
            }
            
            const device: ShellyDevice = {
              id: deviceId,
              name: displayName,
              type: deviceType,
              online: isOnline,
              model: model,
              gen: gen,
              mac: macAddress,
            };
            
            devices.push(device);
            this.deviceCache.set(deviceId, device);
          } catch (parseError) {
            logger.warn(`Failed to parse device ${deviceId}:`, parseError);
          }
        }
      } else {
        logger.warn('No devices_status found in response. Response structure:', JSON.stringify(response.data, null, 2));
      }

      this.cacheTimestamp = Date.now();
      logger.info(`Listed ${devices.length} devices`);
      return devices;
    } catch (error) {
      logger.error('Failed to list devices:', error);
      throw error;
    }
  }

  async getDeviceStatus(deviceId: string): Promise<DeviceStatus> {
    try {
      await this.config.enforceRateLimit();
      
      const response = await this.axios.post('/device/status',
        `id=${encodeURIComponent(deviceId)}&auth_key=${encodeURIComponent(this.config.apiKey)}`
      );

      logger.debug('Device status response:', JSON.stringify(response.data, null, 2));

      if (response.data?.data?.device_status) {
        const deviceStatus = {
          id: deviceId,
          ...response.data.data.device_status,
        };
        return DeviceStatusSchema.parse(deviceStatus);
      } else {
        throw new Error('Invalid device status response structure');
      }
    } catch (error) {
      logger.error(`Failed to get status for device ${deviceId}:`, error);
      throw error;
    }
  }

  async controlLight(deviceId: string, channel: number, turn: 'on' | 'off', brightness?: number): Promise<void> {
    try {
      await this.config.enforceRateLimit();
      
      let params = `id=${encodeURIComponent(deviceId)}&auth_key=${encodeURIComponent(this.config.apiKey)}&channel=${channel}&turn=${turn}`;
      
      if (brightness !== undefined) {
        params += `&brightness=${brightness}`;
      }

      await this.axios.post('/device/light/control', params);
      
      logger.info(`Light control successful: device=${deviceId}, channel=${channel}, turn=${turn}, brightness=${brightness}`);
    } catch (error) {
      logger.error(`Failed to control light ${deviceId}:`, error);
      throw error;
    }
  }

  async controlRelay(deviceId: string, channel: number, turn: 'on' | 'off'): Promise<void> {
    try {
      await this.config.enforceRateLimit();
      
      const params = `id=${encodeURIComponent(deviceId)}&auth_key=${encodeURIComponent(this.config.apiKey)}&channel=${channel}&turn=${turn}`;
      
      await this.axios.post('/device/relay/control', params);
      
      logger.info(`Relay control successful: device=${deviceId}, channel=${channel}, turn=${turn}`);
    } catch (error) {
      logger.error(`Failed to control relay ${deviceId}:`, error);
      throw error;
    }
  }

  async getTemperature(deviceId: string): Promise<{ celsius: number; fahrenheit: number } | null> {
    try {
      const status = await this.getDeviceStatus(deviceId);
      
      // Check for temperature in various component locations
      const tempComponent = (status as any)['temperature:0'];
      if (tempComponent && tempComponent.tC !== undefined) {
        return {
          celsius: tempComponent.tC,
          fahrenheit: tempComponent.tF,
        };
      }
      
      // Check in switch components
      for (let i = 0; i < 4; i++) {
        const switchComponent = (status as any)[`switch:${i}`];
        if (switchComponent?.temperature?.tC !== undefined) {
          return {
            celsius: switchComponent.temperature.tC,
            fahrenheit: switchComponent.temperature.tF,
          };
        }
      }
      
      // Check in light components
      for (let i = 0; i < 2; i++) {
        const lightComponent = (status as any)[`light:${i}`];
        if (lightComponent?.temperature?.tC !== undefined) {
          return {
            celsius: lightComponent.temperature.tC,
            fahrenheit: lightComponent.temperature.tF,
          };
        }
      }
      
      // Check in em components (energy meter)
      const emComponent = (status as any)['em:0'];
      if (emComponent?.temperature?.tC !== undefined) {
        return {
          celsius: emComponent.temperature.tC,
          fahrenheit: emComponent.temperature.tF,
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`Failed to get temperature for device ${deviceId}:`, error);
      throw error;
    }
  }
}