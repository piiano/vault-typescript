import { IframeOptions, ResultType } from '../../../options';
import { sendSizeEvents } from '../../common/size';
import { VaultClient } from '@piiano/vault-client';
import { Form } from './form';
import { Sender } from '../../common/events';
import { Logger } from '../../common/logger';
import { StyleValidator } from '../../common/models';
import { Infer } from '../../common/schema';

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

function applyStyle({ theme, css, variables }: Infer<typeof StyleValidator> = {}) {
  if (css) {
    const style = document.createElement('style');
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
