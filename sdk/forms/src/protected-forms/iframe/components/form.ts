import { FieldValidator as FieldProps } from '../../../common/models';
import { Field } from './field';
import { SubmitButton } from './submit-button';
import { useRef } from '../component';
import { applyStrategy, SubmitRequest } from '../../../apply-strategy';
import { ApiError } from '@piiano/vault-client';
import { Sender } from '../../../common/events';
import { Logger } from '../../../common/logger';
import { Infer } from '../../../common/schema';

type FormProps = SubmitRequest & {
  log: Logger;
  sendToParent: Sender;
  fields: Infer<typeof FieldProps>[];
  submitButton?: string;
};

export function Form({ log, sendToParent, fields, submitButton, ...submitOptions }: FormProps) {
  const form = document.createElement('form');
  // we manage validation ourselves. this allows us to show validation errors on submit and not on blur
  form.noValidate = true;
  const touchedRef = useRef(false);
  const fieldElements = fields.map((field) => Field({ touchedRef, ...field }));
  form.append(...fieldElements);
  const validateAll = () =>
    fieldElements.reduce(
      (valid, field) =>
        // don't short circuit, we want to run validate on all fields even if we already have an invalid one
        field.validate() && valid,
      true,
    );

  if (submitButton) {
    form.appendChild(SubmitButton({ submitButton }));
  }

  form.onsubmit = (e) => {
    e.preventDefault();
    touchedRef.current = true;

    if (!validateAll()) {
      sendToParent('error', {
        type: 'validation',
        message: 'Form validation failed',
        context: Object.fromEntries(
          ([...form.elements] as HTMLInputElement[])
            .filter((i) => i.validationMessage)
            .map((i: HTMLInputElement) => [i.name, i.validationMessage]),
        ),
      });
      return false;
    }

    const formData = new FormData(form);
    const object = Object.fromEntries(formData.entries());
    form.classList.add('submitting');
    log('Send request to vault');
    applyStrategy(object, submitOptions)
      .then((result) => {
        log('Received response from vault');
        sendToParent('submit', result);
      })
      .catch((err) => {
        log('Received error from vault', err);
        if (err instanceof ApiError) {
          err = { type: 'vault', ...err.body };
        } else if (err instanceof Error) {
          err = { type: 'network', message: err.message };
        }
        sendToParent('error', err);
      })
      .finally(() => {
        form.classList.remove('submitting');
      });
    return false;
  };

  return form;
}
