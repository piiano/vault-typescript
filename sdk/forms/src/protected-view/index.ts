import { ErrorHook, ProtectedViewOptions, ViewIframeOptions } from '../options';
import { sendSizeEvents } from './common/size';
import { getElement } from '../element-selector';
import { newSenderToTarget, type Sender } from './common/events';
import { type Logger, newLogger } from './common/logger';
import { InitOptionsValidator } from './common/models';

export type { Theme, Style, Variables, Field } from './common/models';

export type View = {
  destroy: () => void;
  update: (options: ProtectedViewOptions) => void;
};

export function createProtectedView(
  containerOrSelector: string | HTMLDivElement,
  { hooks, ...options }: ProtectedViewOptions,
): View {
  if (!InitOptionsValidator.parse(options)) {
    throw new Error('Invalid options provided');
  }

  const container = getElement<HTMLDivElement>(containerOrSelector, 'div');
  const iframe = document.createElement('iframe');
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const iframeURL = import.meta.env.VITE_VIEW_IFRAME_URL;
  const log = newLogger('parent', options.debug);
  let sendToIframe: Sender;
  iframe.src = iframeURL;
  iframe.style.border = 'none';
  iframe.style.outline = 'none';
  iframe.style.display = 'block';
  iframe.style.margin = '0';
  iframe.onload = () => {
    setTimeout(() => {
      sendToIframe = newSenderToTarget(iframe.contentWindow!, log);
      // sendToIframe = newSender(iframe.contentWindow!, parentLogger, iframeURL);
      // type assertion to verify we don't pass hooks to the iframe as they are serializable and can't be passed with postMessage
      const iframeOptions: ViewIframeOptions = options;
      sendToIframe('init', iframeOptions);
      sendSizeEvents(sendToIframe, 'container-size', container);
    });
  };

  let promiseCallbacks: { error: (err: Error) => void } | undefined;

  const ready = registerHooks(log, iframe, {
    onError(e) {
      hooks?.onError?.(e);
      promiseCallbacks?.error?.(e);
    },
  });

  container.appendChild(iframe);

  return {
    async destroy() {
      await ready;
      container.removeChild(iframe);
    },
    async update({ hooks: newHooks, ...options }: ProtectedViewOptions) {
      await ready;
      if (!InitOptionsValidator.parse(options)) {
        throw new Error('Invalid options provided');
      }
      hooks = newHooks;
      sendToIframe('update', options);
    },
  };
}

function registerHooks(log: Logger, iframe: HTMLIFrameElement, hooks: ErrorHook): Promise<void> {
  return new Promise((resolve, reject) => {
    let ready = false;
    window.onmessage = ({ origin, data: { event, payload } }) => {
      // @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const iframeOrigin = import.meta.env.VITE_IFRAME_ORIGIN;
      // if the message is not from the iframe, ignore it
      if (origin !== iframeOrigin) return;

      log(`Received "${event}" event from iframe`);
      switch (event) {
        case 'ready':
          ready = true;
          resolve();
          break;
        case 'content-size':
          iframe.style.height = payload.height + 'px';
          iframe.style.width = payload.width + 'px';
          break;
        case 'submit':
        case 'error': {
          const error = Object.assign(new Error(payload.message), payload);
          // when error is fired before the ready event it is an initialization error and we reject.
          if (!ready) {
            reject(error);
            return;
          }
          hooks?.onError?.(error);
          break;
        }
      }
    };
  });
}
