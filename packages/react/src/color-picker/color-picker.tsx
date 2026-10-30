import { withSelectorKey } from '@slotted/core/selector-key';
import '@slotted/styles/color-picker/color-picker.css';
import '@slotted/styles/text-field/text-field.css';

import {
  clampToGamut,
  COLOR_FORMATS,
  contrastLevel,
  contrastRatio,
  formatColor,
  hsvaToRgba,
  parseColor,
  rgbaToHsva,
  toCss,
} from '@slotted/core/color';
import type { ColorFormat, ContrastLevel, Hsva, ParsedColor } from '@slotted/core/color';
import {
  colorPickerMessages,
  type ColorPickerMessages,
  type FamilyTranslator,
} from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason } from '@slotted/core/state';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';

import { useField } from '../field';
import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { Menu, MenuContent, MenuRadioGroup, MenuRadioItem, MenuTrigger } from '../menu';
import {
  Popover,
  PopoverAnchor,
  PopoverBody,
  PopoverContent,
  PopoverLayer,
  PopoverTrigger,
} from '../popover';
import { TextField } from '../text-field';
import { useColorPickerDefaults } from './color-picker-defaults';
import type {
  ColorPickerChannelProps,
  ColorPickerDefaults,
  ColorPickerFieldProps,
  ColorPickerPartProps,
  ColorPickerProps,
  ColorPickerValueReason,
} from './color-picker.types';

const FALLBACK_COLOR = '#000000';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Whether two colour strings name the same colour, whatever their notation. */
function sameColor(a: string, b: string): boolean {
  const pa = parseColor(a);
  const pb = parseColor(b);
  if (pa === null || pb === null) return false;
  return formatColor(pa.rgba, 'hex') === formatColor(pb.rgba, 'hex');
}

function isRtl(element: Element | null): boolean {
  return element !== null && getComputedStyle(element).direction === 'rtl';
}

interface ColorState {
  alpha: boolean;
  format: ColorFormat;
  hsva: Hsva;
  parsed: ParsedColor | null;
  value: string;
  requestValue: (next: string, reason: ColorPickerValueReason, source: unknown) => void;
  requestHsva: (next: Hsva, reason: ColorPickerValueReason, source: unknown) => void;
  /** `convert` rewrites the value in the new notation; a field whose panel already did passes `false`. */
  requestFormat: (next: ColorFormat, source: unknown, convert?: boolean) => void;
}

/**
 * The value, the notation and the hue the colour itself cannot hold. A grey
 * has no hue and a black has no saturation, so the panel remembers the last
 * ones a reader set: dragging the brightness to nothing does not throw the
 * hue channel back to red.
 */
function useColorState(props: ColorPickerProps, defaults: ColorPickerDefaults): ColorState {
  const {
    alpha = true,
    defaultFormat,
    defaultValue,
    format,
    onFormatChange,
    onValueChange,
    value,
  } = props;
  const [ownValue, setOwnValue] = useState(defaultValue ?? FALLBACK_COLOR);
  const current = value ?? ownValue;
  const parsed = useMemo(() => parseColor(current), [current]);
  const [ownFormat, setOwnFormat] = useState<ColorFormat>(
    () => defaultFormat ?? parseColor(value ?? defaultValue ?? '')?.format ?? defaults.format,
  );
  const resolvedFormat = format ?? ownFormat;

  const memory = useRef({ h: 0, s: 0 });
  const hsva = useMemo(() => {
    const next = rgbaToHsva(clampToGamut(parsed?.rgba ?? { r: 0, g: 0, b: 0, a: 1 }));
    if (next.v === 0) next.s = memory.current.s;
    else memory.current.s = next.s;
    if (next.s === 0 || next.v === 0) next.h = memory.current.h;
    else memory.current.h = next.h;
    return next;
  }, [parsed]);

  const requestValue = (next: string, reason: ColorPickerValueReason, source: unknown) => {
    const state = createControllable<string>({
      controlled: value,
      initial: current,
      onRequest: (request) => onValueChange?.(request.value, request),
    });
    if (state.request(next, reason as ChangeReason, source)) setOwnValue(next);
  };

  return {
    alpha,
    format: resolvedFormat,
    hsva,
    parsed,
    value: current,
    requestValue,
    requestHsva: (next, reason, source) => {
      memory.current = { h: next.h, s: next.s };
      const rgba = hsvaToRgba({ ...next, a: alpha ? next.a : 1 });
      requestValue(formatColor(rgba, resolvedFormat), reason, source);
    },
    requestFormat: (next, source, convert = true) => {
      const state = createControllable<ColorFormat>({
        controlled: format,
        initial: resolvedFormat,
        onRequest: (request) => onFormatChange?.(request.value, request),
      });
      if (state.request(next, 'select', source) && format === undefined) setOwnFormat(next);
      if (convert && parsed !== null)
        requestValue(formatColor(parsed.rgba, next), 'select', source);
    },
  };
}

interface PickerContext extends ColorState {
  /** The family's words in the language in force, with this picker's `messages` laid over them. */
  t: FamilyTranslator<ColorPickerMessages>;
  disabled: boolean;
  /** The picker's own invalid, from its prop or its field, which its text input shows. */
  invalid: boolean;
  readOnly: boolean;
  previous: string;
  presets: readonly string[] | undefined;
  contrastWith: string | undefined;
}

const Context = createContext<PickerContext | null>(null);

function usePicker(part: string): PickerContext {
  const context = useContext(Context);
  if (context === null) throw new Error(`ColorPicker${part} must sit inside a ColorPicker`);
  return context;
}

/** Where a pointer stands inside a box, from 0 to 1 in each axis, mirrored in rtl. */
function position(event: PointerEvent<HTMLElement>, element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
  return { x: isRtl(element) ? 1 - x : x, y };
}

/** Drags with pointer capture, so the thumb follows a pointer that leaves the box. */
function useDrag(onMove: (event: PointerEvent<HTMLElement>, element: HTMLElement) => void) {
  const [dragging, setDragging] = useState(false);
  return {
    dragging,
    handlers: {
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        if (event.button !== 0) return;
        const element = event.currentTarget;
        element.setPointerCapture(event.pointerId);
        setDragging(true);
        onMove(event, element);
        (element.querySelector('[role="slider"]') as HTMLElement | null)?.focus({
          preventScroll: true,
        });
      },
      onPointerMove: (event: PointerEvent<HTMLElement>) => {
        if (dragging) onMove(event, event.currentTarget);
      },
      onPointerUp: () => setDragging(false),
      onPointerCancel: () => setDragging(false),
    },
  };
}

/** The keys of the APG slider, as a signed step; `null` for a key it does not own. */
function sliderStep(event: KeyboardEvent, rtl: boolean, small: number, large: number) {
  const step = event.shiftKey ? large : small;
  switch (event.key) {
    case 'ArrowRight':
      return rtl ? -step : step;
    case 'ArrowLeft':
      return rtl ? step : -step;
    case 'ArrowUp':
      return step;
    case 'ArrowDown':
      return -step;
    case 'PageUp':
      return large;
    case 'PageDown':
      return -large;
    default:
      return null;
  }
}

const percentText = (value: number) => `${Math.round(value * 100)} %`;

/** Saturation along the reading direction, brightness upward. */
export function ColorPickerArea({ onKeyDown, ...props }: ColorPickerPartProps) {
  const picker = usePicker('Area');
  const { hsva } = picker;
  const off = picker.disabled || picker.readOnly;
  const { dragging, handlers } = useDrag((event, element) => {
    if (off) return;
    const { x, y } = position(event, element);
    picker.requestHsva({ ...hsva, s: x, v: 1 - y }, 'pointer', event.nativeEvent);
  });

  return (
    <div
      {...props}
      {...withSelectorKey(off ? {} : handlers, 'part', 'area')}
      data-dragging={dragging ? '' : undefined}
    >
      <div
        aria-disabled={picker.disabled || undefined}
        aria-label={picker.t('area')}
        aria-roledescription={picker.t('areaRoleDescription')}
        aria-valuetext={`${percentText(hsva.s)}, ${percentText(hsva.v)}`}
        data-part="area-thumb"
        data-part-area-thumb=""
        onKeyDown={(event) => {
          onKeyDown?.(event as never);
          if (off) return;
          const rtl = isRtl(event.currentTarget);
          const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
          const step = sliderStep(event, rtl, 0.01, 0.1);
          if (step === null) return;
          event.preventDefault();
          const next = horizontal
            ? { ...hsva, s: clamp(hsva.s + step, 0, 1) }
            : { ...hsva, v: clamp(hsva.v + step, 0, 1) };
          picker.requestHsva(next, 'keyboard', event.nativeEvent);
        }}
        role="slider"
        tabIndex={picker.disabled ? -1 : 0}
      />
    </div>
  );
}

/** The hue around the circle, or the alpha from nothing to whole. */
export function ColorPickerChannel({ channel, ...props }: ColorPickerChannelProps) {
  const picker = usePicker('Channel');
  const { hsva, t } = picker;
  const off = picker.disabled || picker.readOnly;
  const hue = channel === 'hue';
  const max = hue ? 360 : 1;
  const current = hue ? hsva.h : hsva.a;
  const set = (next: number, reason: ColorPickerValueReason, source: unknown) =>
    picker.requestHsva({ ...hsva, [hue ? 'h' : 'a']: clamp(next, 0, max) }, reason, source);
  const { dragging, handlers } = useDrag((event, element) => {
    if (!off) set(position(event, element).x * max, 'pointer', event.nativeEvent);
  });

  return (
    <div
      {...props}
      {...withSelectorKey(off ? {} : handlers, 'part', 'channel')}
      data-channel={channel}
      data-dragging={dragging ? '' : undefined}
    >
      <div
        aria-disabled={picker.disabled || undefined}
        aria-label={hue ? t('hue') : t('alpha')}
        aria-valuemax={hue ? 360 : 100}
        aria-valuemin={0}
        aria-valuenow={Math.round(hue ? current : current * 100)}
        aria-valuetext={hue ? `${Math.round(current)}°` : percentText(current)}
        data-channel={channel}
        data-part="channel-thumb"
        data-part-channel-thumb=""
        onKeyDown={(event) => {
          if (off) return;
          if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            set(event.key === 'Home' ? 0 : max, 'keyboard', event.nativeEvent);
            return;
          }
          const step = sliderStep(
            event,
            isRtl(event.currentTarget),
            hue ? 1 : 0.01,
            hue ? 10 : 0.1,
          );
          if (step === null) return;
          event.preventDefault();
          set(current + step, 'keyboard', event.nativeEvent);
        }}
        role="slider"
        tabIndex={picker.disabled ? -1 : 0}
      />
    </div>
  );
}

/** Now and before: the colour being made and the one the panel opened with. */
export function ColorPickerSwatch(props: ColorPickerPartProps) {
  const picker = usePicker('Swatch');
  return (
    <>
      <span {...withSelectorKey(props, 'part', 'swatch')} aria-label={picker.value} role="img" />
      {
        <button
          aria-label={picker.t('previous', { color: picker.previous })}
          data-part="previous"
          data-part-previous=""
          disabled={picker.disabled || picker.readOnly}
          onClick={(event) => picker.requestValue(picker.previous, 'select', event.nativeEvent)}
          type="button"
        >
          <Icon>
            <Glyph name="rotate-ccw" />
          </Icon>
        </button>
      }
    </>
  );
}

/**
 * The value as text, in a `text-field` frame drawn from its stylesheet. A
 * colour the reader is still writing is marked invalid and left alone; Enter
 * or leaving the field commits it, or puts back the last valid colour.
 */
export function ColorPickerInput(props: ColorPickerPartProps) {
  const picker = usePicker('Input');
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? picker.value;
  const valid = draft === null || parseColor(draft) !== null;
  /* The panel has no frame of its own, so a picker the form calls invalid says so on its text. */
  const invalid = !valid || picker.invalid;

  const commit = (source: unknown) => {
    if (draft === null) return;
    const parsed = parseColor(draft);
    if (parsed !== null && !sameColor(draft, picker.value)) {
      picker.requestValue(formatColor(parsed.rgba, picker.format), 'keyboard', source);
    }
    setDraft(null);
  };

  return (
    <div
      {...withSelectorKey(props, 'part', 'root')}
      data-disabled={picker.disabled ? '' : undefined}
      data-invalid={invalid ? '' : undefined}
      data-mono=""

      data-readonly={picker.readOnly ? '' : undefined}
      data-size="sm"
      data-ui="text-field"
      data-ui-text-field=""
      data-variant="outline"
    >
      <input
        aria-invalid={invalid ? true : undefined}
        aria-label={picker.t('input')}
        autoComplete="off"
        data-part="input"
        data-part-input=""
        dir="ltr"
        disabled={picker.disabled}
        onBlur={(event) => commit(event.nativeEvent)}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit(event.nativeEvent);
          } else if (event.key === 'Escape' && draft !== null) {
            event.stopPropagation();
            setDraft(null);
          }
        }}
        readOnly={picker.readOnly}
        spellCheck={false}
        value={shown}
      />
    </div>
  );
}

/** The notation, as a menu of the four the picker writes. */
export function ColorPickerFormat() {
  const picker = usePicker('Format');
  return (
    <Menu>
      <MenuTrigger
        render={(props) => (
          <button
            {...withSelectorKey(props, 'part', 'format')}
            aria-label={picker.t('format', { format: picker.format })}

            disabled={picker.disabled || picker.readOnly}
          >
            {picker.format}
            <Icon>
              <Glyph name="chevron-down" />
            </Icon>
          </button>
        )}
      />
      <MenuContent>
        <MenuRadioGroup
          onValueChange={(next, request) =>
            picker.requestFormat(next as ColorFormat, (request as { source?: unknown }).source)
          }
          value={picker.format}
        >
          {COLOR_FORMATS.map((format) => (
            <MenuRadioItem key={format} value={format}>
              {format.toUpperCase()}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

interface EyeDropperResult {
  sRGBHex: string;
}

/** The platform's eyedropper, drawn only where the platform has one. */
export function ColorPickerEyedropper() {
  const picker = usePicker('Eyedropper');
  const [supported, setSupported] = useState(false);
  useEffect(() => setSupported(typeof window !== 'undefined' && 'EyeDropper' in window), []);
  if (!supported) return null;
  return (
    <button
      aria-label={picker.t('eyedropper')}
      data-part="eyedropper"
      data-part-eyedropper=""
      disabled={picker.disabled || picker.readOnly}
      onClick={async (event) => {
        const EyeDropper = (
          window as unknown as { EyeDropper: new () => { open: () => Promise<EyeDropperResult> } }
        ).EyeDropper;
        try {
          const { sRGBHex } = await new EyeDropper().open();
          const parsed = parseColor(sRGBHex);
          if (parsed !== null) {
            picker.requestValue(
              formatColor(parsed.rgba, picker.format),
              'programmatic',
              event.nativeEvent,
            );
          }
        } catch {
          /* The reader pressed Escape: nothing was picked. */
        }
      }}
      type="button"
    >
      <Icon>
        <Glyph name="pipette" />
      </Icon>
    </button>
  );
}

/** The row under the channels: the preview, the text, the notation, the eyedropper. */
export function ColorPickerRow({ children, ...props }: ColorPickerPartProps) {
  return (
    <div {...withSelectorKey(props, 'part', 'row')}>
      {children ?? (
        <>
          <ColorPickerSwatch />
          <ColorPickerInput />
          <ColorPickerFormat />
          <ColorPickerEyedropper />
        </>
      )}
    </div>
  );
}

/** A radio group of swatches; arrow keys move and choose, the radio group's own way. */
export function ColorPickerPresets(props: ColorPickerPartProps) {
  const picker = usePicker('Presets');
  const presets = picker.presets ?? [];
  if (presets.length === 0) return null;
  const selected = presets.findIndex((preset) => sameColor(preset, picker.value));
  const off = picker.disabled || picker.readOnly;
  const choose = (preset: string, source: unknown) => {
    const parsed = parseColor(preset);
    if (parsed !== null)
      picker.requestValue(formatColor(parsed.rgba, picker.format), 'select', source);
  };

  return (
    <div
      {...withSelectorKey(props, 'part', 'presets')}
      aria-label={picker.t('presets')}
      role="radiogroup"
    >
      {presets.map((preset, index) => (
        <button
          aria-checked={index === selected}
          aria-label={preset}
          data-part="preset"
          data-part-preset=""
          data-selected={index === selected ? '' : undefined}
          disabled={off}
          key={preset}
          onClick={(event) => choose(preset, event.nativeEvent)}
          onKeyDown={(event) => {
            const rtl = isRtl(event.currentTarget);
            const forward =
              event.key === (rtl ? 'ArrowLeft' : 'ArrowRight') || event.key === 'ArrowDown';
            const back =
              event.key === (rtl ? 'ArrowRight' : 'ArrowLeft') || event.key === 'ArrowUp';
            if (!forward && !back) return;
            event.preventDefault();
            const next = (index + (forward ? 1 : -1) + presets.length) % presets.length;
            const sibling = event.currentTarget.parentElement?.children[next] as
              HTMLElement | undefined;
            sibling?.focus();
            choose(presets[next]!, event.nativeEvent);
          }}
          role="radio"
          style={{ '--slotted-color-picker-preset': preset } as CSSProperties}
          tabIndex={index === (selected === -1 ? 0 : selected) ? 0 : -1}
          type="button"
        />
      ))}
    </div>
  );
}

/** The catalog key of each WCAG outcome. */
const CONTRAST_LEVEL_KEYS = {
  AAA: 'contrastLevels.AAA',
  AA: 'contrastLevels.AA',
  'AA-large': 'contrastLevels.AALarge',
  fail: 'contrastLevels.fail',
} as const satisfies Record<ContrastLevel, string>;

/** `Aa` in the colour over the named background, the WCAG ratio, and the level in words. */
export function ColorPickerContrast(props: ColorPickerPartProps) {
  const picker = usePicker('Contrast');
  const background = picker.contrastWith === undefined ? null : parseColor(picker.contrastWith);
  if (background === null || picker.parsed === null) return null;
  const ratio = contrastRatio(picker.parsed.rgba, background.rgba);
  const level = contrastLevel(ratio);
  return (
    <div {...withSelectorKey(props, 'part', 'contrast')} aria-live="polite" data-level={level}>
      <span aria-hidden="true" data-part="contrast-sample" data-part-contrast-sample="">
        {picker.t('contrastSample')}
      </span>
      <span data-part="contrast-ratio" data-part-contrast-ratio="">
        {ratio.toFixed(2)}:1
      </span>
      <span data-part="contrast-level" data-part-contrast-level="">
        {picker.t(CONTRAST_LEVEL_KEYS[level])}
      </span>
    </div>
  );
}

/** Said when the value lies outside sRGB, instead of clipping it in silence. */
export function ColorPickerGamut(props: ColorPickerPartProps) {
  const picker = usePicker('Gamut');
  if (picker.parsed === null || picker.parsed.inGamut) return null;
  return (
    <p {...withSelectorKey(props, 'part', 'gamut')} role="status">
      <Icon>
        <Glyph name="circle-alert" />
      </Icon>
      {picker.t('gamut')}
    </p>
  );
}

/**
 * Choosing a colour: an area, a hue channel, an alpha channel, the preview,
 * the value as text with its notation and the eyedropper, the presets, and the
 * contrast. With no children it draws all of them; with children, exactly the
 * parts given.
 *
 * The value is a string in the notation the reader chose, and it comes back
 * in that notation. Every colour the stylesheet paints is written here as a
 * runtime property from what `@slotted/core/color` parsed.
 */
export function ColorPicker({
  alpha,
  children,
  contrastWith,
  defaultFormat,
  defaultValue,
  disabled,
  format,
  invalid,
  messages,
  onFormatChange,
  onValueChange,
  presets,
  readOnly,
  size,
  style,
  value,
  ...nativeProps
}: ColorPickerProps) {
  const defaults = useColorPickerDefaults();
  const t = useMessages(colorPickerMessages, messages);
  const field = useField();
  const state = useColorState(
    { alpha, defaultFormat, defaultValue, format, onFormatChange, onValueChange, value },
    defaults,
  );
  const [previous] = useState(() => state.value);
  const resolvedDisabled = disabled ?? field?.disabled ?? false;
  const resolvedReadOnly = readOnly ?? field?.readOnly ?? false;
  const resolvedInvalid = invalid ?? field?.invalid;

  const rgba = clampToGamut(state.parsed?.rgba ?? { r: 0, g: 0, b: 0, a: 1 });
  const background = contrastWith === undefined ? null : parseColor(contrastWith);
  const runtime = {
    '--slotted-color-picker-color': toCss(rgba),
    '--slotted-color-picker-opaque': toCss(rgba, true),
    '--slotted-color-picker-hue': state.hsva.h,
    '--slotted-color-picker-x': state.hsva.s,
    '--slotted-color-picker-y': state.hsva.v,
    '--slotted-color-picker-alpha': state.hsva.a,
    '--slotted-color-picker-previous': toCss(parseColor(previous)?.rgba ?? rgba),
    ...(background === null
      ? {}
      : { '--slotted-color-picker-contrast-with': toCss(background.rgba) }),
  } as CSSProperties;

  const context: PickerContext = {
    ...state,
    contrastWith,
    disabled: resolvedDisabled,
    invalid: resolvedInvalid === true,
    presets: presets ?? defaults.presets,
    previous,
    readOnly: resolvedReadOnly,
    t,
  };

  return (
    <Context.Provider value={context}>
      <div
        {...withSelectorKey(nativeProps, 'part', 'root')}
        data-disabled={resolvedDisabled ? '' : undefined}
        data-format={state.format}
        data-invalid={resolvedInvalid === true ? '' : undefined}
        data-out-of-gamut={state.parsed !== null && !state.parsed.inGamut ? '' : undefined}

        data-readonly={resolvedReadOnly ? '' : undefined}
        data-size={size ?? field?.size ?? defaults.size}
        data-ui="color-picker"
        data-ui-color-picker=""
        style={{ ...runtime, ...style }}
      >
        {children ?? (
          <>
            <ColorPickerArea />
            <ColorPickerChannel channel="hue" />
            {state.alpha ? <ColorPickerChannel channel="alpha" /> : null}
            <ColorPickerRow />
            <ColorPickerGamut />
            <ColorPickerPresets />
            <ColorPickerContrast />
          </>
        )}
      </div>
    </Context.Provider>
  );
}

/**
 * A `text-field` holding a colour: the swatch in its start opens the panel in
 * a popover, and the value can be typed in any notation. The text is the
 * field's control, so a `Field` label names it.
 */
export function ColorField({
  alpha,
  children,
  contrastWith,
  defaultFormat,
  defaultOpen,
  defaultValue,
  format,
  messages,
  onBlur,
  onFormatChange,
  onKeyDown,
  onOpenChange,
  onValueChange,
  open,
  presets,
  size,
  value,
  ...textFieldProps
}: ColorPickerFieldProps) {
  const defaults = useColorPickerDefaults();
  const t = useMessages(colorPickerMessages, messages);
  const state = useColorState(
    { alpha, defaultFormat, defaultValue, format, onFormatChange, onValueChange, value },
    defaults,
  );
  const [draft, setDraft] = useState<string | null>(null);
  const [opens, setOpens] = useState(0);
  const rgba = clampToGamut(state.parsed?.rgba ?? { r: 0, g: 0, b: 0, a: 1 });
  const valid = draft === null || parseColor(draft) !== null;

  const commit = (source: unknown) => {
    if (draft === null) return;
    const parsed = parseColor(draft);
    if (parsed !== null && !sameColor(draft, state.value)) {
      state.requestValue(formatColor(parsed.rgba, state.format), 'keyboard', source);
    }
    setDraft(null);
  };

  return (
    <Popover
      align="start"
      side="bottom"
      {...(open === undefined ? {} : { open })}
      {...(defaultOpen === undefined ? {} : { defaultOpen })}
      onOpenChange={(next, request) => {
        if (next) setOpens((count) => count + 1);
        onOpenChange?.(next, request as never);
      }}
    >
      <PopoverAnchor>
        <TextField
          {...textFieldProps}
          dir="ltr"
          invalid={textFieldProps.invalid ?? (valid ? undefined : true)}
          mono
          onBlur={(event) => {
            onBlur?.(event);
            commit(event.nativeEvent);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.key === 'Enter') {
              event.preventDefault();
              commit(event.nativeEvent);
            }
          }}
          onValueChange={(next) => setDraft(next)}
          {...(size === undefined ? {} : { size })}
          spellCheck={false}
          start={
            <PopoverTrigger
              render={(props) => (
                <button
                  {...withSelectorKey(props, 'part', 'trigger')}
                  aria-label={t('trigger')}

                  data-ui="color-picker"
                  data-ui-color-picker=""
                  disabled={textFieldProps.disabled}
                  style={{ '--slotted-color-picker-color': toCss(rgba) } as CSSProperties}
                  type="button"
                />
              )}
            />
          }
          value={draft ?? state.value}
        />
      </PopoverAnchor>
      <PopoverLayer>
        <PopoverContent aria-label={t('trigger')}>
          <PopoverBody>
            <ColorPicker
              alpha={state.alpha}
              contrastWith={contrastWith}
              format={state.format}
              key={opens}
              messages={messages}
              onFormatChange={(next, request) => state.requestFormat(next, request.source, false)}
              onValueChange={(next, request) =>
                state.requestValue(next, request.reason as ColorPickerValueReason, request.source)
              }
              presets={presets}
              value={state.value}
            >
              {children}
            </ColorPicker>
          </PopoverBody>
        </PopoverContent>
      </PopoverLayer>
    </Popover>
  );
}
