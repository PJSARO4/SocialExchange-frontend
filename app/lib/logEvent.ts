import { LogCategory } from "../types/SystemLog";

/**
 * TEMP in-memory log store (DEV ONLY)
 * This prevents DB crashes from breaking UI
 */
const memoryLogs: any[] = [];

export async function logEvent(params: {
  userId: string;
  category: LogCategory;
  message: string;
  level?: string;
  context?: Record<string, unknown>;
}) {
  memoryLogs.unshift({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...params,
  });

  // Cap memory
  if (memoryLogs.length > 100) memoryLogs.pop();
}

export function getMemoryLogs() {
  return memoryLogs;
}
