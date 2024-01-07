import { ProtectedFormOptions, IframeOptions, ResultType, Result, Hooks } from '../options';
import { sendSizeEvents } from './common/size';
import { getElement } from '../element-selector';
import { newSender, Sender } from './common/events';
import { Logger, newLogger } from './common/logger';

export type Form<T extends ResultType> = {
  submit: () => Promise<Result<T>>;
};

export function createProtectedForm<T extends ResultType = 'fields'>(
  containerOrSelector: string | HTMLDivElement,
  { hooks, ...options }: ProtectedFormOptions<T>,
): Form<T> {
  const container = getElement<HTMLDivElement>(containerOrSelector, 'div');
  const iframe = document.createElement('iframe');
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const iframeURL = import.meta.env.VITE_IFRAME_URL;
  const parentLogger = newLogger('parent', options.debug);
  let sendToIframe: Sender;
  iframe.src = iframeURL;
  iframe.style.border = 'none';
  iframe.style.outline = 'none';
  iframe.style.display = 'block';
  iframe.style.margin = '0';
  iframe.onload = () => {
    sendToIframe = newSender(iframe.contentWindow!, parentLogger);
    // sendToIframe = newSender(iframe.contentWindow!, parentLogger, iframeURL);
    // type assertion to verify we don't pass hooks to the iframe as they are serializable and can't be passed with postMessage
    const iframeOptions: IframeOptions<T> = options;
    sendToIframe('init', iframeOptions);
    sendSizeEvents(sendToIframe, 'container-size', container);
  };

  let resultPromise: Promise<Result<T>> | undefined;
  let promiseCallbacks: { submit: (result: Result<T>) => void; error: (err: Error) => void } | undefined;

  const ready = registerHooks<T>(parentLogger, iframe, {
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
  };
}

function registerHooks<T extends ResultType>(
  logger: Logger,
  iframe: HTMLIFrameElement,
  hooks: Hooks<T>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let ready = false;
    window.onmessage = ({ data: { event, payload } }) => {
      logger.log(`Received "${event}" event from iframe`);
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
        case 'error':
          const error = new Error(payload);
          // when error is fired before the ready event it is an initialization error and we reject.
          if (!ready) {
            reject(error);
            return;
          }
          hooks?.onError?.(error);
          break;
      }
    };
  });
}
