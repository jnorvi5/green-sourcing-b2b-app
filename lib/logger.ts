/**
 * Logger Utility
 *
 * Provides centralized logging with PII masking.
 * Safe for Error objects and circular references.
 *
 * Usage:
 * import { logger } from '@/lib/logger';
 * logger.info('Login attempt', { email: 'user@example.com' });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private level: LogLevel = 'info';

  constructor() {
    // In development, show debug logs
    if (process.env.NODE_ENV === 'development') {
      this.level = 'debug';
    }
  }

  private safeClone(data: any): any {
    if (data instanceof Error) {
      return {
        message: data.message,
        name: data.name,
        stack: data.stack,
        ...(data as any) // Include other properties attached to the error
      };
    }

    if (typeof data !== 'object' || data === null) {
      return data;
    }

    // Handle circular references by using a WeakSet to track visited objects
    const seen = new WeakSet();

    const clone = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (obj instanceof Error) {
        return {
            message: obj.message,
            name: obj.name,
            stack: obj.stack,
            ...(obj as any)
        };
      }

      if (seen.has(obj)) {
        return '[Circular]';
      }

      seen.add(obj);

      if (Array.isArray(obj)) {
        return obj.map(clone);
      }

      const newObj: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          newObj[key] = clone(obj[key]);
        }
      }
      return newObj;
    };

    return clone(data);
  }

  private maskPII(data: any): any {
    if (!data) return data;

    const safeData = this.safeClone(data);

    const piiFields = ['email', 'password', 'token', 'secret', 'key', 'authorization', 'cookie'];

    const mask = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return;

      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          // Check if key matches PII fields (case insensitive)
          if (piiFields.some(field => key.toLowerCase().includes(field))) {
            if (typeof obj[key] === 'string') {
              if (key.toLowerCase().includes('email')) {
                // Mask email: t***@example.com
                const parts = obj[key].split('@');
                if (parts.length === 2) {
                  const [name, domain] = parts;
                  obj[key] = `${name.substring(0, 1)}***@${domain}`;
                } else {
                  obj[key] = '***';
                }
              } else {
                obj[key] = '***';
              }
            }
          } else if (typeof obj[key] === 'object') {
            mask(obj[key]);
          }
        }
      }
    };

    mask(safeData);
    return safeData;
  }

  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();

    // Safety check: ensure we can stringify without crashing even if something slips through
    let logEntry;
    try {
        const safeData = data ? this.maskPII(data) : undefined;
        logEntry = {
          timestamp,
          level,
          message,
          ...(safeData && { data: safeData })
        };
        const json = JSON.stringify(logEntry);

        switch (level) {
          case 'debug':
            if (this.level === 'debug') console.debug(json);
            break;
          case 'info':
            console.log(json);
            break;
          case 'warn':
            console.warn(json);
            break;
          case 'error':
            console.error(json);
            break;
        }
    } catch (err) {
        // Fallback if structured logging fails
        console.error(`[LOGGER FAILURE] Could not log message: ${message}`, err);
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }
}

export const logger = new Logger();
