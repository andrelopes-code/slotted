import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/rating/rating.css';

import { ratingMessages } from '@slotted/core/i18n';
import {
  formatRatingValue,
  normaliseRating,
  ratingAtPoint,
  ratingFills,
  ratingForKey,
} from '@slotted/core/rating';
import { createControllable } from '@slotted/core/state';
import { useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';

import { useField, useFieldDefaults } from '../field';
import { useLocale, useMessages } from '../i18n';
import { useRatingDefaults } from './rating-defaults';
import { RatingSymbolLayers } from './rating-display';
import type { RatingChangeReason, RatingProps, RatingRootProps } from './rating.types';

/** A click synthesised by the keyboard reports no detail; a real one reports the click count. */
function activationReason(event: MouseEvent<HTMLInputElement>): RatingChangeReason {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * Whether the inline axis runs right to left. The computed direction answers
 * in a browser; the nearest `dir` answers where no style engine computes it.
 */
function isRtl(element: HTMLElement): boolean {
  const computed = getComputedStyle(element).direction;
  if (computed === 'rtl') return true;
  return element.closest('[dir]')?.getAttribute('dir')?.toLowerCase() === 'rtl';
}

/**
 * An ordinal value chosen by lighting symbols in order.
 *
 * **Every value is a native radio.** The radios share a name, so `Tab`, `Space`,
 * form submission and a reset are the platform's; the family adds only what the
 * platform lacks. The arrows stop at both ends instead of wrapping, `Home` and
 * `End` reach them, and `Backspace` and `Delete` empty the value — all asked of
 * `ratingForKey`, so both bindings answer every key the same way.
 *
 * **The lit share is CSS.** The fill follows `:checked` and `:hover` on the
 * radios, so the component writes no fill of its own and a preview costs no
 * render.
 *
 * **A press on the checked radio empties the value** while `clearable` holds,
 * because a radio cannot be unchosen by choosing it and a rating the reader
 * gave by mistake needs a way back to none.
 *
 * **A finger or a pen scrubs.** Dragged along the row, it asks for the value
 * `ratingAtPoint` reads under it, and only when that value changes. A mouse
 * does not, because it already has hover to preview and a press to choose.
 *
 * **`readOnly` is enforced, because the platform has none.** The change is
 * refused on the radio's own `click`, the one event a pointer and `Space`
 * share, and the group announces `aria-readonly`.
 */
export function Rating({
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-readonly': ariaReadOnly,
  'aria-required': ariaRequired,
  caption,
  className,
  clearable,
  defaultValue,
  disabled,
  form,
  handle,
  invalid,
  locale,
  max,
  messages,
  name,
  onKeyDown,
  onPointerDown,
  onPointerLeave,
  onPointerOver,
  onPreviewChange,
  onValueChange,
  readOnly,
  ref,
  render,
  renderSymbol,
  required,
  role,
  size,
  step,
  style,
  tone,
  value,
  ...nativeProps
}: RatingProps) {
  const field = useField();
  const fieldDefaults = useFieldDefaults();
  const defaults = useRatingDefaults();
  const t = useMessages(ratingMessages, messages);
  const appLocale = useLocale();
  const generatedName = useId();

  const resolvedMax = Math.max(1, Math.floor(max ?? defaults.max));
  const resolvedStep = step ?? 1;
  const scale = { max: resolvedMax, step: resolvedStep } as const;
  const resolvedSize = size ?? field?.size ?? defaults.size;
  const resolvedTone = tone ?? defaults.tone;
  const resolvedClearable = clearable ?? defaults.clearable;
  const resolvedLocale = locale ?? appLocale;
  const resolvedDisabled = disabled ?? field?.disabled ?? fieldDefaults.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly ?? fieldDefaults.readOnly;
  const resolvedInvalid = invalid ?? field?.invalid;
  const resolvedRequired = required ?? field?.required;
  const inert = resolvedDisabled === true || resolvedReadOnly === true;

  const [own, setOwn] = useState<number | null>(() => normaliseRating(defaultValue, scale));
  const current = normaliseRating(value === undefined ? own : value, scale);
  const [preview, setPreview] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const rootRef = useRef<HTMLElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const inputs = useRef(new Map<number, HTMLInputElement>());
  /** The pointer scrubbing the row, and whether it has asked for anything yet. */
  const drag = useRef<{ pointerId: number; moved: boolean } | undefined>(undefined);
  /** A drag that asked for a value swallows the click the release may still produce. */
  const swallowClick = useRef(false);

  const register = field?.registerControl;
  useEffect(() => register?.(), [register]);

  useImperativeHandle(
    handle,
    () => ({
      focus: () => {
        const checked = current === null ? undefined : inputs.current.get(current);
        (checked ?? inputs.current.get(resolvedStep))?.focus();
      },
    }),
    [current, resolvedStep],
  );

  /**
   * Asks for `next` and reports whether the request stood. It returns `false`
   * when the rating is read-only or disabled, or when the consumer cancelled;
   * a controlled rating that was asked stands, and waits for its consumer.
   */
  const request = (next: number | null, reason: RatingChangeReason, source: unknown): boolean => {
    if (inert) return false;
    let cancelled = false;
    const state = createControllable<number | null>({
      controlled: value === undefined ? undefined : current,
      initial: current,
      onRequest: (change) => {
        onValueChange?.(change.value, change);
        cancelled = change.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled) return false;
    if (moved) setOwn(next);
    return true;
  };

  const showPreview = (next: number | null) => {
    if (next === preview) return;
    setPreview(next);
    onPreviewChange?.(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event as KeyboardEvent<HTMLDivElement>);
    if (event.defaultPrevented || resolvedDisabled === true) return;
    const next = ratingForKey(event.key, current, scale, {
      rtl: isRtl(event.currentTarget),
      clearable: resolvedClearable,
    });
    if (next === undefined) return;
    event.preventDefault();
    if (resolvedReadOnly === true || next === current) return;
    if (!request(next, next === null ? 'clear' : 'keyboard', event)) return;
    if (next !== null) inputs.current.get(next)?.focus();
  };

  const handleClick = (event: MouseEvent<HTMLInputElement>, itemValue: number) => {
    if (inert || swallowClick.current) {
      swallowClick.current = false;
      event.preventDefault();
      return;
    }
    if (itemValue === current) {
      if (resolvedClearable && event.detail > 0) request(null, 'clear', event);
      return;
    }
    if (!request(itemValue, activationReason(event), event)) event.preventDefault();
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    onPointerDown?.(event as PointerEvent<HTMLDivElement>);
    swallowClick.current = false;
    if (event.defaultPrevented || inert || event.pointerType === 'mouse') return;
    drag.current = { pointerId: event.pointerId, moved: false };
    setDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    const row = rowRef.current;
    if (active === undefined || row === null || event.pointerId !== active.pointerId) return;
    const root = rootRef.current ?? row;
    const next = ratingAtPoint(
      { x: event.clientX },
      row.getBoundingClientRect(),
      scale,
      isRtl(root),
    );
    if (next === current) return;
    if (!active.moved) {
      active.moved = true;
      swallowClick.current = true;
      try {
        row.setPointerCapture(event.pointerId);
      } catch {
        /* The pointer is no longer active; the drag goes on without capture. */
      }
    }
    request(next, 'pointer', event);
  };

  const release = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = undefined;
    setDragging(false);
  };

  const fills = ratingFills(current, resolvedMax);

  const rootProps: RatingRootProps = keyedProps({
    ...nativeProps,
    'aria-describedby': [describedBy, field?.describedBy].filter(Boolean).join(' ') || undefined,
    'aria-invalid': ariaInvalid ?? (resolvedInvalid === true ? true : undefined),
    'aria-label': ariaLabel,
    'aria-labelledby':
      ariaLabelledBy ??
      (ariaLabel === undefined && field !== undefined ? field.ids.label : undefined),
    'aria-readonly': ariaReadOnly ?? (resolvedReadOnly === true ? true : undefined),
    'aria-required': ariaRequired ?? (resolvedRequired === true ? true : undefined),
    children: (
      <>
        <div
          data-part="symbols"
          data-part-symbols=""
          onPointerCancel={release}
          onPointerMove={handlePointerMove}
          onPointerUp={release}
          ref={rowRef}
        >
          {fills.map((fill, index) => {
            const whole = index + 1;
            const values = resolvedStep === 0.5 ? [index + 0.5, whole] : [whole];
            const checked = current !== null && current > index && current <= whole;
            return (
              <span
                data-part="item"
                data-part-item=""
                key={whole}
                {...(checked ? { 'data-checked': '' } : {})}
              >
                {values.map((itemValue) => (
                  <input
                    aria-label={t('itemLabel', {
                      value: formatRatingValue(itemValue, resolvedLocale),
                      max: resolvedMax,
                    })}
                    checked={itemValue === current}
                    data-part="input"
                    data-part-input=""
                    disabled={resolvedDisabled}
                    form={form}
                    key={itemValue}
                    name={name ?? `slotted-rating-${generatedName}`}
                    /* React refuses a controlled radio with no handler; the
                       change is asked for on click, where the reason is known. */
                    onChange={() => undefined}
                    onClick={(event) => handleClick(event, itemValue)}
                    ref={(element) => {
                      if (element === null) inputs.current.delete(itemValue);
                      else inputs.current.set(itemValue, element);
                    }}
                    type="radio"
                    value={itemValue}
                    {...(itemValue === whole ? {} : { 'data-half': '' })}
                  />
                ))}
                <RatingSymbolLayers fill={fill} index={index} renderSymbol={renderSymbol} />
              </span>
            );
          })}
        </div>
        {caption === undefined ? null : (
          <span data-part="value" data-part-value="" aria-hidden="true">
            {typeof caption === 'function' ? caption({ value: current, preview }) : caption}
          </span>
        )}
      </>
    ),
    className,
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    ...(dragging ? { 'data-dragging': '' } : {}),
    ...(resolvedInvalid === true ? { 'data-invalid': '' } : {}),
    'data-max': resolvedMax,
    'data-part': 'root',
    ...(resolvedReadOnly === true ? { 'data-readonly': '' } : {}),
    'data-size': resolvedSize,
    ...(resolvedStep === 0.5 ? { 'data-step': resolvedStep } : {}),
    'data-tone': resolvedTone,
    'data-ui': 'rating',
    onKeyDown: handleKeyDown,
    onPointerDown: handlePointerDown,
    onPointerLeave: (event) => {
      onPointerLeave?.(event as PointerEvent<HTMLDivElement>);
      showPreview(null);
    },
    onPointerOver: (event) => {
      onPointerOver?.(event as PointerEvent<HTMLDivElement>);
      const target = event.target as HTMLElement;
      if (inert || !(target instanceof HTMLInputElement) || target.dataset['part'] !== 'input')
        return;
      showPreview(Number(target.value));
    },
    role: role ?? 'radiogroup',
    style,
  });

  return render === undefined ? (
    <div
      {...rootProps}
      ref={(element) => {
        rootRef.current = element;
        if (typeof ref === 'function') return ref(element);
        if (ref) ref.current = element;
        return undefined;
      }}
    />
  ) : (
    render(rootProps)
  );
}
