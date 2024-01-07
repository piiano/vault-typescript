export type Logger = {
  debug: boolean;
  log: typeof console.log;
};

export function newLogger(name: string, debug = false): Logger {
  return {
    debug,
    log(message?: unknown, ...optionalParams: unknown[]) {
      if (this.debug) console.log(`${name}:`, message, ...optionalParams);
    },
  };
}
