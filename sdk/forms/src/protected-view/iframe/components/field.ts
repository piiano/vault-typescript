import { Label } from './label';
import { ObjectFields } from '@piiano/vault-client';

type ObjectViewProps = {
  object: ObjectFields;
};

export function ObjectView({ object }: ObjectViewProps): HTMLDivElement {
  const container = document.createElement('div');
  container.classList.add('object');
  if (object.id) container.setAttribute('data-id', object.id);

  Object.entries(object)
    .filter(([name]) => name !== 'id' && !name.startsWith('_'))
    .forEach(([name, value]) => {
      container.appendChild(ObjectField({ name, value }));
    });

  return container;
}

export function ObjectField({ name, value }: { name: string; value: unknown }): HTMLDivElement {
  const field = document.createElement('div');
  field.classList.add('field');
  field.setAttribute('data-name', name);
  field.appendChild(Label({ name }));
  field.appendChild(ObjectValue({ name, value }));

  return field;
}

export function ObjectValue({ name, value }: { name: string; value: unknown }): HTMLElement {
  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
      const span = document.createElement('span');
      span.id = name;
      span.classList.add('value');
      span.innerText = String(value);
      return span;
    case 'object':
      if (Array.isArray(value)) {
        const container = document.createElement('div');
        container.classList.add('array');
        value.forEach((item, index) => {
          container.appendChild(ObjectValue({ name: `${name}[${index}]`, value: item }));
        });
        return container;
      }
      return ObjectView({ object: value as ObjectFields });
  }
  throw new Error(`Unsupported value type: ${typeof value}`);
}
