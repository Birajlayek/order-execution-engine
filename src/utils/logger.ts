import { v4 as uuidv4 } from 'uuid';

interface LogData {
  orderId?: string;
  userId?: string;
  [key: string]: any;
}

class StructuredLogger {
  private traceId: string = uuidv4();

  log(event: string, data: LogData = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      traceId: this.traceId,
      ...data,
    };
    console.log(JSON.stringify(logEntry));
  }

  error(event: string, error: Error, data: LogData = {}) {
    this.log(event, {
      ...data,
      error: { message: error.message, stack: error.stack },
    });
  }

  setTraceId(traceId: string) {
    this.traceId = traceId;
  }
}

export const logger = new StructuredLogger();
