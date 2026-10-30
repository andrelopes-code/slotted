import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/textarea/textarea.css';

import { createControllable } from '@slotted/core/state';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties } from 'react';

import { useField } from '../field';
import { countsInField } from '../field/field-context';
import { useTextareaDefaults } from './textarea-defaults';
import type { TextareaProps, TextareaRootProps } from './textarea.types';

/**
 * Many lines of text, in the element that already holds them.
 *
 * **No frame.** `text-field` wraps its input because an adornment and two
 * buttons have to sit inside one border and a void element can hold no child.
 * Nothing surveyed puts an adornment inside a textarea — the corner is where
 * the resize handle goes — so this family is the control itself, and the two
 * anatomies differ on purpose rather than matching for symmetry.
 *
 * **The platform grows it.** `autoSize` is CSS `field-sizing: content`. Nothing
 * is measured on the main thread, no line height is cached and no layout is
 * read per keystroke, which is what Angular CDK's autosize and Mantine's both
 * do. `field-sizing` shrinkwraps, so `rows` stops being the floor: the two row
 * counts reach the stylesheet as custom properties, and it states the floor and
 * the ceiling in line boxes.
 *
 * **Enter makes a line.** Nothing is bound to a key. WAI-ARIA notes the
 * difference between a single-line and a multi-line text control, and
 * `docs/component-features.md` §6 requires it: a multi-line control never
 * submits implicitly.
 */
export function Textarea({
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  autoSize = false,
  countMax,
  defaultValue,
  disabled,
  id,
  invalid,
  maxLength,
  maxRows = 12,
  mono,
  onChange,
  onValueChange,
  readOnly,
  ref,
  render,
  resize,
  rows = 3,
  showCount = false,
  size,
  style,
  value,
  variant,
  ...nativeProps
}: TextareaProps) {
  const field = useField();
  const defaults = useTextareaDefaults();
  const elementRef = useRef<HTMLTextAreaElement | null>(null);

  /** A mirror of the element's own value, for the count. Never its owner. */
  const [mirrored, setMirrored] = useState(defaultValue ?? '');
  const current = value ?? mirrored;

  const resolvedSize = size ?? field?.size ?? defaults.size;
  const resolvedVariant = variant ?? defaults.variant;
  const resolvedMono = mono ?? defaults.mono;
  const resolvedResize = resize ?? defaults.resize;
  const resolvedDisabled = disabled ?? field?.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly;
  const resolvedInvalid = invalid ?? field?.invalid;

  const register = field?.registerControl;
  useEffect(() => register?.(), [register]);

  useEffect(() => {
    const form = elementRef.current?.form;
    if (form === null || form === undefined) return;
    const onReset = () => setMirrored(defaultValue ?? '');
    form.addEventListener('reset', onReset);
    return () => form.removeEventListener('reset', onReset);
  }, [defaultValue]);

  const setCount = field?.setCount;
  const limit = countMax ?? maxLength ?? undefined;
  useEffect(() => {
    if (!showCount || setCount === undefined) return;
    setCount({ length: current.length, max: limit });
    return () => setCount(undefined);
  }, [current, limit, setCount, showCount]);

  const requestValue = (next: string, source: unknown) => {
    const state = createControllable<string>({
      controlled: value,
      initial: current,
      onRequest: (request) => onValueChange?.(request.value, request),
    });
    if (state.request(next, 'keyboard', source)) setMirrored(next);
  };

  /**
   * The two row counts CSS cannot read from the attribute, written as custom
   * properties the stylesheet turns into a minimum and a maximum block size in
   * line boxes. `rows` stays on the element as well, because it is what the
   * platform uses while `field-sizing` is off or unsupported. Strings, because
   * the server writes a number as text and the browser hands it back as text:
   * a number here made every hydrated textarea report a style mismatch.
   */
  const rowVariables = {
    '--slotted-textarea-rows': String(rows),
    '--slotted-textarea-max-rows': String(maxRows),
  } as CSSProperties;

  const rootProps: TextareaRootProps = keyedProps({
    ...nativeProps,
    'aria-describedby': [describedBy, field?.describedBy].filter(Boolean).join(' ') || undefined,
    'aria-invalid': ariaInvalid ?? (resolvedInvalid === true ? true : undefined),
    'aria-required': ariaRequired ?? (field?.required === true ? true : undefined),
    ...(autoSize ? { 'data-auto-size': '' } : {}),
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    ...(resolvedInvalid === true ? { 'data-invalid': '' } : {}),
    ...(resolvedMono ? { 'data-mono': '' } : {}),
    ...(resolvedReadOnly === true ? { 'data-readonly': '' } : {}),
    'data-part': 'root',
    'data-resize': autoSize ? 'none' : resolvedResize,
    'data-size': resolvedSize,
    'data-ui': 'textarea',
    'data-variant': resolvedVariant,
    id: id ?? field?.ids.control,
    style: { ...rowVariables, ...style },
  });

  if (render !== undefined) return render(rootProps);

  return (
    <textarea
      {...rootProps}
      disabled={resolvedDisabled}
      maxLength={maxLength}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
        /* The consumer's handler first, and it always runs. */
        onChange?.(event);
        requestValue(event.currentTarget.value, event);
      }}
      readOnly={resolvedReadOnly}
      ref={(element: HTMLTextAreaElement | null) => {
        elementRef.current = element;
        if (typeof ref === 'function') ref(element);
        else if (ref !== null && ref !== undefined) ref.current = element;
      }}
      rows={rows}
      {...(value === undefined ? { defaultValue } : { value })}
    />
  );
}

/** The count `Textarea` publishes, as the field reads it before the effect runs. */
countsInField(Textarea, ({ countMax, defaultValue, maxLength, showCount, value }: TextareaProps) =>
  showCount === true
    ? { length: (value ?? defaultValue ?? '').length, max: countMax ?? maxLength ?? undefined }
    : undefined,
);
