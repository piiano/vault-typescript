import { component } from '../../../common/component';
import { Result } from '../index';
import { DisplayOptions } from '../../../common/models';
import { followPath } from '../../../common/paths';
import { Sender } from '../../../common/events';

export const View = component(
  ({ result, display, sendToParent }: { result: Result; display: DisplayOptions; sendToParent: Sender }) => {
    const view = document.createElement('div');
    view.classList.add('view');
    const value = result.strategy === 'invoke-action' ? result.response : result.objects;
    const values = display.map(({ path, label, clickToCopy, clickToReveal, class: className }) =>
      DisplayValue({ value, path, label, clickToCopy, clickToReveal, className, sendToParent }),
    );
    view.replaceChildren(...values);
    return view;
  },
);

type DisplayValueProps = {
  sendToParent: Sender;
  path?: string;
  value: unknown;
  label?: string;
  clickToCopy?: boolean;
  clickToReveal?: boolean;
  className?: string;
};

const DisplayValue = component(
  ({ value: rootValue, label, path, className, clickToCopy, clickToReveal, sendToParent }: DisplayValueProps): Node => {
    const container = document.createElement('div');
    if (className) container.className = className;
    if (path) container.setAttribute('data-path', path);

    const value = followPath(rootValue, path);
    const children: Node[] = [];
    if (label) children.push(Label({ label }));

    switch (typeof value) {
      case 'string':
      case 'number':
      case 'boolean': {
        if (clickToCopy || clickToReveal) {
          const div = document.createElement('div');
          div.classList.add('tooltip');
          div.innerText = String(value);
          const tooltip = document.createElement('span');
          tooltip.classList.add('tooltip-text');
          tooltip.innerText = clickToReveal ? 'Click to reveal' : 'Click to copy';
          div.appendChild(tooltip);
          div.addEventListener('click', () => {
            if (clickToCopy) {
              navigator.clipboard.writeText(String(value));
            }
            sendToParent('click', {
              path,
              reason: clickToReveal ? 'reveal' : 'copy',
            });
          });
          container.appendChild(div);
          children.push(div);
        } else {
          const span = document.createElement('span');
          span.innerText = String(value);
          container.appendChild(span);
          children.push(span);
        }
        break;
      }
      case 'object':
        if (value === null) break;

        if (Array.isArray(value)) {
          children.push(...value.map((item, index) => DisplayValue({ value: item, clickToCopy, clickToReveal, sendToParent})));
          break;
        }

        const object = document.createElement('div');
        object.replaceChildren(
          ...Object.entries(value).map(([key, item]) =>
            DisplayValue({ value: item, label: key, clickToCopy, clickToReveal, sendToParent }),
          ),
        );
        children.push(object);
    }

    container.replaceChildren(...children);
    return container;
  },
);

const Label = component(({ label }: { label: string }) => {
  const labelElement = document.createElement('label');
  labelElement.innerText = label;
  return labelElement;
});
