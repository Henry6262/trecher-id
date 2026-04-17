/**
 * Structured logging for Trecher-ID.
 * Consistent JSON format for Vercel/CloudWatch log aggregation.
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
  [key: string]: unknown;
}

const log = (level: LogLevel, context: string, message: string, data?: LogContext) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
    ...data,
  };

  const output = JSON.stringify(logEntry);
  
  if (level === 'ERROR') {
    console.error(output);
  } else if (level === 'WARN') {
    console.warn(output);
  } else {
    console.log(output);
  }
};

export const logger = {
  info: (context: string, message: string, data?: LogContext) => 
    log('INFO', context, message, data),
  warn: (context: string, message: string, data?: LogContext) => 
    log('WARN', context, message, data),
  error: (context: string, message: string, err?: unknown, data?: LogContext) => {
    const errorData: LogContext = { ...data };
    
    if (err instanceof Error) {
      errorData.errorName = err.name;
      errorData.errorMessage = err.message;
      errorData.stack = err.stack;
    } else if (err) {
      errorData.error = String(err);
    }
    
    log('ERROR', context, message, errorData);
  }
};
