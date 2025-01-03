import { array, boolean, type Infer, literal, number, object, oneOf, record, string, unknown } from './schema';

export const StrategyValidator = string().enum(
  /**
   * Tokenize the entire object and return a single token.
   */
  'tokenize-object',
  /**
   * Tokenize each field independently and return a token for each field.
   */
  'tokenize-fields',
  /**
   * Encrypt the entire object and return a single encrypted object ciphertext.
   */
  'encrypt-object',
  /**
   * Encrypt each field independently and return an object with a ciphertext for each field.
   */
  'encrypt-fields',
  /**
   * Store the entire object and return an object ID.
   */
  'store-object',
);
export type Strategy = Infer<typeof StrategyValidator>;

export const ReasonValidator = string().enum(
  'AppFunctionality',
  'Analytics',
  'Notifications',
  'Marketing',
  'ThirdPartyMarketing',
  'FraudPreventionSecurityAndCompliance',
  'AccountManagement',
  'Maintenance',
  'DataSubjectRequest',
  'Other',
);
export type Reason = Infer<typeof ReasonValidator>;

export const FieldValidator = object({
  /**
   * The name of the field as it was defined in the collection in the Vault.
   */
  name: string(),
  /**
   * The type of the field as it was defined in the collection in the Vault.
   */
  dataTypeName: string(),
  /**
   * The label to display for the field.
   */
  label: string().optional(),
  /**
   * The placeholder to display for the field.
   */
  placeholder: string().optional(),
  /**
   * Whether the field is required.
   */
  required: boolean().optional(),
  /**
   * An initial value to set for the field.
   */
  value: string().optional(),
});
export type Field = Infer<typeof FieldValidator>;

export const ThemeValidator = string().enum('none', 'default', 'floating-label');
export type Theme = Infer<typeof ThemeValidator>;

export const VariablesValidator = record(
  string().enum('primary', 'primaryDark', 'background', 'focusBackground', 'placeholderColor', 'borderColor'),
  string().optional(),
);
export type Variables = Infer<typeof VariablesValidator>;

export const StyleValidator = object({
  /**
   * The theme to apply to the form.
   */
  theme: ThemeValidator.optional(),
  /**
   * Custom CSS variables to apply to the form.
   */
  variables: VariablesValidator.optional(),
  /**
   * Custom CSS to apply to the form.
   */
  css: string().optional(),
});
export type Style = Infer<typeof StyleValidator>;

/**
 * The options to use to initialize the form.
 */
export const FormInitOptionsValidator = object({
  /**
   * The URL of the vault to connect to.
   */
  vaultURL: string(),
  /**
   * The API key to use to connect to the vault.
   */
  apiKey: string(),
  /**
   * Print debug information to console. This will not print sensitive information.
   */
  debug: boolean().optional(),
  /**
   * Whether to allow updates to the form after it has been initialized. Default is false.
   */
  allowUpdates: boolean().optional(),
  /**
   * The strategy to use to submit the form.
   */
  strategy: StrategyValidator.optional(),
  /**
   * Whether to use global vault identifiers in returned values.
   */
  globalVaultIdentifiers: boolean().optional(),
  /**
   * The name of the Vault collection to use.
   */
  collection: string(),
  /**
   * Scope the the request to a specific tenant.
   */
  tenantId: string().optional(),
  /**
   * The reason for submitting the form. This will be included to the audit log.
   */
  reason: ReasonValidator.optional(),
  /**
   * The time in seconds for the token/object/ciphertext to expire.
   * If not provided, the default expiration time of the Vault will be used.
   * Set to -1 for no expiration.
   */
  expiration: number().optional(),
  /**
   * With the `tokenize-object` strategy this option will store an object in addition to the token in the Vault.
   * Setting this option to true in any other strategy will have no effect.
   */
  storeObject: boolean().optional(),
  /**
   * The fields to render in the form.
   */
  fields: array(FieldValidator),
  /**
   * The name of the submit button. If provided, a submit button will be rendered.
   * If not provided, the form is expected to be submitted programmatically by the form handler.
   */
  submitButton: string().optional(),
  /**
   * Style options to apply to the form.
   */
  style: StyleValidator.optional(),
});
export type FormInitOptions = Infer<typeof FormInitOptionsValidator>;

export const SizeValidator = object({
  width: number(),
  height: number(),
});
export type Size = Infer<typeof SizeValidator>;

export const FormIframeEventValidator = oneOf(
  /**
   * The init event is sent from the parent to the iframe to initialize the form.
   */
  object({
    event: literal('init'),
    payload: FormInitOptionsValidator,
  }),
  /**
   * The update event is sent from the parent to the iframe to update the form.
   */
  object({
    event: literal('update'),
    payload: FormInitOptionsValidator,
  }),
  /**
   * The submit event is sent from the parent to trigger the form submission programmatically.
   */
  object({
    event: literal('submit'),
  }),
  /**
   * The container-size event is sent from the iframe to the parent to notify the iframe with its parent container size.
   */
  object({
    event: literal('container-size'),
    payload: SizeValidator,
  }),
);
export type FormIframeEvent = Infer<typeof FormIframeEventValidator>;

/**
 * Options for the read-objects strategy to fetch objects from the Vault and show them in the view.
 */
const ReadObjectStrategyOptionsValidator = object({
  /**
   * The type of the strategy.
   */
  type: literal('read-objects'),
  /**
   * The name of the Vault collection to use.
   */
  collection: string(),
  /**
   * The reason param to be set with API calls that will be included in the audit log.
   */
  reason: ReasonValidator.optional(),
  /**
   * The ids of objects to fetch from the Vault and show in the view.
   */
  ids: array(string()),
  /**
   * The props to fetch for each object and show in the view.
   */
  props: array(string()),
  /**
   * An extra transformation param to be sent to the Vault and be available in the transformation functions.
   * When multiple parameters are needed, they can be passed as a JSON string and parsed in the transformation functions.
   */
  transformationParam: string().optional(),
});

export type ReadObjectStrategyOptions = Infer<typeof ReadObjectStrategyOptionsValidator>;

/**
 * Options for the invoke-action strategy to invoke actions in the Vault and show the result in the view.
 */
const InvokeActionStrategyOptionsValidator = object({
  /**
   * The type of the strategy.
   */
  type: literal('invoke-action'),
  /**
   * The name of the Vault action to invoke.
   */
  action: string(),
  /**
   * The reason param to be set with API calls that will be included in the audit log.
   */
  reason: ReasonValidator.optional(),
  /**
   * Input to be sent to the action.
   * This input will be available in the action JS code for processing.
   */
  input: record(string(), unknown()).optional(),
});

export type InvokeActionStrategyOptions = Infer<typeof InvokeActionStrategyOptionsValidator>;

const DisplayOptionsValidator = array(
  object({
    /**
     * The path to the key in the returned object to display. Use dot notation for nested keys (e.g. `address.city`).
     */
    path: string(),
    /**
     * The label to display for the key.
     * If not provided, no label will be displayed.
     */
    label: string().optional(),
    /**
     * Whether the value supports click-to-copy functionality.
     */
    clickToCopy: boolean().optional(),
    /**
     * CSS class to apply to the value.
     */
    class: string().optional(),
    /**
     * A format pattern to apply to the value.
     * The format pattern supports the following tokens:
     * - `#` for showing a character if present.
     * - `*` or `•` for masking a character if present.
     * - `~` for skipping a character if present.
     * - Any other character in the pattern will be displayed as is in between the original value characters.
     *
     * For example, given a value of: `abc123456`
     * and a pattern of: `(###) ** ~~##`
     * the value will be displayed as: `(abc) ** 56`.
     *
     * If a format is provided for a non-primitive value (object or array), the format will be applied to each of the nested primitive values of the object or array.
     */
    format: string().optional(),
  }),
);

export type DisplayOptions = Infer<typeof DisplayOptionsValidator>;

/**
 * The options to use to initialize the protected view.
 */
export const ViewInitOptionsValidator = object({
  /**
   * The URL of the vault to connect to.
   */
  vaultURL: string(),
  /**
   * The API key to use to connect to the vault.
   */
  apiKey: string(),
  /**
   * Print debug information to console. This will not print sensitive information.
   */
  debug: boolean().optional(),
  /**
   * Whether to allow the view to rerender after it has been initialized. Default is false.
   */
  dynamic: boolean().optional(),
  /**
   * The strategy to use to fetch information from the Vault and show it in the view.
   */
  strategy: oneOf(ReadObjectStrategyOptionsValidator, InvokeActionStrategyOptionsValidator),
  /**
   * Configuration for the display of the data in view.
   */
  display: DisplayOptionsValidator,
  /**
   * Custom CSS to apply to the form.
   */
  css: string().optional(),
});

export type ViewInitOptions = Infer<typeof ViewInitOptionsValidator>;

export const ViewIframeEventValidator = oneOf(
  /**
   * The init event is sent from the parent to the iframe to initialize the form.
   */
  object({
    event: literal('init'),
    payload: ViewInitOptionsValidator,
  }),
  /**
   * The update event is sent from the parent to the iframe to update the form.
   */
  object({
    event: literal('update'),
    payload: ViewInitOptionsValidator,
  }),
  /**
   * The container-size event is sent from the iframe to the parent to notify the iframe with its parent container size.
   */
  object({
    event: literal('container-size'),
    payload: SizeValidator,
  }),
  /**
   * Trigger a copy event on a field.
   * Notice this event will also move the focus to the view.
   */
  object({
    event: literal('copy'),
    payload: object({
      /**
       * The field path to copy.
       */
      path: string(),

      /**
       * For security reasons, the event key must be provided to allow the copy event.
       */
      trustedEventKey: string().optional(),
    }),
  }),
);
export type ViewIframeEvent = Infer<typeof ViewInitOptionsValidator>;
