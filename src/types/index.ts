import { z } from 'zod';

// Tool input schemas
export const ListDevicesInputSchema = z.object({
  refresh: z.boolean().optional().describe('Force refresh device list (bypass cache)'),
});

export const ControlLightInputSchema = z.object({
  deviceId: z.string().describe('The device ID to control'),
  turn: z.enum(['on', 'off']).describe('Turn the light on or off'),
  brightness: z.number().min(0).max(100).optional().describe('Brightness level (0-100)'),
  channel: z.number().min(0).default(0).describe('Channel number (default: 0)'),
});

export const ControlSwitchInputSchema = z.object({
  deviceId: z.string().describe('The device ID to control'),
  turn: z.enum(['on', 'off']).describe('Turn the switch on or off'),
  channel: z.number().min(0).default(0).describe('Channel number (default: 0)'),
});

export const GetTemperatureInputSchema = z.object({
  deviceId: z.string().describe('The device ID to get temperature from'),
  unit: z.enum(['celsius', 'fahrenheit', 'both']).default('celsius').describe('Temperature unit'),
});

export const GetDeviceStatusInputSchema = z.object({
  deviceId: z.string().describe('The device ID to get status for'),
});

// Response types
export interface ToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

// Error codes
export enum ErrorCode {
  InvalidInput = 'INVALID_INPUT',
  DeviceNotFound = 'DEVICE_NOT_FOUND',
  DeviceOffline = 'DEVICE_OFFLINE',
  AuthenticationFailed = 'AUTH_FAILED',
  RateLimitExceeded = 'RATE_LIMIT',
  NetworkError = 'NETWORK_ERROR',
  InternalError = 'INTERNAL_ERROR',
}

// Custom error class
export class McpError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'McpError';
  }
}