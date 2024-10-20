import { Page } from '@playwright/test';
import { ConsoleMessage } from 'playwright-core';

type WaitForConsoleOptions = {
  message?: string | RegExp;
  type?: string;
  timeout?: number;
};

export function waitForConsole(
  page: Page,
  { message, type = 'log', timeout = 10000 }: WaitForConsoleOptions = {},
): Promise<string> {
  let resolve: ((text: string) => void) | undefined;
  let reject: ((err: Error) => void) | undefined;
  const timer = setTimeout(() => {
    reject?.(new Error(`Timeout waiting for console log (timeout: ${timeout}ms)`));
  }, timeout);

  const listener = (msg: ConsoleMessage) => {
    if (msg.type() !== type) {
      return;
    }
    const text = msg.text();
    if (message && (typeof message === 'string' ? text !== message : !message.test(text))) {
      return;
    }

    resolve?.(text);
  };

  return new Promise<string>((res, rej) => {
    resolve = res;
    reject = rej;
    page.on('console', listener);
  }).finally(() => {
    clearTimeout(timer);
    page.off('console', listener);
  });
}
