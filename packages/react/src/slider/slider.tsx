import { keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import '@slotted/styles/slider/slider.css';

import { createNumberFormat } from '@slotted/core/number';
import {
  fractionAtPoint,
  fractionOfValue,
  moveThumb,
  nearestThumb,
  normaliseValues,
  sameValues,
  thumbBounds,
  valueAtFraction,
} from '@slotted/core/slider';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason } from '@slotted/core/state';
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react';

import { useField } from '../field';
import { useLocale } from '../i18n';
import { useSliderDefaults } from './slider-defaults';
import type { SliderMark, SliderProps, SliderRootProps } from './slider.types';

const toArray = (value: number | readonly number[]): number[] =>
  Array.isArray(value) ? [...value] : [value as number];

/** A position on the scale, as the private property the stylesheet reads. */
const positionStyle = (fraction: number): CSSProperties =>
  ({ '--_position': fraction * 100 }) as CSSProperties;

const spanStyle = (start: number, end: number): CSSProperties =>
  ({ '--_start': start * 100, '--_end': end * 100 }) as CSSProperties;

const normaliseMarks = (marks: readonly (number | SliderMark)[]): SliderMark[] =>
  marks.map((mark) => (typeof mark === 'number' ? { value: mark } : mark));

/**
 * A scale, a rail and one thumb per value.
 *
 * **Every thumb is a real `input[type="range"]`.** Angular Material's thumbs are
 * `input` elements and Base UI's `Slider.Thumb` renders one inside a `div`;
 * Radix and Ark write `role="slider"` on a `span` instead. The native element is
 * taken because it carries the role, `aria-valuenow`, `aria-valuemin`,
 * `aria-valuemax`, form submission, form reset and `disabled` without the family
 * writing any of them. It is invisible and unhittable, filling the thumb it
 * lives in, so the thumb a reader sees is this family's own element.
 *
 * **The family owns the keyboard and the pointer.** Browsers disagree about a
 * range input's larger step — Chrome moves Page Up by a tenth of the range and
 * Firefox by one step — and `largeStep` has to mean one thing in both bindings.
 *
 * **Two thumbs cannot cross, and the accessibility tree says so.** Each input's
 * own `min` and `max` follow its neighbour, which is what the APG's multi-thumb
 * pattern requires of the dependent sliders' announced range.
 *
 * **Unset means ask the field.** `disabled`, `readOnly` and `invalid` default to
 * `undefined` rather than `false`.
 */
export function Slider({
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  'aria-required': ariaRequired,
  className,
  defaultValue = 0,
  disabled,
  form,
  format,
  handle,
  id,
  invalid,
  largeStep,
  locale,
  marks,
  max = 100,
  min = 0,
  minStepsBetween = 0,
  name,
  onKeyDown,
  onValueChange,
  onValueCommit,
  orientation,
  origin = 'min',
  readOnly,
  ref,
  render,
  size,
  step = 1,
  style,
  thumbLabels,
  value,
  valueLabel,
  ...nativeProps
}: SliderProps) {
  const field = useField();
  const defaults = useSliderDefaults();
  const appLocale = useLocale();
  const generatedId = useId();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRefs = useRef<(HTMLInputElement | null)[]>([]);

  const resolvedSize = size ?? field?.size ?? defaults.size;
  const resolvedOrientation = orientation ?? defaults.orientation;
  const resolvedValueLabel = valueLabel ?? defaults.valueLabel;
  const resolvedLocale = locale ?? appLocale;
  const resolvedDisabled = disabled ?? field?.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly;
  const resolvedInvalid = invalid ?? field?.invalid;
  const inert = resolvedDisabled === true || resolvedReadOnly === true;

  const scale = useMemo(() => ({ min, max, step }), [max, min, step]);
  const largeAmount = largeStep ?? step * 10;

  /**
   * One formatter, rebuilt only when the locale or the format actually changes.
   * The options object is compared by its own content rather than by identity,
   * because a consumer writing `format={{ style: 'percent' }}` inline hands a
   * new object on every render.
   */
  const formatKey = format === undefined ? '' : JSON.stringify(format);
  const formatter = useMemo(
    () =>
      createNumberFormat({
        locale: resolvedLocale,
        ...(format === undefined ? {} : { options: format }),
      }),
    /* `formatKey` stands in for `format`: the options are compared by content. */
    [resolvedLocale, formatKey, format],
  );

  /** The shape the consumer handed in is the shape every request carries back. */
  const isRange = Array.isArray(value ?? defaultValue);
  const shape = useCallback(
    (values: number[]) => (isRange ? values : (values[0] ?? min)),
    [isRange, min],
  );

  const [own, setOwn] = useState<number[]>(() => normaliseValues(toArray(defaultValue), scale));
  const controlled = value !== undefined;
  const values = useMemo(
    () => (controlled ? normaliseValues(toArray(value), scale) : own),
    [controlled, own, scale, value],
  );

  const register = field?.registerControl;
  useEffect(() => register?.(), [register]);

  const request = useCallback(
    (next: number[], reason: ChangeReason, source: unknown) => {
      const state = createControllable<number[]>({
        ...(controlled ? { controlled: values } : {}),
        initial: values,
        equals: sameValues,
        onRequest: (pending) => onValueChange?.(shape(pending.value), pending),
      });
      const moved = state.request(next, reason, source);
      if (moved) setOwn(next);
      return moved;
    },
    [controlled, onValueChange, shape, values],
  );

  const commit = useCallback(
    (committed: number[], reason: 'pointer' | 'keyboard' | 'programmatic') => {
      onValueCommit?.(shape(committed), reason);
    },
    [onValueCommit, shape],
  );

  const marksList = useMemo(() => (marks === undefined ? [] : normaliseMarks(marks)), [marks]);

  /**
   * The APG names `aria-valuetext` for a value that is not user-friendly, and
   * gives "Monday" as its example. A mark that already carries a label is that
   * string, so a five-step quality scale announces "Medium" rather than "50".
   */
  const valueTextOf = useCallback(
    (thumbValue: number) =>
      marksList.find((mark) => mark.value === thumbValue && mark.label !== undefined)?.label ??
      formatter.format(thumbValue),
    [formatter, marksList],
  );

  /** Where the fill starts, which is an end of the scale or a point on it. */
  const originValue = origin === 'min' ? min : origin === 'max' ? max : origin;
  const first = values[0] ?? min;
  const last = values[values.length - 1] ?? min;
  const spanStart = values.length > 1 ? first : Math.min(originValue, first);
  const spanEnd = values.length > 1 ? last : Math.max(originValue, first);

  const [dragging, setDragging] = useState<number | null>(null);

  /**
   * Which way the inline arrows move, read from the element rather than from a
   * prop: a right-to-left document is a property of the page, and reading it
   * during an event rather than during render keeps the server's markup and the
   * browser's first paint identical.
   */
  const isRtl = useCallback(
    () => trackRef.current !== null && getComputedStyle(trackRef.current).direction === 'rtl',
    [],
  );

  const move = useCallback(
    (index: number, next: number, reason: ChangeReason, source: unknown) => {
      const moved = moveThumb({ ...scale, values, index, next, minStepsBetween });
      if (moved === values) return values;
      request(moved, reason, source);
      return moved;
    },
    [minStepsBetween, request, scale, values],
  );

  const valueAtPointer = useCallback(
    (event: PointerEvent) => {
      const track = trackRef.current;
      if (track === null) return null;
      const rect = track.getBoundingClientRect();
      const fraction = fractionAtPoint(
        { x: event.clientX, y: event.clientY },
        { rect, orientation: resolvedOrientation, rtl: isRtl() },
      );
      return valueAtFraction(fraction, scale);
    },
    [isRtl, resolvedOrientation, scale],
  );

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (inert || event.button !== 0) return;
    const target = valueAtPointer(event);
    if (target === null) return;

    const index = nearestThumb(values, target);
    if (index === -1) return;

    event.preventDefault();
    thumbRefs.current[index]?.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(index);
    move(index, target, 'pointer', event);
  };

  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging === null) return;
    const target = valueAtPointer(event);
    if (target === null) return;
    move(dragging, target, 'pointer', event);
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging === null) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(null);
    commit(values, 'pointer');
  };

  /**
   * The whole keyboard table, and `preventDefault()` on every key in it. The
   * inline arrows follow the reading direction — in a mirrored document
   * `ArrowRight` moves the thumb toward the end of the track the reader sees —
   * and the block arrows do not, because a scale has a direction and bidi is
   * not it.
   */
  const keyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || inert) return;

    const amount = event.shiftKey ? largeAmount : step;
    const inlineSign = isRtl() ? -1 : 1;
    const bounds = thumbBounds({ ...scale, values, index, minStepsBetween });
    const current = values[index] ?? min;

    const stepBy = (direction: number, by: number) => {
      event.preventDefault();
      const next = move(index, current + direction * by, 'keyboard', event);
      commit(next, 'keyboard');
    };

    switch (event.key) {
      case 'ArrowRight':
        stepBy(inlineSign, amount);
        return;
      case 'ArrowLeft':
        stepBy(-inlineSign, amount);
        return;
      case 'ArrowUp':
        stepBy(1, amount);
        return;
      case 'ArrowDown':
        stepBy(-1, amount);
        return;
      case 'PageUp':
        stepBy(1, largeAmount);
        return;
      case 'PageDown':
        stepBy(-1, largeAmount);
        return;
      case 'Home': {
        event.preventDefault();
        const next = move(index, bounds.min, 'keyboard', event);
        commit(next, 'keyboard');
        return;
      }
      case 'End': {
        event.preventDefault();
        const next = move(index, bounds.max, 'keyboard', event);
        commit(next, 'keyboard');
        return;
      }
      default:
    }
  };

  useImperativeHandle(
    handle,
    () => ({ focusThumb: (index = 0) => thumbRefs.current[index]?.focus() }),
    [],
  );

  /**
   * A native reset restores each element's own value and tells nothing, so the
   * family would keep the last value dragged. The form is reached through the
   * element rather than through a prop, because `form` may name a form anywhere
   * in the document.
   */
  useEffect(() => {
    const owner = thumbRefs.current[0]?.form;
    if (owner === null || owner === undefined) return;
    const onReset = () => setOwn(normaliseValues(toArray(defaultValue), scale));
    owner.addEventListener('reset', onReset);
    return () => owner.removeEventListener('reset', onReset);
    /* `defaultValue` is read once per mount, which is what uncontrolled means;
       the scale is what decides where that value lands. */
  }, [defaultValue, scale]);

  const controlId = id ?? field?.ids.control ?? generatedId;
  const markData =
    marksList.length === 0
      ? undefined
      : marksList.some((mark) => mark.label !== undefined)
        ? 'labelled'
        : 'ticks';

  const children: ReactNode = (
    <>
      {resolvedValueLabel === 'none' ? null : (
        <output data-part="output" data-part-output="" htmlFor={controlId}>
          {values.map((thumbValue) => valueTextOf(thumbValue)).join(' – ')}
        </output>
      )}
      <div
        data-part="control"
        data-part-control=""
        onPointerCancel={endDrag}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={endDrag}
      >
        <div data-part="track" data-part-track="" ref={trackRef}>
          <div
            data-part="indicator"
            data-part-indicator=""
            style={spanStyle(fractionOfValue(spanStart, scale), fractionOfValue(spanEnd, scale))}
          />
          {marksList.map((mark) => (
            <span
              data-part="mark"
              data-part-mark=""
              key={mark.value}
              style={positionStyle(fractionOfValue(mark.value, scale))}
              {...(mark.value === min ? { 'data-edge': 'start' } : {})}
              {...(mark.value === max ? { 'data-edge': 'end' } : {})}
            >
              {mark.label === undefined ? null : (
                <span data-part="mark-label" data-part-mark-label="">
                  {mark.label}
                </span>
              )}
            </span>
          ))}
          {values.map((thumbValue, index) => {
            const bounds = thumbBounds({ ...scale, values, index, minStepsBetween });
            return (
              <div
                data-index={index}
                data-part="thumb"
                data-part-thumb=""
                key={index}
                style={positionStyle(fractionOfValue(thumbValue, scale))}
                {...(dragging === index ? { 'data-active': '' } : {})}
              >
                <input
                  {...withSelectorKey(nativeProps, 'part', 'input')}
                  aria-describedby={
                    [describedBy, field?.describedBy].filter(Boolean).join(' ') || undefined
                  }
                  aria-invalid={ariaInvalid ?? (resolvedInvalid === true ? true : undefined)}
                  aria-label={thumbLabels?.[index] ?? (values.length > 1 ? undefined : ariaLabel)}
                  aria-orientation={resolvedOrientation}
                  aria-readonly={resolvedReadOnly === true ? true : undefined}
                  aria-required={ariaRequired ?? (field?.required === true ? true : undefined)}
                  aria-valuetext={valueTextOf(thumbValue)}

                  disabled={resolvedDisabled}
                  form={form}
                  id={index === 0 ? controlId : `${controlId}-${index}`}
                  max={bounds.max}
                  min={bounds.min}
                  name={name}
                  onKeyDown={keyDown(index)}
                  ref={(element: HTMLInputElement | null) => {
                    thumbRefs.current[index] = element;
                    if (index !== 0) return;
                    if (typeof ref === 'function') ref(element);
                    else if (ref !== null && ref !== undefined) ref.current = element;
                  }}
                  step={step}
                  type="range"
                  value={thumbValue}
                  /* The family moves the value; the element never moves itself,
                     and React refuses a controlled input with no handler. */
                  onChange={() => undefined}
                />
                <span aria-hidden="true" data-part="bubble" data-part-bubble="">
                  {valueTextOf(thumbValue)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  const rootProps: SliderRootProps = keyedProps({
    children,
    className,
    style,
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    ...(dragging === null ? {} : { 'data-dragging': '' }),
    ...(resolvedInvalid === true ? { 'data-invalid': '' } : {}),
    ...(markData === undefined ? {} : { 'data-marks': markData }),
    ...(resolvedReadOnly === true ? { 'data-readonly': '' } : {}),
    'data-orientation': resolvedOrientation,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'slider',
    'data-value-label': resolvedValueLabel,
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
