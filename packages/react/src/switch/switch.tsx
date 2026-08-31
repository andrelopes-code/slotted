import '@slotted/styles/switch/switch.css';

import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';

import { useField } from '../field/field-context';
import type { SwitchProps } from './switch.types';

/**
 * An immediate binary setting, drawn on a button that reports `aria-checked`.
 *
 * It binds no keys: a button already answers Space and Enter, and the switch
 * pattern asks for nothing else. It has no read-only state either — a setting
 * that cannot be changed is disabled, with an explanation beside it, rather
 * than a control that looks operable and swallows the click.
 */
export function Switch({
  'aria-required': ariaRequired,
  checked,
  className,
  defaultChecked = false,
  disabled,
  id,
  invalid,
  onCheckedChange,
  onClick,
  required,
  size = 'md',
  type = 'button',
  ...nativeProps
}: SwitchProps) {
  const field = useField();
  const registerControl = field?.registerControl;
  const [uncontrolled, setUncontrolled] = useState(defaultChecked);

  useEffect(() => registerControl?.(), [registerControl]);

  const isChecked = checked ?? uncontrolled;
  const isDisabled = disabled ?? field?.disabled ?? false;
  const isInvalid = invalid ?? field?.invalid ?? false;
  const isRequired = required ?? field?.required ?? false;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || isDisabled) return;
    const next = !isChecked;
    if (checked === undefined) setUncontrolled(next);
    onCheckedChange?.(next);
  };

  return (
    <button
      {...nativeProps}
      aria-checked={isChecked}
      aria-describedby={field?.describedBy}
      aria-invalid={isInvalid ? true : undefined}
      aria-required={ariaRequired ?? (isRequired ? true : undefined)}
      className={['slotted-switch', className].filter(Boolean).join(' ')}
      data-checked={isChecked ? '' : undefined}
      data-disabled={isDisabled ? '' : undefined}
      data-invalid={isInvalid ? '' : undefined}
      data-part="root"
      data-size={size}
      data-slotted-component="switch"
      disabled={isDisabled}
      id={id ?? field?.ids.control}
      onClick={handleClick}
      role="switch"
      type={type}
    >
      <span data-part="thumb" />
    </button>
  );
}
