type LogLevel = "info" | "warn" | "error";

const format = (level: LogLevel, message: string, context?: Record<string, unknown>) => {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    context: context ?? {}
  };
  return JSON.stringify(payload);
};

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(format("info", message, context));
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(format("warn", message, context));
  },
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(format("error", message, context));
  }
};
