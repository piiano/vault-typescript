import { Vault } from "./vault";

/**
 * An object that describes the context in which the action is invoked.
 */
export interface ActionContext {
  /**
   * The name of the user making the request.
   */
  user: string;
  /**
   * The name of the role of the user making the request.
   */
  role: string;
  /**
   * The reason specified in the request.
   */
  reason: string;
  /**
   * The HTTP request body of the invoke action API request serialized from JSON as a JavaScript object.
   */
  body: unknown;
  /**
   * A vault object that exposes methods to be used with Vault API from the action.
   * The vault object expose a subset of the Vault JS SDK.
   */
  vault: Vault;
}

/**
 * An action function is invoked when using the actions API.
 * The return value of the function will be serialized as JSON and returned as the response of the action API.
 *
 * The action function can be synchronous or asynchronous.
 * If it returns a Promise, the action API will wait for the promise to resolve before sending the response.
 */
export type Action = (context: ActionContext) => unknown | Promise<unknown>;
