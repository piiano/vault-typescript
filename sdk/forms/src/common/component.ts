export function component<P extends object, E extends Element>(
  renderer: (props: P) => E,
  didChange = defaultDidChangeFunction<P>,
) {
  let prev: { props: P; element: E };
  return (props: P) => {
    if (prev && !didChange(prev.props, props)) return prev.element;
    prev = { props, element: renderer(props) };
    return prev.element;
  };
}

function defaultDidChangeFunction<P extends object>(prev: P, next: P) {
  return JSON.stringify(prev) !== JSON.stringify(next);
}
