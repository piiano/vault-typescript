import {type Reason, VaultClient} from "@piiano/vault-client";

const usePiianoProxyOptions = 'data-piiano-proxy-options';

document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll(`[${usePiianoProxyOptions}]`);
  console.log(forms)
  for (const form of forms) {
    const options = JSON.parse(form.getAttribute(usePiianoProxyOptions) ?? '{}');
    console.log(options)
    configForm({
      ...options,
      form,
    }).then(() => {
      console.log('Piiano form set');
    }).catch(e => console.error('Failed setting Piiano form', e));
  }
});

type ConfigFormOptions = {
  vaultURL: string;
  reason?: Reason;
  collection: string;
  form: string | HTMLFormElement;
  tenantId?: string;
  hijack?: boolean;
  strategy: 'single-token' | 'multi-token' | 'object';
  apiKey?: string | Promise<string> | (() => Promise<string>) | (() => string);
  onSubmit?: (id: any) => void;
}

const configForm = async ({
                            form,
                            strategy,
                            hijack,
                            tenantId,
                            onSubmit,
                            collection,
                            reason,
                            apiKey,
                            vaultURL
                          }: ConfigFormOptions) => {
  const client = new VaultClient({vaultURL, apiKey: await getAPIKey(apiKey)});

  const formElement = typeof form === 'string' ? document.querySelector(form) : form;
  if (formElement === undefined || formElement === null) {
    console.error(`Could not find form with selector ${form}`);
    return;
  }
  if (!(formElement instanceof HTMLFormElement)) {
    console.error(`Selector ${form} does not match a form element`);
    return;
  }

  const originalOnSubmit = formElement.onsubmit;
  formElement.onsubmit = (e: SubmitEvent) => {
    const piianoControlled = 'data-piiano-controlled';
    if (hijack) {
      if (formElement.getAttribute(piianoControlled)) {
        originalOnSubmit?.call(window, e);
        return;
      }
      formElement.setAttribute(piianoControlled, 'true');
    }

    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const object = Object.fromEntries(formData.entries());

    send({strategy, client, reason, collection, object, tenantId}).then(result => {
      if (!hijack) return result;

      for (const [field, value] of Object.entries(result)) {
        const oldInput = formElement.querySelector(`[name="${field}"]`) as HTMLInputElement;
        oldInput.setAttribute('disabled', 'true');

        const input = document.createElement('input');
        input.setAttribute('name', field);
        input.setAttribute('value', value);
        input.setAttribute('type', 'hidden');
        formElement.appendChild(input);
      }

      formElement.submit();
      formElement.dispatchEvent(new Event('submit'));
      return result;
    }).then(r => onSubmit?.(r)).catch(console.error);

    return false;
  };
}

async function getAPIKey(apiKey: string | Promise<string> | (() => Promise<string>) | (() => string) | undefined): Promise<string | undefined> {
  if (typeof apiKey === 'function') {
    apiKey = apiKey();
  }

  return apiKey;
}

async function send({
                      strategy = 'multi-token',
                      object,
                      client,
                      tenantId,
                      reason = 'AppFunctionality',
                      collection
                    }: Omit<ConfigFormOptions, 'form' | 'apiKey' | 'vaultURL' | 'onSubmit'> & {
  client: VaultClient,
  object: Record<string, any>
}) {
  switch (strategy) {
    case 'object':
      return client.objects.addObject({
        reason,
        collection,
        requestBody: object,
        xTenantId: tenantId ? [tenantId] : undefined,
      });
    case 'single-token':
      return client.tokens.tokenize({
        reason,
        collection,
        requestBody: [{
          object: {fields: object},
          type: 'pci',
          props: Object.keys(object),
        }],
        xTenantId: tenantId ? [tenantId] : undefined,
      });
    case 'multi-token':
      const fields = Object.entries(object);
      const tokens = await client.tokens.tokenize({
        reason,
        collection,
        xTenantId: tenantId ? [tenantId] : undefined,
        requestBody: fields.map(([field, value]) => ({
          object: {fields: {[field]: value}},
          type: 'pci',
          props: [field],
        })),
      });
      return Object.fromEntries(fields.map(([field], index) => [field, tokens[index].token_id]));
  }
}

export default configForm;