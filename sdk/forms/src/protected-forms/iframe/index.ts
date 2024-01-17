import { IframeOptions, ResultType } from '../../options';
import { renderForm } from './components/iframe';
import { Logger, newLogger } from '../common/logger';
import { newSenderToTarget, newSenderToSource, Sender } from '../common/events';

let form: HTMLFormElement | undefined;

let sendToParent: Sender = () => {};
let log: Logger = () => {};

window.onmessage = ({ source, data: { event, payload } }) => {
  // TODO: when the iframe will be loaded from the vault then we should allow users to configure the allowed origins.
  //  This will validate the form allow messages only from the client site origin and not from other iframes in the page or a parent iframe.
  // const parentOrigin = 'http://localhost:3000';
  // // allow messages from the parent only
  // if (origin !== parentOrigin) return;

  log(`Received "${event}" event from parent`);
  switch (event) {
    case 'init':
      log = newLogger('iframe', payload.debug);
      // As a security restriction source is null when postMessage is sent from an extension.
      if (source === null) {
        console.log('Source is null, ignoring message');
        return;
      }
      // Update sender to always send messages to the source of the init message.
      sendToParent = newSenderToSource(source, log);
      // sendToParent = newSenderToTarget(window.parent, log);
      if (form) return sendToParent('error', 'Form already initialized');
      form = renderForm(log, sendToParent, payload as IframeOptions<ResultType>);
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
