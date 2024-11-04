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
    const values = display.map(({ path, label, clickToCopy, class: className }) =>
      DisplayValue()({ value, path, label, clickToCopy, className, sendToParent }),
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
  className?: string;
};

const DisplayValue = () =>
  component(({ value: rootValue, label, path, className, clickToCopy, sendToParent }: DisplayValueProps) => {
    const container = document.createElement('div') as HTMLDivElement & { unmount?: () => void };
    if (className) container.className = className;
    if (path) container.setAttribute('data-path', path);

    const value = followPath(rootValue, path);
    const children: Node[] = [];
    if (label) children.push(Label({ label }));

    const mouseEnterHandler = (event: MouseEvent) => {
      sendToParent('mouseenter', {
        path,
        x: event.clientX,
        y: event.clientY,
      });
    };
    const mouseLeaveHandler = () => {
      sendToParent('mouseleave', {
        path,
      });
    };
    const clickHandler = () => {
      if (clickToCopy) {
        window.getSelection()?.selectAllChildren(container);
        document.execCommand('copy');
      }
      sendToParent('click', {
        path,
      });
    };

    switch (typeof value) {
      case 'string':
      case 'number':
      case 'boolean': {
        const span = document.createElement('span');
        span.innerText = String(value);
        container.appendChild(span);
        children.push(span);
        container.addEventListener('mouseenter', mouseEnterHandler);
        container.addEventListener('mouseleave', mouseLeaveHandler);
        container.addEventListener('click', clickHandler);
        break;
      }
      case 'object':
        if (value === null) break;

        if (Array.isArray(value)) {
          children.push(
            ...value.map((item, index) =>
              DisplayValue()({ path: `${path}[${index}]`, value: item, clickToCopy, sendToParent }),
            ),
          );
          break;
        }

        const object = document.createElement('div');
        object.replaceChildren(
          ...Object.entries(value).map(([key, item]) =>
            DisplayValue()({
              path: `${path}[${JSON.stringify(key)}]`,
              value: item,
              label: key,
              clickToCopy,
              sendToParent,
            }),
          ),
        );
        children.push(object);
    }

    container.replaceChildren(...children);
    container.unmount = () => {
      container.removeEventListener('mouseenter', mouseEnterHandler);
      container.removeEventListener('mouseleave', mouseLeaveHandler);
      container.removeEventListener('click', clickHandler);
    };
    return container;
  });

const Label = component(({ label }: { label: string }) => {
  const labelElement = document.createElement('label');
  labelElement.innerText = label;
  return labelElement;
});
