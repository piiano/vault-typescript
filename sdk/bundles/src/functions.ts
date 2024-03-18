import {Transformation} from "./transformation";
import {Normalizer} from "./normalizer";
import {Validator} from "./validator";

export type FunctionConfig = (
  | {
  /**
   * Specifies the type of the function, either validator, normalizer, or transformation.
   */
  type: 'validator',
  /**
   * The function or a reference to the function (but not the name of the function, which would be a string). See Writing a handler for more information.
   */
  handler: Validator,
}
  | {
  /**
   * Specifies the type of the function, either validator, normalizer, or transformation.
   */
  type: 'transformation',
  /**
   * The function or a reference to the function (but not the name of the function, which would be a string). See Writing a handler for more information.
   */
  handler: Transformation,
}
  | {
  /**
   * Specifies the type of the function, either validator, normalizer, or transformation.
   */
  type: 'normalizer',
  /**
   * The function or a reference to the function (but not the name of the function, which would be a string). See Writing a handler for more information.
   */
  handler: Normalizer,
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
    /**
     * An array of strings specifying the hosts the function can access using the _httpGet method.
     * Each value in the array must be a valid HTTP or HTTPS URI, such as "http://example.com".
     */
    http_get_access?: string[],
    /**
     * An array of strings specifying the hosts the function can access using the _httpPost method.
     * Each value in the array must be a valid HTTP or HTTPS URI, such as "http://example.com".
     */
    http_post_access?: string[],
  },
});
