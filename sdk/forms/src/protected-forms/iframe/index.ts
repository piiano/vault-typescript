import { IframeOptions, ResultType } from '../../options';
import { renderForm } from './components/iframe';
import { newLogger } from '../common/logger';
import { newSender } from '../common/events';

let form: HTMLFormElement | undefined;
export const iframeLogger = newLogger('iframe', true);
export const sendToParent = newSender(window.parent, iframeLogger);

window.onmessage = ({ data: { event, payload } }) => {
  iframeLogger.log(`Received "${event}" event from parent`);
  switch (event) {
    case 'init':
      iframeLogger.debug = payload.debug;
      if (form) return sendToParent('error', 'Form already initialized');
      form = renderForm(payload as IframeOptions<ResultType>);
      sendToParent('ready');
      return;
    case 'submit':
      if (!form) return sendToParent('error', 'Form not initialized');
      form.requestSubmit();
      break;
    case 'container-size':
      document.body.style.height = payload.height + 'px';
      document.body.style.width = payload.width + 'px';
      break;
  }
};
