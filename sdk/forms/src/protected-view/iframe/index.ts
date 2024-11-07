import { renderView } from './components/iframe';
import { type Logger, newLogger } from '../../common/logger';
import { newSenderToSource, type Sender } from '../../common/events';
import { InvokeActionStrategyOptions, ReadObjectStrategyOptions, ViewIframeEventValidator } from '../../common/models';
import { ObjectFields, VaultClient } from '@piiano/vault-client';
import { ViewIframeOptions } from '../../options';

export type Result =
  | { strategy: 'read-objects'; objects: ObjectFields[] }
  | { strategy: 'invoke-action'; response: unknown };

let allowUpdates = false;
let fetchObjectsOptions: Omit<ViewIframeOptions, 'debug' | 'dynamic' | 'style'> | undefined = undefined;
let initialized = false;
let result: Promise<Result>;
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

function didStrategyOptionsChange(next: ViewIframeOptions) {
  const prev = fetchObjectsOptions;
  return (
    prev === undefined ||
    prev.apiKey !== next.apiKey ||
    prev.vaultURL !== next.vaultURL ||
    prev.strategy.type !== prev.strategy.type ||
    (prev.strategy.type === 'read-objects' &&
      next.strategy.type === 'read-objects' &&
      didReadObjectOptionsChange(prev.strategy, next.strategy)) ||
    (prev.strategy.type === 'invoke-action' &&
      next.strategy.type === 'invoke-action' &&
      didInvokeActionOptionsChange(prev.strategy, next.strategy))
  );
}

async function render(payload: ViewIframeOptions) {
  allowUpdates = Boolean(payload.dynamic);
  if (!result || didStrategyOptionsChange(payload)) result = applyStrategy(payload);
  fetchObjectsOptions = payload;
  renderView(sendToParent, await result, payload.display, payload.css);
}

function didReadObjectOptionsChange(prev: ReadObjectStrategyOptions, next: ReadObjectStrategyOptions) {
  return (
    prev === undefined ||
    prev.collection !== next.collection ||
    prev.reason !== next.reason ||
    prev.transformationParam !== next.transformationParam ||
    prev.props.length !== next.props.length ||
    prev.props.some((prop, i) => prop !== next.props[i]) ||
    prev.ids.length !== next.ids.length ||
    prev.ids.some((id, i) => id !== next.ids[i])
  );
}

function didInvokeActionOptionsChange(prev: InvokeActionStrategyOptions, next: InvokeActionStrategyOptions) {
  return (
    prev === undefined ||
    prev.action !== next.action ||
    prev.reason !== next.reason ||
    JSON.stringify(prev.input) !== JSON.stringify(next.input)
  );
}

async function applyStrategy({
  vaultURL,
  apiKey,
  strategy,
}: Pick<ViewIframeOptions, 'vaultURL' | 'apiKey' | 'strategy'>): Promise<Result> {
  const client = new VaultClient({ apiKey, vaultURL });
  switch (strategy.type) {
    case 'read-objects':
      return {
        strategy: 'read-objects',
        objects: await fetchObjects(client, strategy),
      };
    case 'invoke-action':
      return {
        strategy: 'invoke-action',
        response: await invokeAction(client, strategy),
      };
  }
}

function invokeAction(
  client: VaultClient,
  { action, reason = 'AppFunctionality', input }: InvokeActionStrategyOptions,
) {
  return client.actions.invokeAction({
    action,
    reason,
    requestBody: input,
  });
}

async function fetchObjects(
  client: VaultClient,
  { collection, reason = 'AppFunctionality', props, ids, transformationParam }: ReadObjectStrategyOptions,
) {
  if (ids.length > 10) throw new Error('Too many objects');
  if (ids.some((id) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id))) {
    throw new Error('Invalid object ID');
  }

  const objects = await client.objects.listObjects({
    collection,
    reason,
    props,
    ids,
    xTransParam: transformationParam,
  });

  // make the object fields order consistent with the provided props order.
  return objects.results.map((object) =>
    Object.fromEntries(
      Object.entries(object).sort(([keyA], [keyB]) => {
        return props.indexOf(keyA) - props.indexOf(keyB);
      }),
    ),
  );
}
