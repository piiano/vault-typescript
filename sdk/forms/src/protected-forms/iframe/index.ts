import { renderForm } from './components/iframe';
import { Logger, newLogger } from '../common/logger';
import { newSenderToSource, Sender } from '../common/events';
import { IframeEventValidator } from '../common/models';

let form: HTMLFormElement | undefined;

let sendToParent: Sender = () => {};
let log: Logger = () => {};

window.onmessage = ({ source, data }) => {
  // TODO: when the iframe will be loaded from the vault then we should allow users to configure the allowed origins.
  //  This will validate the form allow messages only from the client site origin and not from other iframes in the page or a parent iframe.
  // const parentOrigin = 'http://localhost:3000';
  // // allow messages from the parent only
  // if (origin !== parentOrigin) return;

  // We already validate the init options in the parent and return an indicative message there.
  // The validation here is done for security reasons to prevent malicious messages with prototype pollution or other attacks.
  // This is why the error message here doesn't have to be very descriptive as it's not a flow that should ever happen.
  if (!IframeEventValidator.parse(data)) {
    return sendToParent('error', {
      type: 'invalid-event',
      message: 'Invalid event data.',
    });
  }

  const { event } = data;

  log(`Received "${event}" event from parent`);
  switch (event) {
    case 'init':
      log = newLogger('iframe', data.payload.debug);
      // As a security restriction source is null when postMessage is sent from an extension.
      if (source === null) {
        return;
      }
      // Update sender to always send messages to the source of the init message.
      sendToParent = newSenderToSource(source, log);
      // sendToParent = newSenderToTarget(window.parent, log);
      if (form) return sendToParent('error', { type: 'initialization', message: 'Form already initialized' });
      form = renderForm(log, sendToParent, data.payload);
      sendToParent('ready');
      return;
    case 'submit':
      if (!form) return sendToParent('error', { type: 'initialization', message: 'Form not initialized' });
      form.requestSubmit();
      break;
    case 'container-size':
      document.body.style.height = data.payload.height + 'px';
      document.body.style.width = data.payload.width + 'px';
      break;
  }
};
