import { Logger } from './logger';

export type Sender = (event: string, payload?: unknown) => void;

export function newSenderToTarget(target: Window, log: Logger, targetOrigin: string = '*'): Sender {
  return (event: string, payload?: unknown) => {
    log(`Send "${event}" event to iframe`);
    target.postMessage({ event, payload }, targetOrigin);
  };
}

export function newSenderToSource(target: MessageEventSource, log: Logger): Sender {
  return (event: string, payload?: unknown) => {
    log(`Send "${event}" event to parent`);
    target?.postMessage(
      { event, payload },
      {
        // TODO: when loaded from the vault lock this to a specific origin
        targetOrigin: '*',
      },
    );
  };
}
