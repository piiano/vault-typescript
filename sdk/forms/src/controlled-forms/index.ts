import { VaultClient } from '@piiano/vault-client';
import { applyStrategy } from '../apply-strategy';
import type { ControlFormOptions, Result, ResultType } from '../options';
import { getElement } from '../element-selector';

const piianoControlledAttribute = 'data-piiano-controlled';

export async function controlForm<T extends ResultType = 'fields'>(
  formOrSelector: string | HTMLFormElement,
  { vaultURL, apiKey, hooks, replayOriginalEvents = true, ...submitOptions }: ControlFormOptions<T>,
) {
  if (replayOriginalEvents && submitOptions.strategy?.endsWith('-object')) {
    throw new Error(`Cannot use the "replayOriginalEvents" option with strategy "${submitOptions.strategy}"`);
  }

  const form = getElement<HTMLFormElement>(formOrSelector, 'form');
  const client = new VaultClient({ vaultURL, apiKey });
  const originalOnSubmit = form.onsubmit;

  form.onsubmit = (event: SubmitEvent) => {
    if (handleReplayEvent(form, replayOriginalEvents, event, originalOnSubmit)) {
      return;
    }
    event.preventDefault();
    const formData = new FormData(form);
    const object = Object.fromEntries(formData.entries());
    applyStrategy<T>(object, { client, ...submitOptions })
      .then(manipulateFormInputForReplayEvent(form, replayOriginalEvents))
      .then(hooks?.onSubmit)
      .catch(hooks?.onError);
    return false;
  };
}

function handleReplayEvent(
  form: HTMLFormElement,
  replayOriginalEvents: boolean,
  event: SubmitEvent,
  originalOnSubmit: ((e: SubmitEvent) => void) | null,
): boolean {
  if (replayOriginalEvents) {
    if (form.hasAttribute(piianoControlledAttribute)) {
      originalOnSubmit?.call(form, event);
      form.removeAttribute(piianoControlledAttribute);
      return true;
    }
    form.toggleAttribute(piianoControlledAttribute);
  }
  return false;
}

function manipulateFormInputForReplayEvent(
  form: HTMLFormElement,
  replayOriginalEvents: boolean,
): <T extends ResultType>(r: Result<T>) => Result<T> {
  if (!replayOriginalEvents) {
    return (r) => r;
  }

  return (result) => {
    for (const [field, value] of Object.entries(result)) {
      const oldInput = form.querySelector(`[name="${field}"]`) as HTMLInputElement;
      oldInput.disabled = true;

      const input = document.createElement('input');
      input.name = field;
      input.value = value;
      input.type = 'hidden';
      form.appendChild(input);
    }

    form.requestSubmit();
    return result;
  };
}
