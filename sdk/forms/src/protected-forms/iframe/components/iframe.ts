import { IframeOptions, ResultType } from '../../../options';
import { sendSizeEvents } from '../../../common/size';
import { VaultClient } from '@piiano/vault-client';
import { Form } from './form';
import type { Sender } from '../../../common/events';
import type { Logger } from '../../../common/logger';
import type { Style } from '../../../common/models';

export function renderForm(
  log: Logger,
  sendToParent: Sender,
  { vaultURL, apiKey, fields, submitButton, style, ...submitOptions }: IframeOptions<ResultType>,
) {
  const client = new VaultClient({ apiKey, vaultURL });
  applyStyle(style);
  const form = Form({ log, sendToParent, fields, submitButton, ...submitOptions, client });
  document.body.appendChild(form);
  sendSizeEvents(sendToParent, 'content-size', form);
  return form;
}

export function updateForm(
  log: Logger,
  sendToParent: Sender,
  oldForm: HTMLFormElement,
  oldStyle: Style | undefined,
  { vaultURL, apiKey, fields, submitButton, style, ...submitOptions }: IframeOptions<ResultType>,
) {
  const client = new VaultClient({ apiKey, vaultURL });
  const newForm = Form({ log, sendToParent, fields, submitButton, ...submitOptions, client });
  new FormData(oldForm).forEach((value, key) => {
    if (key in newForm.elements) {
      newForm[key].value = value;
    }
  });

  document.body.removeChild(oldForm);
  removeStyle(oldStyle);
  applyStyle(style);
  document.body.appendChild(newForm);

  sendSizeEvents(sendToParent, 'content-size', newForm);
  return newForm;
}

function applyStyle({ theme, css, variables }: Partial<Style> = {}) {
  if (css) {
    const style = document.createElement('style');
    style.id = 'iframe-style';
    style.innerText = css;
    document.body.prepend(style);
  }
  if (theme) {
    document.body.classList.add(theme);
  }
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
  }
}

function removeStyle({ theme, css, variables }: Partial<Style> = {}) {
  if (css) {
    document.getElementById('iframe-style')?.remove();
  }
  if (theme) {
    document.body.classList.remove(theme);
  }
  if (variables) {
    Object.entries(variables).forEach(([key]) => {
      document.documentElement.style.removeProperty(`--${key}`);
    });
  }
}
