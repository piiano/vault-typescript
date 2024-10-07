import { renderView } from './components/iframe';
import { type Logger, newLogger } from '../common/logger';
import { newSenderToSource, type Sender } from '../common/events';
import { IframeEventValidator, type Style } from '../common/models';
import { VaultClient } from '@piiano/vault-client';

let view: HTMLDivElement | undefined;
let style: Style | undefined;
let allowUpdates = false;

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
      if (view) return sendToParent('error', { type: 'initialization', message: 'View already initialized' });

      const { dynamic, apiKey, vaultURL, collection, reason = 'AppFunctionality', props, objects: ids } = data.payload;
      allowUpdates = Boolean(dynamic);
      style = data.payload.style;

      if (ids.length > 10) return sendToParent('error', { type: 'initialization', message: 'Too many objects' });
      if (ids.some((id) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id))) {
        return sendToParent('error', { type: 'initialization', message: 'Invalid object ID' });
      }

      const client = new VaultClient({ apiKey, vaultURL });
      client.objects
        .listObjects({ collection, reason, props, ids })
        .then((result) => {
          view = renderView(sendToParent, style!, result.results);
          sendToParent('ready');
        })
        .catch((error) => {
          log(error);
          sendToParent('error', { type: 'initialization', message: 'Failed to fetch objects', error });
        });
      return;
    // case 'update':
    //   if (!view) return sendToParent('error', { type: 'initialization', message: 'View not initialized' });
    //
    //   if (!allowUpdates) return sendToParent('error', { type: 'update', message: 'Updates are not allowed' });
    //
    //   view = updateForm(log, sendToParent, form, style, data.payload);
    //   style = data.payload.style;
    //   allowUpdates = Boolean(data.payload.allowUpdates);
    //   break;
    case 'container-size':
      document.body.style.height = data.payload.height + 'px';
      document.body.style.width = data.payload.width + 'px';
      break;
  }
};
