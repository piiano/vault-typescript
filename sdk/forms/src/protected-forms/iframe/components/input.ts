import { dataTypes } from '../data-types';
import { validations } from '../validations';
import { Ref } from '../component';
import { FieldValidator } from '../../common/models';
import { Infer } from '../../common/schema';

export type InputProps = Omit<Infer<typeof FieldValidator>, 'label'> & {
  touchedRef: Ref<boolean>;
  validationMessageId: string;
  setValidationMessage: (message: string) => void;
  clearValidationMessage: () => void;
};

export type InputComponent = HTMLInputElement & {
  validate: () => boolean;
};

export function Input({
  name,
  placeholder,
  required,
  value,
  dataTypeName,
  validationMessageId,
  setValidationMessage,
  clearValidationMessage,
  touchedRef,
}: InputProps): InputComponent {
  const input = document.createElement('input');
  input.id = name;
  input.name = name;
  input.value = value ?? '';
  input.type = dataTypes[dataTypeName] ?? 'text';
  input.placeholder = placeholder ?? '';
  input.required = required ?? false;
  input.setAttribute('aria-describedby', validationMessageId);
  const validator = validations[dataTypeName];
  const validate = () => {
    if (!touchedRef.current) return true;
    input.setCustomValidity(validator(input.value) || '');
    const valid = input.checkValidity();
    if (valid) {
      clearValidationMessage();
      input.setCustomValidity('');
      return true;
    }

    setValidationMessage(input.validationMessage);
    return false;
  };

  input.oninput = () => {
    validate();
  };
  input.oninvalid = () => {
    setValidationMessage(input.validationMessage);
  };

  return Object.assign(input, { validate });
}
