import { renderView } from './components/iframe';
import { type Logger, newLogger } from '../../common/logger';
import { newSenderToSource, type Sender } from '../../common/events';
import { ViewIframeEventValidator } from '../../common/models';
import { ObjectFields, VaultClient } from '@piiano/vault-client';
import { ViewIframeOptions } from '../../options';

let allowUpdates = false;
let fetchObjectsOptions: Omit<ViewIframeOptions, 'debug' | 'dynamic' | 'style'> | undefined = undefined;
let initialized = false;
let objects: Promise<ObjectFields[]> | undefined = undefined;
let ready: Promise<void> | undefined = undefined;

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
  if (!ViewIframeEventValidator.parse(data)) {
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

      if (initialized) return sendToParent('error', { type: 'initialization', message: 'View already initialized' });
      initialized = true;

      ready = render(data.payload)
        .then(() => {
          sendToParent('ready');
        })
        .catch((error) => {
          log(error);
          sendToParent('error', { type: 'initialization', message: error.message });
        });
      return;
    case 'update':
      ready?.then(() => {
        if (!initialized) return sendToParent('error', { type: 'initialization', message: 'View not initialized' });

        if (!allowUpdates) return sendToParent('error', { type: 'update', message: 'Updates are not allowed' });

        render(data.payload)?.catch((error) => {
          log(error);
          sendToParent('error', { type: 'update', message: error.message });
        });
      });
      break;
    case 'container-size':
      document.body.style.height = data.payload.height + 'px';
      document.body.style.width = data.payload.width + 'px';
      break;
  }
};

function didFetchObjectOptionsChange(next: ViewIframeOptions) {
  const prev = fetchObjectsOptions;
  return (
    prev === undefined ||
    prev.apiKey !== next.apiKey ||
    prev.vaultURL !== next.vaultURL ||
    prev.collection !== next.collection ||
    prev.reason !== next.reason ||
    prev.props !== next.props ||
    prev.ids.length !== next.ids.length ||
    prev.ids.some((id, i) => id !== next.ids[i])
  );
}

async function render(payload: ViewIframeOptions) {
  allowUpdates = Boolean(payload.dynamic);
  if (!objects || didFetchObjectOptionsChange(payload)) objects = fetchObjects(payload);
  renderView(sendToParent, await objects, payload.css);
}

async function fetchObjects({
  apiKey,
  vaultURL,
  collection,
  reason = 'AppFunctionality',
  props,
  ids,
}: Omit<ViewIframeOptions, 'debug' | 'style'>) {
  if (ids.length > 10) throw new Error('Too many objects');
  if (ids.some((id) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id))) {
    throw new Error('Invalid object ID');
  }

  const client = new VaultClient({ apiKey, vaultURL });
  const objects = await client.objects.listObjects({ collection, reason, props, ids });

  // make the object fields order consistent with the provided props order.
  return objects.results.map((object) =>
    Object.fromEntries(
      Object.entries(object).sort(([keyA], [keyB]) => {
        return props.indexOf(keyA) - props.indexOf(keyB);
      }),
    ),
  );
}
