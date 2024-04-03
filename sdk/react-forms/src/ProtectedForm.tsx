import React, { ComponentProps, ForwardedRef, forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { createProtectedForm, type Form, type ProtectedFormOptions, type ResultType } from '@piiano/forms';

export function useProtectedForm<T extends ResultType = 'fields'>(options: ProtectedFormOptions<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<Form<T>>();

  useEffect(() => {
    if (!containerRef.current) return;

    if (!form) {
      const form = createProtectedForm(containerRef.current, options);
      setForm(form);
    } else {
      form.update(options);
    }
  }, [options]);

  return { containerRef, form };
}

type ProtectedFormProps<T extends ResultType> = Omit<ProtectedFormOptions<T>, 'hooks'> &
  ProtectedFormOptions<T>['hooks'];

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
});
