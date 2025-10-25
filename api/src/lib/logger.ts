type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

export class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  with(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  private log(level: LogLevel, message: string, error?: any, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...context,
      ...(error && { error: this.serializeError(error) }),
    };

    const output = JSON.stringify(logEntry);

    if (level === 'error') {
      console.error(output);
    } else if (level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  private serializeError(error: any): any {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    return error;
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, undefined, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, undefined, context);
  }

  error(message: string, error?: any, context?: LogContext) {
    this.log('error', message, error, context);
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, undefined, context);
    }
  }
}

const errorStats = {
  total: 0,
  errors: 0,
  windowStart: Date.now(),
};

export function trackError() {
  errorStats.errors++;
  errorStats.total++;

  const now = Date.now();
  if (now - errorStats.windowStart > 15 * 60 * 1000) {
    errorStats.windowStart = now;
    errorStats.errors = 1;
    errorStats.total = 1;
  }
}

export function getErrorStats() {
  const errorRate = errorStats.total > 0 ? errorStats.errors / errorStats.total : 0;

  if (errorRate > 0.1) {
    new Logger({ module: 'error-monitor' }).warn('High error rate detected', {
      errorRate: (errorRate * 100).toFixed(2) + '%',
      window: '15min',
    });
  }

  return { errorRate, errors: errorStats.errors, total: errorStats.total };
}

export function requestLogger(req: any, res: any, next: any) {
  const logger = new Logger({ module: 'http' });
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });

    if (res.statusCode >= 400) {
      trackError();
    }
  });

  next();
}

export const logger = new Logger();
