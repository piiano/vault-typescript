import {CollectionsClient, ObjectsClient} from "./generated";

export type Reason = Parameters<ObjectsClient['addObject']>[0]['reason'];
export type CollectionFormat = Parameters<CollectionsClient['getCollection']>[0]['format'];

