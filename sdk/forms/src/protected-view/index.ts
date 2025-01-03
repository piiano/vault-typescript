import { type ProtectedViewHooks, type ProtectedViewOptions, type ViewIframeOptions } from '../options';
import { sendSizeEvents } from '../common/size';
import { getElement } from '../element-selector';
import { newSenderToTarget, type Sender } from '../common/events';
import { type Logger, newLogger } from '../common/logger';
import { ViewInitOptionsValidator } from '../common/models';

export type { Theme, Style, Variables, Field } from '../common/models';

/**
 * A view that handle to interact with the protected view iframe programmatically.
 */
export type View = {
  /**
   * Destroy the view and remove it from the DOM safely.
   */
  destroy: () => void;
  /**
   * Update the view with new options.
   * Note: the dynamic flag must be true to allow updates.
   */
  update: (options: ProtectedViewOptions) => void;
  /**
   * Copy the value of the specified field path to the clipboard.
   * If triggered as result of a keyboard event originated from within the view an additional trustedEventKey can be provided to prevent a confirmation dialog.
   */
  copy: (params: { path: string; trustedEventKey?: string }) => Promise<void>;
};

export function createProtectedView(
  containerOrSelector: string | HTMLDivElement,
  { hooks, ...options }: ProtectedViewOptions,
): View {
  if (!ViewInitOptionsValidator.parse(options)) {
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

  const ready = registerHooks(log, iframe, {
    onError(e) {
      hooks?.onError?.(e);
    },
    onClick(event) {
      hooks?.onClick?.(event);
    },
    onMouseEnter(event) {
      hooks?.onMouseEnter?.(event);
    },
    onMouseLeave(event) {
      hooks?.onMouseLeave?.(event);
    },
  });

  // if the user doesn't call destroy or update, and the init return with an error, we don't want to keep it as an unhandled promise
  ready.catch((e) => void 0);

  container.appendChild(iframe);

  return {
    async destroy() {
      await ready;
      container.removeChild(iframe);
    },
    async update({ hooks: newHooks, ...options }: ProtectedViewOptions) {
      await ready;
      if (!ViewInitOptionsValidator.parse(options)) {
        throw new Error('Invalid options provided');
      }
      hooks = newHooks;
      sendToIframe('update', options);
    },
    async copy({ path, trustedEventKey }) {
      await ready;
      iframe.contentWindow?.focus();
      sendToIframe('copy', { path, trustedEventKey });
    },
  };
}

function registerHooks(log: Logger, iframe: HTMLIFrameElement, hooks: ProtectedViewHooks): Promise<void> {
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
        case 'error': {
          const error = Object.assign(new Error(payload.message), payload);
          hooks?.onError?.(error);
          if (!ready) {
            // when error is fired before the ready event it is an initialization error and we reject.
            reject(error);
            return;
          }
          break;
        }
        case 'click':
          hooks?.onClick?.(payload);
          break;
        case 'mouseenter':
          hooks?.onMouseEnter?.(payload);
          break;
        case 'mouseleave':
          hooks?.onMouseLeave?.(payload);
          break;
        case 'keydown':
        case 'keyup':
        case 'keypress': {
          const keyboardEvent: KeyboardEvent & { trustedEventKey?: string } = new KeyboardEvent(event, payload);
          keyboardEvent['trustedEventKey'] = payload.trustedEventKey;
          iframe.dispatchEvent(keyboardEvent);
          break;
        }
      }
    };
  });
}
