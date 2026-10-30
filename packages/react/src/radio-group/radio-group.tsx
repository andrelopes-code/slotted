import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/radio-group/radio-group.css';

import { createControllable } from '@slotted/core/state';
import { createContext, useContext, useEffect, useId, useState } from 'react';

import { useField, useFieldDefaults } from '../field';
import { useFieldGroup } from '../field-group';
import { useRadioGroupDefaults } from './radio-group-defaults';
import type {
  RadioGroupContextValue,
  RadioGroupProps,
  RadioGroupRootProps,
  RadioGroupSelectionReason,
} from './radio-group.types';

const RadioGroupContext = createContext<RadioGroupContextValue | undefined>(undefined);

/**
 * What the group around this item says. A `Radio` outside a group has no
 * exclusive set to belong to and no name to be grouped by, so this throws
 * rather than rendering a control that looks right and behaves like nothing.
 */
export function useRadioGroup(): RadioGroupContextValue {
  const context = useContext(RadioGroupContext);
  if (context === undefined) {
    throw new Error('Radio must be rendered inside a RadioGroup.');
  }
  return context;
}

/**
 * One choice out of a set.
 *
 * **The keyboard is the platform's, and that is why the items share a `name`.**
 * Native radios in one form owner with one name already implement the APG's
 * whole table: Tab lands on the checked item or on the first, `Space` checks,
 * both arrow axes move focus and selection together, the set wraps, and
 * disabled items are skipped — in a right-to-left document too. A roving
 * `tabindex` written once per binding would reimplement all of it twice.
 *
 * **The role is conditional, and the condition is the field group.** A
 * `field-group` is a `fieldset` with a `legend`, which is already a named group;
 * a `radiogroup` inside it, named by the same legend, is the same group
 * announced twice. A consumer's explicit `role` wins over both.
 *
 * **`readOnly` is enforced, because the platform has none.** A radio ignores
 * `readonly`, so the group refuses the change on the item's own `click` — the
 * one event a pointer and `Space` share — and announces `aria-readonly`.
 */
export function RadioGroup({
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  'aria-readonly': ariaReadOnly,
  'aria-orientation': ariaOrientation,
  'aria-required': ariaRequired,
  children,
  className,
  defaultValue,
  disabled,
  invalid,
  labelPlacement,
  variant,
  name,
  onValueChange,
  orientation,
  readOnly,
  ref,
  render,
  required,
  role,
  size,
  style,
  value,
  ...nativeProps
}: RadioGroupProps) {
  const field = useField();
  const fieldGroup = useFieldGroup();
  const fieldDefaults = useFieldDefaults();
  const defaults = useRadioGroupDefaults();
  const generatedName = useId();

  const [own, setOwn] = useState<string | undefined>(defaultValue);
  const current = value ?? own;

  const resolvedSize = size ?? field?.size ?? fieldGroup?.size ?? defaults.size;
  const resolvedOrientation = orientation ?? defaults.orientation;
  const resolvedLabelPlacement = labelPlacement ?? defaults.labelPlacement;
  const resolvedVariant = variant ?? defaults.variant;
  const resolvedDisabled = disabled ?? field?.disabled ?? fieldDefaults.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly ?? fieldDefaults.readOnly;
  const resolvedInvalid = invalid ?? field?.invalid ?? fieldGroup?.invalid;
  const resolvedRequired = required ?? field?.required ?? fieldGroup?.required;
  const resolvedRole = role ?? (fieldGroup === undefined ? 'radiogroup' : undefined);

  const register = field?.registerControl;
  useEffect(() => register?.(), [register]);

  const context: RadioGroupContextValue = {
    disabled: resolvedDisabled,
    invalid: resolvedInvalid,
    labelPlacement: resolvedLabelPlacement,
    variant: resolvedVariant,
    name: name ?? `slotted-radio-group-${generatedName}`,
    readOnly: resolvedReadOnly,
    required: resolvedRequired,
    select: (next, reason: RadioGroupSelectionReason, source) => {
      if (resolvedReadOnly === true) return false;
      let cancelled = false;
      const state = createControllable<string | undefined>({
        controlled: value,
        initial: current,
        onRequest: (request) => {
          cancelled = request.cancelled;
          /* Never undefined here: a radio cannot be unchosen by choosing it. */
          if (request.value !== undefined) onValueChange?.(request.value, request);
        },
      });
      const moved = state.request(next, reason, source);
      if (cancelled) return false;
      if (moved) setOwn(next);
      return true;
    },
    size: resolvedSize,
    value: current,
  };

  const rootProps: RadioGroupRootProps = keyedProps({
    ...nativeProps,
    'aria-label': ariaLabel,
    /* A group has no element a label's for can reach, so inside a field the
       field's label names it, unless the consumer named it themselves. */
    'aria-labelledby': labelledBy ?? (ariaLabel === undefined ? field?.ids.label : undefined),
    'aria-describedby': [describedBy, field?.describedBy].filter(Boolean).join(' ') || undefined,
    'aria-invalid': ariaInvalid ?? (resolvedInvalid === true ? true : undefined),
    /**
     * Only where the root owns the role. On an element with no role the
     * attribute describes nothing, and `radiogroup` already implies `vertical`,
     * so it is written when the group flows the other way.
     */
    'aria-orientation':
      ariaOrientation ??
      (resolvedRole === 'radiogroup' && resolvedOrientation === 'horizontal'
        ? 'horizontal'
        : undefined),
    'aria-readonly': ariaReadOnly ?? (resolvedReadOnly === true ? true : undefined),
    'aria-required': ariaRequired ?? (resolvedRequired === true ? true : undefined),
    children,
    className,
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    ...(resolvedInvalid === true ? { 'data-invalid': '' } : {}),
    ...(resolvedReadOnly === true ? { 'data-readonly': '' } : {}),
    'data-label-placement': resolvedLabelPlacement,
    'data-orientation': resolvedOrientation,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'radio-group',
    'data-variant': resolvedVariant,
    role: resolvedRole,
    style,
  });

  return (
    <RadioGroupContext.Provider value={context}>
      {render === undefined ? <div {...rootProps} ref={ref} /> : render(rootProps)}
    </RadioGroupContext.Provider>
  );
}
