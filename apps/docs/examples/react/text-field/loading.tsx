import { useEffect, useRef, useState } from 'react';
import { Field, FieldDescription, FieldError, FieldLabel } from '@slotted/react/field';
import { TextField } from '@slotted/react/text-field';

/** Stands in for the request that checks whether a handle is free. */
const TAKEN = new Set(['admin', 'northwind', 'support']);

export default function TextFieldLoading() {
  const [handle, setHandle] = useState('northwind-ops');
  const [checking, setChecking] = useState(false);
  const [taken, setTaken] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const change = (next: string) => {
    setHandle(next);
    setTaken(false);
    clearTimeout(timer.current);
    setChecking(next !== '');
    if (next === '') return;
    timer.current = setTimeout(() => {
      setChecking(false);
      setTaken(TAKEN.has(next));
    }, 900);
  };

  return (
    <Field invalid={taken ? true : undefined}>
      <FieldLabel>Handle</FieldLabel>
      <TextField
        autoComplete="username"
        clearable
        loading={checking}
        onValueChange={change}
        spellCheck={false}
        start="@"
        value={handle}
      />
      <FieldDescription>Lowercase letters, digits and hyphens.</FieldDescription>
      <FieldError live="polite" reserve>
        {taken ? `@${handle} is already taken.` : ''}
      </FieldError>
    </Field>
  );
}
