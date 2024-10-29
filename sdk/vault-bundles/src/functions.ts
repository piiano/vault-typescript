import {Transformation} from "./transformation";
import {Normalizer} from "./normalizer";
import {Validator} from "./validator";
import {Action} from "./action";

export type VaultFunction = (
  | {
  /**
   * Specifies the type of the function, either validator, normalizer, transformer or action.
   */
  type: 'validator',
  /**
   * The function or a reference to the function (but not the name of the function, which would be a string). See Writing a handler for more information.
   */
  handler: Validator,
}
  | {
  /**
   * Specifies the type of the function, either validator, normalizer, transformer or action.
   */
  type: 'transformer',
  /**
   * The function or a reference to the function (but not the name of the function, which would be a string). See Writing a handler for more information.
   */
  handler: Transformation,
}
  | {
  /**
   * Specifies the type of the function, either validator, normalizer, transformer or action.
   */
  type: 'normalizer',
  /**
   * The function or a reference to the function (but not the name of the function, which would be a string). See Writing a handler for more information.
   */
  handler: Normalizer,
} | {
  /**
   * Specifies the type of the function, either validator, normalizer, transformer or action.
   */
  type: 'action',
  /**
   * The function or a reference to the function (but not the name of the function, which would be a string). See Writing a handler for more information.
   */
  handler: Action,
}) & ({
  /**
   * An optional string that describes the function.
   */
  description?: string,
  /**
   * An optional object that specifies the dependencies of the function.
   */
  dependencies?: {
    /**
     * An array of strings that specify the names of the properties that should be provided to the function.
     */
    properties?: string[],
  },
});
