import '@slotted/styles/field/field.css';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { deriveIds, FieldContext, fieldClassName } from './field-context';
import type { FieldContextValue, FieldProps } from './field.types';

const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

export function Field({
  children,
  className,
  disabled = false,
  id,
  invalid = false,
  readOnly = false,
  render,
  required = false,
  ...nativeProps
}: FieldProps) {
  const generatedId = useId();
  const ids = useMemo(() => deriveIds(id ?? `slotted-field-${generatedId}`), [generatedId, id]);

  const [parts, setParts] = useState<readonly ('description' | 'error')[]>([]);
  const hasControl = useRef(false);

  const registerPart = useCallback((part: 'description' | 'error') => {
    setParts((current) => (current.includes(part) ? current : [...current, part]));
    return () => setParts((current) => current.filter((candidate) => candidate !== part));
  }, []);

  const registerControl = useCallback(() => {
    hasControl.current = true;
  }, []);

  useEffect(() => {
    if (!isDevelopment || hasControl.current) return;
    console.warn(
      'Field rendered without a control. Wrap the control in FieldControl, or use a control that reads the field, so the label resolves.',
    );
  }, []);

  const describedBy =
    [
      parts.includes('description') ? ids.description : undefined,
      parts.includes('error') ? ids.error : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  const value: FieldContextValue = {
    describedBy,
    disabled,
    ids,
    invalid,
    readOnly,
    registerControl,
    registerPart,
    required,
  };

  const rootProps = {
    ...nativeProps,
    children,
    className: fieldClassName(className),
    'data-disabled': disabled ? '' : undefined,
    'data-invalid': invalid ? '' : undefined,
    'data-part': 'root',
    'data-readonly': readOnly ? '' : undefined,
    'data-required': required ? '' : undefined,
    'data-slotted-component': 'field',
  } as const;

  return (
    <FieldContext.Provider value={value}>
      {render === undefined ? <div {...rootProps} /> : render(rootProps)}
    </FieldContext.Provider>
  );
}
