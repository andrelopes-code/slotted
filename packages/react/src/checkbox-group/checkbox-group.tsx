import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/checkbox-group/checkbox-group.css';

import { createControllable } from '@slotted/core/state';
import { createContext, useContext, useEffect, useState } from 'react';

import { useField, useFieldDefaults } from '../field';
import { countsInField } from '../field/field-context';
import { useFieldGroup } from '../field-group';
import { useCheckboxGroupDefaults } from './checkbox-group-defaults';
import type {
  CheckboxGroupContextValue,
  CheckboxGroupProps,
  CheckboxGroupRootProps,
  CheckboxGroupSelectionReason,
} from './checkbox-group.types';

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | undefined>(undefined);

/**
 * What the group around this box says, or `undefined` if there is none — which
 * is what lets one `Checkbox` serve a bare consent box and a member of a set
 * without a second component existing for the second case.
 */
export function useCheckboxGroup(): CheckboxGroupContextValue | undefined {
  return useContext(CheckboxGroupContext);
}

/** Whether two selections hold the same values in the same order. */
function sameSelection(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * A set of choices, and the array behind it.
 *
 * **The group holds the value; the boxes draw themselves.** `checkbox` is the
 * family beside this one rather than a part of it, so a box works alone and
 * this stylesheet never selects into that one.
 *
 * **The role is conditional, and the condition is the field group.** A
 * `field-group` is a `fieldset` with a `legend`, which is already a named group
 * to assistive technology; a `role="group"` inside it, named by the same
 * legend, is the same group announced twice. A consumer's explicit `role` wins
 * over both.
 *
 * **Order comes from `allValues` when there is one.** A selection that grew in
 * click order submits in click order, and two readers who chose the same three
 * options would send two different arrays. With the set named, the selection is
 * always a subset of it, in its order.
 */
export function CheckboxGroup({
  allValues,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
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
  showCount = false,
  size,
  style,
  value,
  ...nativeProps
}: CheckboxGroupProps) {
  const field = useField();
  const fieldGroup = useFieldGroup();
  const fieldDefaults = useFieldDefaults();
  const defaults = useCheckboxGroupDefaults();

  const [own, setOwn] = useState<readonly string[]>(defaultValue ?? []);
  const current = value ?? own;

  const resolvedSize = size ?? field?.size ?? fieldGroup?.size ?? defaults.size;
  const resolvedOrientation = orientation ?? defaults.orientation;
  const resolvedLabelPlacement = labelPlacement ?? defaults.labelPlacement;
  const resolvedVariant = variant ?? defaults.variant;
  const resolvedDisabled = disabled ?? field?.disabled ?? fieldDefaults.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly ?? fieldDefaults.readOnly;
  const resolvedInvalid = invalid ?? field?.invalid ?? fieldGroup?.invalid;
  const resolvedRequired = required ?? field?.required ?? fieldGroup?.required;

  const register = field?.registerControl;
  useEffect(() => register?.(), [register]);

  /**
   * The count is the group's and the place is the field's, exactly as a text
   * field publishes characters. The limit is the size of the set the group
   * commands, so `2/5` says what a reader is looking for.
   */
  const setCount = field?.setCount;
  const total = allValues?.length;
  const selected = current.length;
  useEffect(() => {
    if (!showCount || setCount === undefined) return;
    setCount({ length: selected, max: total });
    return () => setCount(undefined);
  }, [selected, setCount, showCount, total]);

  const request = (
    next: readonly string[],
    reason: CheckboxGroupSelectionReason,
    source: unknown,
  ) => {
    const state = createControllable<readonly string[]>({
      controlled: value,
      equals: sameSelection,
      initial: current,
      onRequest: (pending) => onValueChange?.(pending.value, pending),
    });
    if (state.request(next, reason, source)) setOwn(next);
  };

  const context: CheckboxGroupContextValue = {
    allValues,
    disabled: resolvedDisabled,
    invalid: resolvedInvalid,
    labelPlacement: resolvedLabelPlacement,
    variant: resolvedVariant,
    name,
    readOnly: resolvedReadOnly,
    required: resolvedRequired,
    requestAll: (checked, reason, source) =>
      request(checked ? [...(allValues ?? [])] : [], reason, source),
    size: resolvedSize,
    toggle: (item, reason, source) => {
      const next = current.includes(item)
        ? current.filter((candidate) => candidate !== item)
        : allValues === undefined
          ? [...current, item]
          : allValues.filter((candidate) => candidate === item || current.includes(candidate));
      request(next, reason, source);
    },
    value: current,
  };

  const rootProps: CheckboxGroupRootProps = keyedProps({
    ...nativeProps,
    'aria-label': ariaLabel,
    /* A group has no element a label's for can reach, so inside a field the
       field's label names it, unless the consumer named it themselves. */
    'aria-labelledby': labelledBy ?? (ariaLabel === undefined ? field?.ids.label : undefined),
    'aria-describedby': [describedBy, field?.describedBy].filter(Boolean).join(' ') || undefined,
    'aria-invalid': ariaInvalid ?? (resolvedInvalid === true ? true : undefined),
    'aria-required': ariaRequired ?? (resolvedRequired === true ? true : undefined),
    children,
    className,
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    ...(resolvedInvalid === true ? { 'data-invalid': '' } : {}),
    ...(resolvedReadOnly === true ? { 'data-readonly': '' } : {}),
    'data-orientation': resolvedOrientation,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'checkbox-group',
    'data-variant': resolvedVariant,
    role: role ?? (fieldGroup === undefined ? 'group' : undefined),
    style,
  });

  return (
    <CheckboxGroupContext.Provider value={context}>
      {render === undefined ? <div {...rootProps} ref={ref} /> : render(rootProps)}
    </CheckboxGroupContext.Provider>
  );
}

countsInField(CheckboxGroup, ({ allValues, defaultValue, showCount, value }: CheckboxGroupProps) =>
  showCount === true
    ? { length: (value ?? defaultValue ?? []).length, max: allValues?.length }
    : undefined,
);
