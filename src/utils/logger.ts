import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { homedir } from 'os';
import { join } from 'path';
import { mkdirSync } from 'fs';

// Ensure log directory exists
const logDir = join(homedir(), '.shelly-mcp', 'logs');
try {
  mkdirSync(logDir, { recursive: true });
} catch (error) {
  // Silently fail - log directory creation error will be caught when writing logs
}

// Configure daily rotate transport
const dailyRotateTransport = new DailyRotateFile({
  filename: join(logDir, 'shelly-mcp-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
});

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    dailyRotateTransport,
    // Also log errors to a separate file
    new winston.transports.File({
      filename: join(logDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),
  ],
});

// MCP servers must not output to console as it interferes with the protocol
// All logging is done to files only