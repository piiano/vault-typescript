export type Logger = typeof console.log;

export function newLogger(name: string, debug = false): Logger {
  return (message?: unknown, ...optionalParams: unknown[]) => {
    if (!debug) return;
    console.log(`${name}:`, message, ...optionalParams);
  };
}
