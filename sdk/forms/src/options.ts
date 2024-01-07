import type { Reason } from '@piiano/vault-client';

export type VaultConnectionOptions = {
  vaultURL: string;
  apiKey: string;
};

export type ProtectedFormOptions<T extends ResultType> = SubmitOptions<T> &
  VaultConnectionOptions & {
    fields: Array<Field>;
    submitButton?: string;
    debug?: boolean;
    hooks?: Hooks<T>;
    style?: Style;
  };

export type ControlFormOptions<T extends ResultType> = SubmitOptions<T> &
  VaultConnectionOptions & {
    /**
     * After the vault tokenize/encrypt the form fields on form submission, this option will re-trigger the original form submit event handler with the tokenized/encrypted values.
     * This option will manipulate the form inputs, to hold the tokenized/encrypted values, while still displaying the original values.
     */
    replayOriginalEvents?: boolean;
    hooks?: Hooks<T>;
  };

export type ResultType = 'object' | 'fields';
export type Result<T extends ResultType> = T extends 'object' ? string : Record<string, string>;
export type Strategy<T extends ResultType> = Exclude<`${'tokenize' | 'store' | 'encrypt'}-${T}`, 'store-fields'>;

export type SubmitOptions<T extends ResultType> = {
  strategy?: Strategy<T>;
  globalVaultIdentifiers?: boolean;
  collection: string;
  tenantId?: string;
  reason?: Reason;
};

export type IframeOptions<T extends ResultType> = Omit<ProtectedFormOptions<T>, 'hooks'>;

export type Field = {
  name: string;
  data_type_name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
};

export type Hooks<T extends ResultType> = {
  onSubmit?: (result: Result<T>) => void;
  onError?: (error: Error) => void;
};

export type Style = {
  theme?: Theme;
  variables?: StyleVariables;
  css?: string;
};

export type StyleVariables = {
  primary?: string;
  primaryDark?: string;
  background?: string;
  focusBackground?: string;
  placeholderColor?: string;
  borderColor?: string;
};

export type Theme = 'none' | 'default' | 'floating-label';
