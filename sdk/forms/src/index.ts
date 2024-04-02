import { createProtectedForm } from './protected-forms';
import { controlForm } from './controlled-forms';
import { VaultClient as Client } from '@piiano/vault-client';

export type * from '@piiano/vault-client';
export type * from './options';
export type * from './controlled-forms';
export type * from './protected-forms';

export { createProtectedForm, controlForm, Client };
