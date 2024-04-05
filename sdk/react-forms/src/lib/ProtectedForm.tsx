import React, { ForwardedRef, forwardRef, ReactNode, RefAttributes, useEffect, useMemo, useRef } from 'react';
import { createProtectedForm, type Form, type Hooks, type ProtectedFormOptions, type ResultType } from '@piiano/forms';

export function useProtectedForm<T extends ResultType = 'fields'>(options: ProtectedFormOptions<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const form = useRef<Form<T>>();

  useEffect(() => {
    if (!containerRef.current) return;

    if (!form.current) {
      form.current = createProtectedForm(containerRef.current, options);
    } else {
      if (options.allowUpdates) form.current.update(options);
    }
  }, [options]);

  return { containerRef, form: form.current };
}

type ProtectedFormProps<T extends ResultType> = Omit<ProtectedFormOptions<T>, 'hooks'> & Hooks<T>;

export const ProtectedForm = forwardRef(function ProtectedForm<T extends ResultType = 'fields'>(
  { onError, onSubmit, ...props }: ProtectedFormProps<T>,
  formRef: ForwardedRef<Form<T> | undefined>,
) {
  const options = useMemo(() => {
    return {
      ...props,
      hooks: {
        onSubmit,
        onError,
      },
    };
  }, [JSON.stringify(props), onSubmit, onError]);

  const { containerRef, form } = useProtectedForm(options);

  if (formRef && typeof formRef === 'object') formRef.current = form;

  return <div ref={containerRef} />;
}) as <T extends ResultType = 'fields'>(props: ProtectedFormProps<T> & RefAttributes<Form<T>>) => ReactNode;
