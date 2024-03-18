
/**
 * An object that describes the context in which the transformer is invoked.
 */
export interface TransformationContext {
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
   * The name of the collection specified in the request.
   */
  collection: string;
  /**
   * An object mapping from the name of each property in the collection to the name of its property type.
   */
  props: Record<string, string>;
  /**
   * The name of the property of which the third argument, value, is an instance.
   */
  prop: string;
  /**
   * An optional string passed in the request's X-Trans-Param custom header.
   */
  param?: string
}

export type Transformation = (
  /**
   * An object that describes the context in which the transformer is invoked.
   */
  context: TransformationContext,
  /**
   * An object in which the key is the name of a property in the collection and the value is the value of that property.
   * Vault populates the map with the names and values of properties where the names are listed in the dependencies.properties array
   * in the exported prototype of the function.
   */
  object: Record<string, unknown>,
  /**
   * The value of the property that is to be transformed.
   */
  value: unknown,
) => unknown;

