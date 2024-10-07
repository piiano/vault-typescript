export type ValidationMessageProps = {
  validationMessageId: string;
};

export type ValidationMessageComponent = HTMLSpanElement & {
  set: (message: string) => void;
  clear: () => void;
};

export function ValidationMessage({ validationMessageId }: ValidationMessageProps): ValidationMessageComponent {
  const validationMessage = document.createElement('span');
  validationMessage.id = validationMessageId;
  validationMessage.classList.add('validation-message');

  return Object.assign(validationMessage, {
    set: (message: string) => (validationMessage.innerText = message),
    clear: () => (validationMessage.innerText = ''),
  });
}
