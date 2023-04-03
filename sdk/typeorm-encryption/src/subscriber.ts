import {EntitySubscriberInterface, EventSubscriber, LoadEvent} from 'typeorm';
import {Encryptor} from "./encryptor";

export function CreateDecryptionSubscriber(encryptor: Encryptor): new () => EntitySubscriberInterface {
  @EventSubscriber()
  class VaultDecryptionSubscriber extends DecryptionSubscriber implements EntitySubscriberInterface {
    constructor() { super(encryptor) }
  }

  return VaultDecryptionSubscriber;
}

class DecryptionSubscriber implements EntitySubscriberInterface {

  constructor(private readonly encryptor: Encryptor) {}

  async afterLoad(entity: any, event?: LoadEvent<any>): Promise<any> {
    await this.encryptor.decrypt(
      (event?.metadata.target ||
      event?.metadata.targetName ||
      event?.metadata.name)!, entity);
  }
}
