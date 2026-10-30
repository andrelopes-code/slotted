import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/checkbox/checkbox.css';

import { createControllable } from '@slotted/core/state';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';

import { useCheckboxGroup } from '../checkbox-group';
import { useField, useFieldDefaults } from '../field';
import { useFieldGroup } from '../field-group';
import { Glyph, Icon } from '../icon';
import { useCheckboxDefaults } from './checkbox-defaults';
import type { CheckboxCheckedReason, CheckboxProps, CheckboxRootProps } from './checkbox.types';

/**
 * A click synthesised by the keyboard reports no detail; a real one reports the
 * click count. It is the rule `button`, `tag` and `text-field` all write, and
 * it is why `Space` and a pointer are told apart without a key listener.
 */
function activationReason(event: MouseEvent<HTMLInputElement>): CheckboxCheckedReason {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * One choice, ticked or not.
 *
 * **The control is the platform's.** The element carrying the value is a native
 * `input[type=checkbox]`, so `Space`, the form, `name`, `value`, `form.reset()`
 * and every native attribute arrive without a listener of this family's own.
 * The root around it is a `div` with no role.
 *
 * **The mark is a sibling, not a pseudo-element.** Firefox renders neither
 * `::before` nor `::after` on an `input`, a glyph token is authored black so it
 * can be masked, and a mask set on the control would clip its border and ground
 * away with the mark.
 *
 * **The label names the control through `for`.** It is not a wrapper: the root
 * is a two-column grid, and a wrapping label would be one grid item holding
 * both columns, so the description could no longer align under the label text.
 *
 * **Unset means ask the group, then the field.** `disabled`, `readOnly` and
 * `invalid` default to `undefined` rather than `false`, which is what makes
 * "not disabled" and "said nothing" different answers.
 */
/** A label with content, all of it hidden text: nothing a sighted reader sees. */
function showsNothing(label: HTMLElement | null): boolean {
  if (label === null || label.childNodes.length === 0) return false;
  return [...label.childNodes].every((node) =>
    node.nodeType === Node.TEXT_NODE
      ? (node.textContent ?? '').trim() === ''
      : node instanceof Element && node.getAttribute('data-ui') === 'visually-hidden',
  );
}

export function Checkbox({
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  'aria-readonly': ariaReadOnly,
  'aria-required': ariaRequired,
  checked,
  children,
  className,
  defaultChecked,
  description,
  disabled,
  id,
  indeterminate,
  invalid,
  labelPlacement,
  onChange,
  onClick,
  onCheckedChange,
  parent = false,
  readOnly,
  ref,
  render,
  size,
  style,
  value,
  variant,
  ...nativeProps
}: CheckboxProps) {
  const group = useCheckboxGroup();
  const field = useField();
  const fieldGroup = useFieldGroup();
  const fieldDefaults = useFieldDefaults();
  const defaults = useCheckboxDefaults();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const generatedId = useId();
  const controlId = id ?? `slotted-checkbox-${generatedId}`;
  const descriptionId = `${controlId}-description`;

  /**
   * Three ways a box can know whether it is ticked, and they are decided by
   * what is around it rather than by a mode prop. A parent reads the whole set;
   * a member reads whether the selection holds its own value; a box on its own
   * reads the consumer's `checked`, or the state it keeps from `defaultChecked`.
   */
  const memberValue = typeof value === 'string' ? value : undefined;
  const isParent = parent && group !== undefined;
  const isMember = !isParent && group !== undefined && memberValue !== undefined;

  const [own, setOwn] = useState(defaultChecked ?? false);
  const groupAll = group?.allValues ?? [];
  const groupSelected = group?.value ?? [];
  const everySelected =
    groupAll.length > 0 && groupAll.every((item) => groupSelected.includes(item));
  const someSelected = groupAll.some((item) => groupSelected.includes(item));

  const resolvedChecked = isParent
    ? everySelected
    : isMember
      ? groupSelected.includes(memberValue)
      : (checked ?? own);
  const resolvedIndeterminate = isParent
    ? someSelected && !everySelected
    : (indeterminate ?? false);

  const resolvedSize = size ?? group?.size ?? field?.size ?? fieldGroup?.size ?? defaults.size;
  const resolvedLabelPlacement = labelPlacement ?? group?.labelPlacement ?? defaults.labelPlacement;
  const resolvedVariant = variant ?? group?.variant ?? defaults.variant;
  const resolvedDisabled = disabled ?? group?.disabled ?? field?.disabled ?? fieldDefaults.disabled;
  const resolvedReadOnly = readOnly ?? group?.readOnly ?? field?.readOnly ?? fieldDefaults.readOnly;
  const resolvedInvalid = invalid ?? group?.invalid ?? field?.invalid;
  const resolvedRequired = field?.required ?? group?.required ?? fieldGroup?.required;

  const register = field?.registerControl;
  useEffect(() => register?.(), [register]);

  /**
   * `indeterminate` has no attribute; it is an IDL property, which is why every
   * implementation writes it from script and why the stylesheet can read
   * `:indeterminate` and stay in step with the element rather than with a
   * render.
   */
  useEffect(() => {
    const element = inputRef.current;
    if (element !== null) element.indeterminate = resolvedIndeterminate;
  }, [resolvedIndeterminate]);

  /**
   * A native reset restores the element's own state and tells nothing, so the
   * mirror would keep the last thing chosen. The form is reached through the
   * element, because `form` may name a form anywhere in the document.
   */
  useEffect(() => {
    if (checked !== undefined || group !== undefined) return;
    const form = inputRef.current?.form;
    if (form === null || form === undefined) return;
    const onReset = () => setOwn(defaultChecked ?? false);
    form.addEventListener('reset', onReset);
    return () => form.removeEventListener('reset', onReset);
  }, [checked, defaultChecked, group]);

  const requestChecked = (next: boolean, reason: CheckboxCheckedReason, source: unknown) => {
    let cancelled = false;
    const state = createControllable<boolean>({
      controlled: isParent || isMember ? resolvedChecked : checked,
      initial: resolvedChecked,
      onRequest: (request) => {
        onCheckedChange?.(request.value, request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled) return false;
    if (moved) setOwn(next);
    return true;
  };

  /**
   * Whether the label shows nothing: its only content is hidden text, the name
   * a table row or a data list gives a bare box. Read from the DOM after
   * render, because the children can be any element that renders the hidden
   * text, and whitespace between them is not text a reader sees.
   */
  const labelRef = useRef<HTMLLabelElement | null>(null);
  const [labelHidden, setLabelHidden] = useState(false);
  useLayoutEffect(() => {
    const next = showsNothing(labelRef.current);
    if (next !== labelHidden) setLabelHidden(next);
  });

  const rootProps: CheckboxRootProps = keyedProps({
    children: (
      <>
        <input
          {...nativeProps}
          aria-describedby={
            /* What the field says is said once. Inside a group the group is
               the control the field describes, so a box in a set does not
               repeat the field's hint on every option. */
            [
              describedBy,
              description === undefined ? undefined : descriptionId,
              group === undefined ? field?.describedBy : undefined,
            ]
              .filter(Boolean)
              .join(' ') || undefined
          }
          aria-invalid={ariaInvalid ?? (resolvedInvalid === true ? true : undefined)}
          aria-readonly={ariaReadOnly ?? (resolvedReadOnly === true ? true : undefined)}
          aria-required={ariaRequired ?? (resolvedRequired === true ? true : undefined)}
          checked={isParent || isMember ? resolvedChecked : checked}
          data-part="control"
          data-part-control=""
          defaultChecked={
            isParent || isMember || checked !== undefined ? undefined : defaultChecked
          }
          disabled={resolvedDisabled}
          id={controlId}
          name={nativeProps.name ?? group?.name}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            /* The consumer's handler first, and it always runs: the family
               composes with it rather than replacing it. */
            onChange?.(event);
          }}
          onClick={(event: MouseEvent<HTMLInputElement>) => {
            onClick?.(event);
            /**
             * One handler for the pointer and for `Space`, because the
             * platform fires one `click` for both — and `preventDefault` here
             * is the only way to refuse a change a checkbox has no `readonly`
             * to refuse.
             */
            if (resolvedReadOnly === true) {
              event.preventDefault();
              return;
            }
            if (event.defaultPrevented) return;

            const reason = activationReason(event);
            const next = !resolvedChecked;
            if (!requestChecked(next, reason, event)) {
              event.preventDefault();
              return;
            }
            if (isParent) group?.requestAll(next, reason, event);
            else if (isMember) group?.toggle(memberValue, reason, event);
          }}
          ref={(element: HTMLInputElement | null) => {
            inputRef.current = element;
            if (typeof ref === 'function') ref(element);
            else if (ref !== null && ref !== undefined) ref.current = element;
          }}
          type="checkbox"
          value={value}
        />
        {/* Mixed is the dash, and it outranks the check: a control that is both
            indeterminate and checked draws the state its children are in. The
            stylesheet only reveals the mark, on `:checked` or `:indeterminate`. */}
        <span data-part="indicator" data-part-indicator="">
          <Icon>
            <Glyph name={resolvedIndeterminate ? 'minus' : 'check'} />
          </Icon>
        </span>
        {/* Rendered without children as well: the target and the wash are the
            label's pseudo-elements, and a box named by aria-label keeps both. */}
        <label data-part="label" data-part-label="" htmlFor={controlId} ref={labelRef}>
          {children}
        </label>
        {description === undefined ? null : (
          <p data-part="description" data-part-description="" id={descriptionId}>
            {description}
          </p>
        )}
      </>
    ),
    className,
    ...(resolvedChecked ? { 'data-checked': '' } : {}),
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    ...(resolvedIndeterminate ? { 'data-indeterminate': '' } : {}),
    ...(resolvedInvalid === true ? { 'data-invalid': '' } : {}),
    ...(resolvedReadOnly === true ? { 'data-readonly': '' } : {}),
    ...(labelHidden ? { 'data-label-hidden': '' } : {}),
    'data-label-placement': resolvedLabelPlacement,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'checkbox',
    'data-variant': resolvedVariant,
    style,
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
