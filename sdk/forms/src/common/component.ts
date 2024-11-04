export function component<P extends object, E extends Node & { unmount?: () => void }>(
  renderer: (props: P) => E,
  didChange = defaultDidChangeFunction<P>,
) {
  let prev: { props: P; element: E };
  return (props: P) => {
    if (prev && !didChange(prev.props, props)) return prev.element;
    if (prev && didChange(prev.props, props)) {
      // before re-rendering, unmount the previous element
      prev.element?.unmount?.();
    }
    prev = { props, element: renderer(props) };
    return prev.element;
  };
}

function defaultDidChangeFunction<P extends object>(prev: P, next: P) {
  return JSON.stringify(prev) !== JSON.stringify(next);
}
