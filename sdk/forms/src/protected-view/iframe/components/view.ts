import { ObjectView } from './field';
import { ObjectFields } from '@piiano/vault-client';

type ViewProps = {
  objects: Array<ObjectFields>;
};

export function View({ objects }: ViewProps) {
  const view = document.createElement('div');
  view.classList.add('view');
  // we manage validation ourselves. this allows us to show validation errors on submit and not on blur
  const objectsElements = objects.map((object) => ObjectView({ object }));
  view.append(...objectsElements);
  return view;
}
