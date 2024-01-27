import { InitOptions } from './protected-forms/common/models';

export type ProtectedFormOptions<T extends ResultType> = Omit<InitOptions, 'strategy'> & {
  // we omit the strategy from init options and declare it here, so we can infer the result type from it.
  strategy?: Strategy<T>;
  hooks?: Hooks<T>;
};

export type ControlFormOptions<T extends ResultType> = Pick<
  InitOptions,
  'globalVaultIdentifiers' | 'collection' | 'tenantId' | 'reason' | 'vaultURL' | 'apiKey'
> & {
  // we omit the strategy from init options and declare it here, so we can infer the result type from it.
  strategy?: Strategy<T>;
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

export type SubmitOptions<T extends ResultType> = Pick<
  InitOptions,
  'globalVaultIdentifiers' | 'collection' | 'tenantId' | 'reason'
> & {
  strategy?: Strategy<T>;
};

export type IframeOptions<T extends ResultType> = Omit<ProtectedFormOptions<T>, 'hooks'>;

export type Hooks<T extends ResultType> = {
  onSubmit?: (result: Result<T>) => void;
  onError?: (error: Error) => void;
};
