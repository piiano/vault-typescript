import { Logger } from './logger';

export type Sender = (event: string, payload?: unknown) => void;

export function newSender(target: Window, logger: Logger, targetOrigin?: string): Sender {
  return (event: string, payload?: unknown) => {
    logger.log(`Send "${event}" event to ${target == window.top ? 'parent' : 'iframe'}`);
    target.postMessage({ event, payload }, targetOrigin ?? '*');
  };
}
