import type { Hooks, IframeOptions, ProtectedFormOptions, Result, ResultType } from '../options';
import { sendSizeEvents } from './common/size';
import { getElement } from '../element-selector';
import { newSenderToTarget, type Sender } from './common/events';
import { type Logger, newLogger } from './common/logger';
import { InitOptionsValidator } from './common/models';

export type { Theme, Style, Variables, Field } from './common/models';

export type Form<T extends ResultType> = {
  submit: () => Promise<Result<T>>;
  destroy: () => void;
  update: (options: ProtectedFormOptions<T>) => void;
};

export function createProtectedForm<T extends ResultType = 'fields'>(
  containerOrSelector: string | HTMLDivElement,
  { hooks, ...options }: ProtectedFormOptions<T>,
): Form<T> {
  if (!InitOptionsValidator.parse(options)) {
    throw new Error('Invalid options provided');
  }

  const container = getElement<HTMLDivElement>(containerOrSelector, 'div');
  const iframe = document.createElement('iframe');
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const iframeURL = import.meta.env.VITE_IFRAME_URL;
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
      const iframeOptions: IframeOptions<T> = options;
      sendToIframe('init', iframeOptions);
      sendSizeEvents(sendToIframe, 'container-size', container);
    });
  };

  let resultPromise: Promise<Result<T>> | undefined;
  let promiseCallbacks: { submit: (result: Result<T>) => void; error: (err: Error) => void } | undefined;

  const ready = registerHooks<T>(log, iframe, {
    onSubmit(r) {
      hooks?.onSubmit?.(r);
      promiseCallbacks?.submit?.(r);
    },
    onError(e) {
      hooks?.onError?.(e);
      promiseCallbacks?.error?.(e);
    },
  });

  container.appendChild(iframe);

  return {
    async submit() {
      await ready;
      if (resultPromise) return resultPromise;

      resultPromise = new Promise<Result<T>>((resolve, reject) => {
        promiseCallbacks = { submit: resolve, error: reject };
        sendToIframe('submit');
      }).finally(() => {
        promiseCallbacks = undefined;
        resultPromise = undefined;
      });

      return resultPromise;
    },
    async destroy() {
      await ready;
      container.removeChild(iframe);
    },
    async update({ hooks: newHooks, ...options }: ProtectedFormOptions<T>) {
      await ready;
      if (!InitOptionsValidator.parse(options)) {
        throw new Error('Invalid options provided');
      }
      hooks = newHooks;
      sendToIframe('update', options);
    },
  };
}

function registerHooks<T extends ResultType>(log: Logger, iframe: HTMLIFrameElement, hooks: Hooks<T>): Promise<void> {
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
          hooks?.onSubmit?.(payload);
          break;
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
