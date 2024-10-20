import { FieldValidator as FieldOptions } from '../../../common/models';
import { Input } from './input';
import { Label } from './label';
import { ValidationMessage } from './validation-message';
import { Ref } from '../component';
import { Infer } from '../../../common/schema';

type FieldProps = Infer<typeof FieldOptions> & {
  touchedRef: Ref<boolean>;
};

type FieldComponent = HTMLDivElement & {
  validate: () => boolean;
};

export function Field({ name, label, touchedRef, ...inputProps }: FieldProps): FieldComponent {
  const field = document.createElement('div');
  field.classList.add('field');
  field.setAttribute('data-name', name);

  if (label) field.appendChild(Label({ label, inputName: name }));

  const validationMessageId = `${name}-validation-message`;
  const validationMessage = ValidationMessage({ validationMessageId });
  const setValidationMessage = (message: string) => {
    if (!touchedRef.current) return;
    validationMessage.set(message);
    field.classList.add('invalid');
  };
  const clearValidationMessage = () => {
    validationMessage.clear();
    field.classList.remove('invalid');
  };

  const input = Input({
    name,
    touchedRef,
    validationMessageId,
    setValidationMessage,
    clearValidationMessage,
    ...inputProps,
  });
  field.appendChild(input);
  field.appendChild(validationMessage);

  return Object.assign(field, { validate: input.validate });
}
