import { component } from '../../../common/component';
import { Result } from '../index';
import { DisplayOptions } from '../../../common/models';
import { followPath } from '../../../common/paths';
import { Sender } from '../../../common/events';

export const View = component(
  (keyPrefix, { result, display, sendToParent }: { result: Result; display: DisplayOptions; sendToParent: Sender }) => {
    const view = document.createElement('div');
    view.classList.add('view');
    const value = result.strategy === 'invoke-action' ? result.response : result.objects;
    const values = display.map(({ path, format, label, clickToCopy, class: className }) =>
      DisplayValue(`${keyPrefix}/${path}`, { value, path, format, label, clickToCopy, className, sendToParent }),
    );
    view.replaceChildren(...values);
    return view;
  },
);

type DisplayValueProps = {
  sendToParent?: Sender;
  path?: string;
  format?: string;
  value: unknown;
  label?: string;
  clickToCopy?: boolean;
  className?: string;
};

const DisplayValue = component(
  (keyPrefix, { value: rootValue, label, path, format, className, clickToCopy, sendToParent }: DisplayValueProps) => {
    const container = document.createElement('div');
    if (className) container.className = className;
    if (path) container.setAttribute('data-path', path);

    const value = followPath(rootValue, path);
    const children: Node[] = [];
    if (label) children.push(Label(`${keyPrefix}/label`, { label }));

    const cleanupFunctions: (() => void)[] = [];

    switch (typeof value) {
      case 'string':
      case 'number':
      case 'boolean': {
        const span = document.createElement('span');
        span.innerText = formatValue(value, format);

        if (path && sendToParent) {
          const mouseEnterHandler = (event: MouseEvent) => {
            const rect = span.getBoundingClientRect();
            sendToParent('mouseenter', { path, rect, mouseX: event.clientX, mouseY: event.clientY });
          };
          const mouseLeaveHandler = (event: MouseEvent) => {
            const rect = span.getBoundingClientRect();
            sendToParent('mouseleave', { path, rect, mouseX: event.clientX, mouseY: event.clientY });
          };
          const clickHandler = (event: MouseEvent) => {
            if (clickToCopy) copy(String(value));
            const rect = span.getBoundingClientRect();
            sendToParent('click', { path, rect, mouseX: event.clientX, mouseY: event.clientY });
          };

          span.addEventListener('mouseenter', mouseEnterHandler);
          span.addEventListener('mouseleave', mouseLeaveHandler);
          span.addEventListener('click', clickHandler);
          cleanupFunctions.push(
            () => span.removeEventListener('mouseenter', mouseEnterHandler),
            () => span.removeEventListener('mouseleave', mouseLeaveHandler),
            () => span.removeEventListener('click', clickHandler),
          );
        }

        children.push(span);
        break;
      }
      case 'object':
        if (value === null) break;

        if (Array.isArray(value)) {
          children.push(
            ...value.map((item, index) =>
              DisplayValue(`${keyPrefix}/value-${index}`, { value: item, format, clickToCopy }),
            ),
          );
          break;
        }

        const object = document.createElement('div');
        object.replaceChildren(
          ...Object.entries(value).map(([key, item]) =>
            DisplayValue(`${keyPrefix}/value-${key}`, { value: item, format, label: key, clickToCopy }),
          ),
        );
        children.push(object);
    }

    container.replaceChildren(...children);
    return Object.assign(container, {
      unmount: () => {
        cleanupFunctions.forEach((fn) => fn());
      },
    });
  },
);

const Label = component((_, { label }: { label: string }) => {
  const labelElement = document.createElement('label');
  labelElement.innerText = label;
  return labelElement;
});

function copy(value: string) {
  if ('clipboard' in navigator && 'writeText' in navigator.clipboard) {
    navigator.clipboard.writeText(value).catch(() => void 0);
    return;
  }

  const input = document.createElement('textarea');
  input.value = value;
  input.style.opacity = '0';
  input.style.position = 'absolute';
  input.style.pointerEvents = 'none';
  input.style.zIndex = '-1';
  input.style.width = '0';
  input.style.height = '0';
  input.style.overflow = 'hidden';
  input.style.top = '0';
  input.style.left = '0';
  document.body.appendChild(input);
  input.focus();
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
}

function formatValue(value: string | number | boolean, format?: string): string {
  const stringValue = String(value);
  if (!format) return stringValue;

  let formattedValue = '';

  let valueIndex = 0;
  for (let i = 0; i < format.length; i++) {
    const char = format[i];
    switch (char) {
      case '#':
        formattedValue += stringValue[valueIndex] ?? '';
        valueIndex++;
        break;
      case '*':
      case '•':
        formattedValue += valueIndex < stringValue.length ? char : '';
        valueIndex++;
        break;
      case '~':
        valueIndex++;
        break;
      default:
        formattedValue += char;
    }
  }

  return formattedValue;
}
