export function component<P extends object, E extends Node & { unmount?: () => void }>(
  renderer: (keyPrefix: string, props: P) => E,
  didChange = defaultDidChangeFunction<P>,
) {
  const prevProps = new Map<string | number, { props: P; element: E }>();
  return (key: string, props: P) => {
    const prev = prevProps.get(key);
    if (prev && !didChange(prev.props, props)) return prev.element;
    if (prev && didChange(prev.props, props)) {
      // before re-rendering, unmount the previous element
      prev.element?.unmount?.();
    }
    const element = renderer(key, props);
    prevProps.set(key, { props, element });
    return element;
  };
}

function defaultDidChangeFunction<P extends object>(prev: P, next: P) {
  return JSON.stringify(prev) !== JSON.stringify(next);
}
