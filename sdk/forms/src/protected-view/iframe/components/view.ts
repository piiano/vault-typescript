import { ObjectFields } from '@piiano/vault-client';
import { component } from '../../../common/component';
import { Result } from '../index';

export const View = component(({ result }: { result: Result }) => {
  const view = document.createElement('div');
  view.classList.add('view');
  switch (result.strategy) {
    case 'read-objects':
      view.replaceChildren(...result.objects.map((object) => ObjectView({ object })));
      break;
    case 'invoke-action':
      view.replaceChildren(FieldValue({ value: result.response }));
      break;
  }
  return view;
});

const ObjectView = component(({ object }: { object: ObjectFields }): HTMLDivElement => {
  const container = document.createElement('div');
  container.classList.add('object');
  container.replaceChildren(
    ...Object.entries(object)
      .filter(([name]) => name !== 'id' && !name.startsWith('_'))
      .map(([name, value]) => ObjectField({ name, value })),
  );

  return container;
});

const ObjectField = component(({ name, value }: { name: string; value: unknown }): HTMLDivElement => {
  const field = document.createElement('div');
  field.classList.add('field');
  field.setAttribute('data-name', name);
  field.replaceChildren(FieldLabel({ name }), FieldValue({ value }));
  return field;
});

const FieldLabel = component(({ name }: { name: string }) => {
  const labelElement = document.createElement('label');
  labelElement.innerText = name;
  return labelElement;
});

const FieldValue = component(({ value }: { value: unknown }): HTMLElement => {
  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
      const span = document.createElement('span');
      span.classList.add('value');
      span.innerText = String(value);
      return span;
    case 'object':
      const objectElement = ObjectView({ object: value as ObjectFields });
      objectElement.classList.add('value');
      return objectElement;
  }
  throw new Error(`Unsupported value type: ${typeof value}`);
});
