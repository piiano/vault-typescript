import type { Result, ResultType, SubmitOptions } from './options';
import type { VaultClient } from '@piiano/vault-client';

export type SubmitRequest<T extends ResultType = ResultType> = SubmitOptions<T> & {
  client: VaultClient;
};

export async function applyStrategy<T extends ResultType = 'fields'>(
  object: Record<string, FormDataEntryValue>,
  { strategy, ...options }: Omit<SubmitRequest<T>, 'object'>,
): Promise<Result<T>> {
  switch (strategy ?? 'tokenize-fields') {
    case 'store-object':
      return (await storeObject(object, options)) as Result<T>;
    case 'tokenize-object':
      return (await tokenizeObject(object, options)) as Result<T>;
    case 'tokenize-fields':
      return (await tokenizeFields(object, options)) as Result<T>;
    case 'encrypt-fields':
      return (await encryptFields(object, options)) as Result<T>;
    case 'encrypt-object':
      return (await encryptObject(object, options)) as Result<T>;
  }
  throw new Error(`Unknown strategy "${strategy}"`);
}

async function storeObject(
  object: Record<string, FormDataEntryValue>,
  {
    client,
    collection,
    tenantId,
    globalVaultIdentifiers = true,
    reason = 'AppFunctionality',
    expiration,
  }: SubmitRequest<'object'>,
) {
  const { id } = await client.objects.addObject({
    reason,
    collection,
    requestBody: object,
    xTenantId: tenantId ? [tenantId] : undefined,
    expirationSecs: asExpirationSecs(expiration),
  });

  return result(collection, 'read_object', id, globalVaultIdentifiers);
}

async function tokenizeObject(
  object: Record<string, FormDataEntryValue>,
  {
    client,
    collection,
    tenantId,
    globalVaultIdentifiers = true,
    reason = 'AppFunctionality',
    expiration,
  }: SubmitRequest<'object'>,
) {
  const [{ token_id }] = await client.tokens.tokenize({
    reason,
    collection,
    requestBody: [
      {
        object: { fields: object },
        type: 'pci',
        props: Object.keys(object),
      },
    ],
    expirationSecs: asExpirationSecs(expiration),
    xTenantId: tenantId ? [tenantId] : undefined,
  });

  return result(collection, 'detokenize', token_id, globalVaultIdentifiers);
}

async function tokenizeFields(
  object: Record<string, FormDataEntryValue>,
  {
    client,
    collection,
    tenantId,
    globalVaultIdentifiers = true,
    reason = 'AppFunctionality',
    expiration,
  }: SubmitRequest<'fields'>,
) {
  const fields = Object.entries(object);
  const tokens = await client.tokens.tokenize({
    reason,
    collection,
    xTenantId: tenantId ? [tenantId] : undefined,
    expirationSecs: asExpirationSecs(expiration),
    requestBody: fields.map(([field, value]) => ({
      object: { fields: { [field]: value } },
      type: 'pci',
      props: [field],
    })),
  });

  return Object.fromEntries(
    fields.map(([field], index) => [
      field,
      result(collection, 'detokenize', tokens[index].token_id, globalVaultIdentifiers, field),
    ]),
  );
}

async function encryptFields(
  object: Record<string, FormDataEntryValue>,
  {
    client,
    collection,
    tenantId,
    globalVaultIdentifiers = true,
    reason = 'AppFunctionality',
    expiration,
  }: SubmitRequest<'fields'>,
) {
  const fields = Object.entries(object);
  const encryptedFields = await client.crypto.encrypt({
    reason,
    collection,
    expirationSecs: asExpirationSecs(expiration),
    requestBody: fields.map(([field, value]) => ({
      object: {
        fields: {
          // add the tenantId to the encrypted object
          // TODO: add support to the vault to enforce tenantId on encrypted fields on decryption
          _tenant_id: tenantId,
          [field]: value,
        },
      },
      props: [field],
    })),
  });

  return Object.fromEntries(
    fields.map(([field], index) => [
      field,
      result(collection, 'decrypt_object', encryptedFields[index].ciphertext, globalVaultIdentifiers, field),
    ]),
  );
}

async function encryptObject(
  object: Record<string, FormDataEntryValue>,
  {
    client,
    collection,
    tenantId,
    globalVaultIdentifiers,
    reason = 'AppFunctionality',
    expiration,
  }: SubmitRequest<'object'>,
) {
  const [{ ciphertext }] = await client.crypto.encrypt({
    reason,
    collection,
    expirationSecs: asExpirationSecs(expiration),
    requestBody: [
      {
        object: {
          fields: {
            ...object,
            // add the tenantId to the encrypted object
            // TODO: add support to the vault to enforce tenantId on encrypted fields on decryption
            _tenant_id: tenantId,
          },
        },
      },
    ],
  });

  return result(collection, 'decrypt_object', ciphertext, globalVaultIdentifiers);
}

type Operation = 'detokenize' | 'read_object' | 'decrypt_object';

function result(
  collection: string,
  operation: Operation,
  id: string,
  globalVaultIdentifiers = true,
  property?: string,
): string {
  if (globalVaultIdentifiers) {
    return asGlobalVaultIdentifiers(collection, operation, id, property);
  }

  return id;
}

function asGlobalVaultIdentifiers(collection: string, operation: Operation, id: string, property?: string) {
  return `pvlt:${operation}:${collection}:${property ?? ''}:${id}:`;
}

function asExpirationSecs(expiration?: number) {
  return expiration === undefined ? undefined : expiration < 0 ? '' : String(expiration);
}
