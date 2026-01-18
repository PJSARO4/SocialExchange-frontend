export enum LogCategory {
  SYSTEM = "SYSTEM",
  POWER = "POWER",
  SIGNAL = "SIGNAL",
  USER = "USER",
}

export enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export type SystemLog = {
  id: string;
  userId: string;
  category: LogCategory;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  createdAt: string;
};
