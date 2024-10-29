
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
}

/**
 * An action function is invoked when using the actions API.
 * The params argument is the JSON value sent as body to the actions API and the return value of the function will be serialized as JSON and returned as the response of the action API.
 *
 * The action function can be synchronous or asynchronous.
 * If it returns a Promise, the action API will wait for the promise to resolve before sending the response.
 */
export type Action = (context: ActionContext, params: unknown) => unknown | Promise<unknown>;
