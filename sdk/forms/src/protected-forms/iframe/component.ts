export type Ref<T> = { current: T };

export function useRef<T>(initialValue: T): Ref<T> {
  return { current: initialValue };
}
