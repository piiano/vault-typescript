export function getElement<T extends HTMLElement>(elementOrSelector: string | T, elementType: string): T {
  const element =
    typeof elementOrSelector === 'string' ? document.querySelector<T>(elementOrSelector) : elementOrSelector;

  // assert that container is found and is a div element
  if (element === null) {
    throw Error(`Failed to select element using the "${elementOrSelector}" selector.`);
  }

  // assert that element is an HTMLElement
  if (!(element instanceof HTMLElement)) {
    throw Error(`Selected element must be an HTMLElement but found "${typeof element}"`);
  }

  if (element.tagName !== elementType.toUpperCase()) {
    throw Error(`Selected element must be a "${elementType}" but found "${element.tagName.toLowerCase()}"`);
  }

  return element;
}
