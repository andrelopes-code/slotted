import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { writeSelectorKey } from '@slotted/core/selector-key';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor } from '@angular/forms';
import { SlField } from '@slotted/angular/field';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlMenu, SlMenuItem, SlMenuRadioGroup, SlMenuTrigger } from '@slotted/angular/menu';
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
import type { ColorFormat, ContrastLevel, Hsva } from '@slotted/core/color';
import {
  colorPickerMessages,
  type ColorPickerMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';

import { injectColorPickerDefaults } from './color-picker-defaults';
import type { ColorPickerSize } from './color-picker-defaults';

/** The catalog key of each WCAG outcome. */
const CONTRAST_LEVEL_KEYS = {
  AAA: 'contrastLevels.AAA',
  AA: 'contrastLevels.AA',
  'AA-large': 'contrastLevels.AALarge',
  fail: 'contrastLevels.fail',
} as const satisfies Record<ContrastLevel, string>;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function sameColor(a: string, b: string): boolean {
  const pa = parseColor(a);
  const pb = parseColor(b);
  return pa !== null && pb !== null && formatColor(pa.rgba, 'hex') === formatColor(pb.rgba, 'hex');
}

function isRtl(element: Element): boolean {
  return getComputedStyle(element).direction === 'rtl';
}

function sliderStep(
  event: KeyboardEvent,
  rtl: boolean,
  small: number,
  large: number,
): number | null {
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

const optionalBoolean = (value: boolean | string | undefined) =>
  value === undefined ? undefined : booleanAttribute(value);

/**
 * Choosing a colour: an area, a hue channel, an alpha channel, the preview of
 * now beside before, the value as text with its notation and the eyedropper,
 * the presets, and the contrast against `contrastWith`.
 *
 * The value is a string in the notation shown, and it comes back in that
 * notation; every colour the stylesheet paints is written on the host as a
 * runtime property from what `@slotted/core/color` parsed. It belongs in a
 * form as it stands. React lets a consumer choose the parts by passing them as
 * children; an attribute directive cannot see what was projected before it
 * renders, so here the parts are chosen by inputs — `alpha`, `presets`,
 * `contrastWith` — and the eyedropper by the platform.
 */
@Component({
  selector: 'div[slColorPicker]',
  standalone: true,
  exportAs: 'slColorPicker',
  imports: [SlGlyph, SlIcon, SlMenu, SlMenuItem, SlMenuRadioGroup, SlMenuTrigger],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlColorPicker), multi: true },
  ],
  template: `
    <div
      data-part="area"
      data-part-area=""
      [attr.data-dragging]="dragging() === 'area' ? '' : null"
      (pointerdown)="down($event, 'area')"
      (pointermove)="move($event, 'area')"
      (pointerup)="dragging.set(null)"
      (pointercancel)="dragging.set(null)"
    >
      <div
        data-part="area-thumb"
        data-part-area-thumb=""
        role="slider"
        [attr.aria-roledescription]="t('areaRoleDescription')"
        [attr.aria-label]="t('area')"
        [attr.aria-valuetext]="percent(hsva().s) + ', ' + percent(hsva().v)"
        [attr.aria-disabled]="off() || null"
        [attr.tabindex]="resolvedDisabled() ? -1 : 0"
        (keydown)="areaKey($event)"
      ></div>
    </div>
    @for (channel of channels(); track channel) {
      <div
        data-part="channel"
        data-part-channel=""
        [attr.data-channel]="channel"
        [attr.data-dragging]="dragging() === channel ? '' : null"
        (pointerdown)="down($event, channel)"
        (pointermove)="move($event, channel)"
        (pointerup)="dragging.set(null)"
        (pointercancel)="dragging.set(null)"
      >
        <div
          data-part="channel-thumb"
          data-part-channel-thumb=""
          role="slider"
          [attr.data-channel]="channel"
          [attr.aria-label]="channel === 'hue' ? t('hue') : t('alpha')"
          aria-valuemin="0"
          [attr.aria-valuemax]="channel === 'hue' ? 360 : 100"
          [attr.aria-valuenow]="channel === 'hue' ? round(hsva().h) : round(hsva().a * 100)"
          [attr.aria-valuetext]="channel === 'hue' ? round(hsva().h) + '°' : percent(hsva().a)"
          [attr.aria-disabled]="off() || null"
          [attr.tabindex]="resolvedDisabled() ? -1 : 0"
          (keydown)="channelKey($event, channel)"
        ></div>
      </div>
    }
    <div data-part="row" data-part-row="">
      <span data-part="swatch" data-part-swatch="" role="img" [attr.aria-label]="current()"></span>
      <button
        data-part="previous"
        data-part-previous=""
        type="button"
        [attr.aria-label]="t('previous', { color: previous() ?? current() })"
        [disabled]="off()"
        (click)="request(previous() ?? current(), 'select', $event)"
      >
        <span slIcon><svg slGlyph name="rotate-ccw"></svg></span>
      </button>
      <div
        data-ui="text-field"
        data-ui-text-field=""
        data-part="root"
        data-part-root=""
        data-size="sm"
        data-variant="outline"
        data-mono=""
        [attr.data-invalid]="inputInvalid() ? '' : null"
        [attr.data-disabled]="resolvedDisabled() ? '' : null"
        [attr.data-readonly]="resolvedReadOnly() ? '' : null"
      >
        <input
          data-part="input"
          data-part-input=""
          dir="ltr"
          autocomplete="off"
          spellcheck="false"
          [attr.aria-label]="t('input')"
          [attr.aria-invalid]="inputInvalid() ? 'true' : null"
          [disabled]="resolvedDisabled()"
          [readOnly]="resolvedReadOnly()"
          [value]="draft() ?? current()"
          (input)="draft.set($any($event.target).value)"
          (keydown.enter)="$event.preventDefault(); commit($event)"
          (blur)="commit($event); onTouched()"
        />
      </div>
      <button
        data-part="format"
        data-part-format=""
        type="button"
        [attr.aria-label]="t('format', { format: resolvedFormat() })"
        [disabled]="off()"
        [slMenuTriggerFor]="formats"
      >
        {{ resolvedFormat() }}<span slIcon><svg slGlyph name="chevron-down"></svg></span>
      </button>
      <sl-menu #formats>
        <sl-menu-radio-group
          [value]="resolvedFormat()"
          (valueChange)="requestFormat($any($event), null)"
        >
          @for (format of formatNames; track format) {
            <button slMenuRadioItem [value]="format">{{ format.toUpperCase() }}</button>
          }
        </sl-menu-radio-group>
      </sl-menu>
      @if (eyedropper()) {
        <button
          data-part="eyedropper"
          data-part-eyedropper=""
          type="button"
          [attr.aria-label]="t('eyedropper')"
          [disabled]="off()"
          (click)="pick($event)"
        >
          <span slIcon><svg slGlyph name="pipette"></svg></span>
        </button>
      }
    </div>
    @if (outOfGamut()) {
      <p data-part="gamut" data-part-gamut="" role="status">
        <span slIcon><svg slGlyph name="circle-alert"></svg></span>{{ t('gamut') }}
      </p>
    }
    @if (resolvedPresets().length > 0) {
      <div
        data-part="presets"
        data-part-presets=""
        role="radiogroup"
        [attr.aria-label]="t('presets')"
      >
        @for (preset of resolvedPresets(); track preset; let index = $index) {
          <button
            data-part="preset"
            data-part-preset=""
            type="button"
            role="radio"
            [attr.aria-label]="preset"
            [attr.aria-checked]="index === selectedPreset()"
            [attr.data-selected]="index === selectedPreset() ? '' : null"
            [attr.tabindex]="index === (selectedPreset() === -1 ? 0 : selectedPreset()) ? 0 : -1"
            [style.--slotted-color-picker-preset]="preset"
            [disabled]="off()"
            (click)="choose(preset, $event)"
            (keydown)="presetKey($event, index)"
          ></button>
        }
      </div>
    }
    @if (contrast(); as measured) {
      <div
        data-part="contrast"
        data-part-contrast=""
        aria-live="polite"
        [attr.data-level]="measured.level"
      >
        <span data-part="contrast-sample" data-part-contrast-sample="" aria-hidden="true">{{
          t('contrastSample')
        }}</span>
        <span data-part="contrast-ratio" data-part-contrast-ratio="">{{ measured.ratio }}:1</span>
        <span data-part="contrast-level" data-part-contrast-level="">{{ t(measured.key) }}</span>
      </div>
    }
  `,
  styleUrls: [
    '../../../styles/src/color-picker/color-picker.css',
    '../../../styles/src/text-field/text-field.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'color-picker',
    'data-ui-color-picker': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'size() ?? field?.resolvedSize() ?? defaults.size',
    '[attr.data-format]': 'resolvedFormat()',
    '[attr.data-disabled]': "resolvedDisabled() ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() ? '' : null",
    '[attr.data-out-of-gamut]': "outOfGamut() ? '' : null",
    '[style.--slotted-color-picker-color]': 'css()',
    '[style.--slotted-color-picker-opaque]': 'opaque()',
    '[style.--slotted-color-picker-hue]': 'hsva().h',
    '[style.--slotted-color-picker-x]': 'hsva().s',
    '[style.--slotted-color-picker-y]': 'hsva().v',
    '[style.--slotted-color-picker-alpha]': 'hsva().a',
    '[style.--slotted-color-picker-previous]': 'previousCss()',
    '[style.--slotted-color-picker-contrast-with]': 'contrastCss()',
  },
})
export class SlColorPicker implements ControlValueAccessor {
  /** Present means the consumer owns the value: a colour in any supported notation. */
  readonly value = input<string | undefined>(undefined);
  readonly defaultValue = input<string | undefined>(undefined);
  /** The notation the value is written in. */
  readonly format = input<ColorFormat | undefined>(undefined);
  readonly defaultFormat = input<ColorFormat | undefined>(undefined);
  readonly alpha = input(true, { transform: booleanAttribute });
  readonly presets = input<readonly string[] | undefined>(undefined);
  /** The background the contrast is measured against; absent, no contrast is drawn. */
  readonly contrastWith = input<string | undefined>(undefined);
  readonly size = input<ColorPickerSize | undefined>(undefined);
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly readOnly = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly invalid = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  /**
   * Words laid over the catalog of the language in force, key by key: every
   * control's name, the gamut sentence and the contrast levels.
   */
  readonly messages = input<PartialMessages<ColorPickerMessages> | undefined>(undefined);

  /** Before the colour moves: `pointer`, `keyboard`, `select` or `programmatic` (the eyedropper). */
  readonly valueChange = output<ChangeRequest<string>>();
  readonly formatChange = output<ChangeRequest<ColorFormat>>();

  protected readonly defaults = injectColorPickerDefaults();
  /** The family's words in the language in force, with this picker's `messages` laid over them. */
  readonly t = injectMessages(colorPickerMessages, this.messages);
  protected readonly field = inject(SlField, { optional: true });
  private readonly element: HTMLElement = inject(ElementRef).nativeElement;
  protected readonly formatNames = COLOR_FORMATS;

  private readonly own = signal<string | undefined>(undefined);
  private readonly ownFormat = signal<ColorFormat | undefined>(undefined);
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  private readonly memory = { h: 0, s: 0 };
  protected readonly dragging = signal<'area' | 'hue' | 'alpha' | null>(null);
  protected readonly draft = signal<string | null>(null);
  protected readonly eyedropper = signal(false);
  /** The colour the panel opened with, read once after the first render. */
  protected readonly previous = signal<string | null>(null);
  private onChangeFn: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  readonly current = computed(() => this.value() ?? this.own() ?? this.defaultValue() ?? '#000000');
  private readonly parsed = computed(() => parseColor(this.current()));
  readonly resolvedFormat = computed(
    () =>
      this.format() ??
      this.ownFormat() ??
      this.defaultFormat() ??
      parseColor(this.value() ?? this.defaultValue() ?? '')?.format ??
      this.defaults.format,
  );
  protected readonly resolvedDisabled = computed(
    () => this.disabled() ?? this.formDisabled() ?? this.field?.resolvedDisabled() ?? false,
  );
  protected readonly resolvedReadOnly = computed(
    () => this.readOnly() ?? this.field?.resolvedReadOnly() ?? false,
  );
  protected readonly off = computed(() => this.resolvedDisabled() || this.resolvedReadOnly());
  protected readonly channels = computed<('hue' | 'alpha')[]>(() =>
    this.alpha() ? ['hue', 'alpha'] : ['hue'],
  );
  private readonly rgba = computed(() =>
    clampToGamut(this.parsed()?.rgba ?? { r: 0, g: 0, b: 0, a: 1 }),
  );
  protected readonly hsva = computed<Hsva>(() => {
    const next = rgbaToHsva(this.rgba());
    if (next.v === 0) next.s = this.memory.s;
    else this.memory.s = next.s;
    if (next.s === 0 || next.v === 0) next.h = this.memory.h;
    else this.memory.h = next.h;
    return next;
  });
  protected readonly css = computed(() => toCss(this.rgba()));
  protected readonly opaque = computed(() => toCss(this.rgba(), true));
  protected readonly outOfGamut = computed(() => this.parsed()?.inGamut === false);
  protected readonly draftValid = computed(() => {
    const draft = this.draft();
    return draft === null || parseColor(draft) !== null;
  });
  protected readonly resolvedInvalid = computed(
    () => this.invalid() === true || this.field?.invalid() === true,
  );
  /** The panel has no frame of its own, so a picker the form calls invalid says so on its text. */
  protected readonly inputInvalid = computed(() => !this.draftValid() || this.resolvedInvalid());
  protected readonly resolvedPresets = computed(
    () => this.presets() ?? this.defaults.presets ?? [],
  );
  protected readonly selectedPreset = computed(() =>
    this.resolvedPresets().findIndex((preset) => sameColor(preset, this.current())),
  );
  protected readonly previousCss = computed(() =>
    toCss(parseColor(this.previous() ?? this.current())?.rgba ?? this.rgba()),
  );
  private readonly background = computed(() => {
    const value = this.contrastWith();
    return value === undefined ? null : parseColor(value);
  });
  protected readonly contrastCss = computed(() => {
    const background = this.background();
    return background === null ? null : toCss(background.rgba);
  });
  protected readonly contrast = computed(() => {
    const background = this.background();
    const parsed = this.parsed();
    if (background === null || parsed === null) return null;
    const ratio = contrastRatio(parsed.rgba, background.rgba);
    const level = contrastLevel(ratio);
    return { level, ratio: ratio.toFixed(2), key: CONTRAST_LEVEL_KEYS[level] };
  });

  constructor() {
    afterNextRender(() => {
      this.previous.set(this.current());
      this.eyedropper.set('EyeDropper' in window);
      /* slMenuTriggerFor binds data-part to null outside a bar, and the
         binding is a constant: the part is written back once, the rule
         menu records for its own trigger. */
      const format = this.element.querySelector('[aria-haspopup="menu"]');
      if (format !== null) writeSelectorKey(format, 'part', 'format');
    });
  }

  protected round(value: number) {
    return Math.round(value);
  }

  protected percent(value: number) {
    return `${Math.round(value * 100)} %`;
  }

  writeValue(value: string | null | undefined) {
    if (value != null) this.own.set(value);
  }

  registerOnChange(fn: (value: string) => void) {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.formDisabled.set(isDisabled);
  }

  /** Asks to move to `next`, and moves an uncontrolled value once nobody refused. */
  request(next: string, reason: ChangeReason, source: Event | null) {
    const state = createControllable<string>({
      controlled: this.value(),
      initial: this.current(),
      onRequest: (change) => this.valueChange.emit(change),
    });
    if (state.request(next, reason, source ?? undefined)) {
      this.own.set(next);
      this.onChangeFn(next);
    }
  }

  private requestHsva(next: Hsva, reason: ChangeReason, source: Event) {
    this.memory.h = next.h;
    this.memory.s = next.s;
    const rgba = hsvaToRgba({ ...next, a: this.alpha() ? next.a : 1 });
    this.request(formatColor(rgba, this.resolvedFormat()), reason, source);
  }

  protected requestFormat(next: ColorFormat, source: Event | null) {
    const state = createControllable<ColorFormat>({
      controlled: this.format(),
      initial: this.resolvedFormat(),
      onRequest: (change) => this.formatChange.emit(change),
    });
    if (state.request(next, 'select', source ?? undefined) && this.format() === undefined) {
      this.ownFormat.set(next);
    }
    const parsed = this.parsed();
    if (parsed !== null) this.request(formatColor(parsed.rgba, next), 'select', source);
  }

  protected down(event: PointerEvent, target: 'area' | 'hue' | 'alpha') {
    if (event.button !== 0 || this.off()) return;
    const box = event.currentTarget as HTMLElement;
    box.setPointerCapture(event.pointerId);
    this.dragging.set(target);
    this.place(event, target, box);
    (box.querySelector('[role="slider"]') as HTMLElement | null)?.focus({ preventScroll: true });
  }

  protected move(event: PointerEvent, target: 'area' | 'hue' | 'alpha') {
    if (this.dragging() === target) this.place(event, target, event.currentTarget as HTMLElement);
  }

  private place(event: PointerEvent, target: 'area' | 'hue' | 'alpha', box: HTMLElement) {
    const rect = box.getBoundingClientRect();
    let x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    if (isRtl(box)) x = 1 - x;
    const hsva = this.hsva();
    if (target === 'area') this.requestHsva({ ...hsva, s: x, v: 1 - y }, 'pointer', event);
    else if (target === 'hue') this.requestHsva({ ...hsva, h: x * 360 }, 'pointer', event);
    else this.requestHsva({ ...hsva, a: x }, 'pointer', event);
  }

  protected areaKey(event: KeyboardEvent) {
    if (this.off()) return;
    const step = sliderStep(event, isRtl(this.element), 0.01, 0.1);
    if (step === null) return;
    event.preventDefault();
    const hsva = this.hsva();
    const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
    this.requestHsva(
      horizontal
        ? { ...hsva, s: clamp(hsva.s + step, 0, 1) }
        : { ...hsva, v: clamp(hsva.v + step, 0, 1) },
      'keyboard',
      event,
    );
  }

  protected channelKey(event: KeyboardEvent, channel: 'hue' | 'alpha') {
    if (this.off()) return;
    const hue = channel === 'hue';
    const max = hue ? 360 : 1;
    const hsva = this.hsva();
    const current = hue ? hsva.h : hsva.a;
    let next: number | null = null;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = max;
    else {
      const step = sliderStep(event, isRtl(this.element), hue ? 1 : 0.01, hue ? 10 : 0.1);
      if (step !== null) next = current + step;
    }
    if (next === null) return;
    event.preventDefault();
    this.requestHsva({ ...hsva, [hue ? 'h' : 'a']: clamp(next, 0, max) }, 'keyboard', event);
  }

  protected commit(event: Event) {
    const draft = this.draft();
    if (draft === null) return;
    const parsed = parseColor(draft);
    if (parsed !== null && !sameColor(draft, this.current())) {
      this.request(formatColor(parsed.rgba, this.resolvedFormat()), 'keyboard', event);
    }
    this.draft.set(null);
  }

  protected choose(preset: string, event: Event) {
    const parsed = parseColor(preset);
    if (parsed !== null)
      this.request(formatColor(parsed.rgba, this.resolvedFormat()), 'select', event);
  }

  protected presetKey(event: KeyboardEvent, index: number) {
    const rtl = isRtl(this.element);
    const forward = event.key === (rtl ? 'ArrowLeft' : 'ArrowRight') || event.key === 'ArrowDown';
    const back = event.key === (rtl ? 'ArrowRight' : 'ArrowLeft') || event.key === 'ArrowUp';
    if (!forward && !back) return;
    event.preventDefault();
    const presets = this.resolvedPresets();
    const next = (index + (forward ? 1 : -1) + presets.length) % presets.length;
    const sibling = (event.currentTarget as HTMLElement).parentElement?.children[next] as
      HTMLElement | undefined;
    sibling?.focus();
    this.choose(presets[next]!, event);
  }

  protected async pick(event: Event) {
    const EyeDropper = (
      window as unknown as {
        EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> };
      }
    ).EyeDropper;
    try {
      const { sRGBHex } = await new EyeDropper().open();
      const parsed = parseColor(sRGBHex);
      if (parsed !== null) {
        this.request(formatColor(parsed.rgba, this.resolvedFormat()), 'programmatic', event);
      }
    } catch {
      /* The reader pressed Escape: nothing was picked. */
    }
  }
}
