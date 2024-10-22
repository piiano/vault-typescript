import type { Sender } from './events';

export function sendSizeEvents(sender: Sender, eventName: string, element: HTMLElement) {
  new ResizeObserver(() => {
    const { height, width } = element.getBoundingClientRect();
    sender(eventName, { height, width });
  }).observe(element);
}
