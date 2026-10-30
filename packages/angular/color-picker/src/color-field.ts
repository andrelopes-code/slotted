import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  HostAttributeToken,
  inject,
  input,
  model,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor } from '@angular/forms';
import {
  SlPopover,
  SlPopoverAnchor,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverLayer,
  SlPopoverTrigger,
} from '@slotted/angular/popover';
import { injectMessages } from '@slotted/angular/i18n';
import { SlTextField, SlTextFieldInput, SlTextFieldStart } from '@slotted/angular/text-field';
import { clampToGamut, formatColor, parseColor, toCss } from '@slotted/core/color';
import type { ColorFormat } from '@slotted/core/color';
import {
  colorPickerMessages,
  type ColorPickerMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';

import { SlColorPicker } from './color-picker';
import { injectColorPickerDefaults } from './color-picker-defaults';
import type { ColorPickerSize } from './color-picker-defaults';

function sameColor(a: string, b: string): boolean {
  const pa = parseColor(a);
  const pb = parseColor(b);
  return pa !== null && pb !== null && formatColor(pa.rgba, 'hex') === formatColor(pb.rgba, 'hex');
}

/**
 * A `text-field` holding a colour: the swatch in its start opens the panel in
 * a popover, and the value can be typed in any notation and is kept in the
 * one shown. The text is the field's control, so a `slField` label names it;
 * the host is the consumer's element and the form control.
 */
@Component({
  selector: 'div[slColorField]',
  standalone: true,
  exportAs: 'slColorField',
  imports: [
    SlColorPicker,
    SlPopover,
    SlPopoverAnchor,
    SlPopoverBody,
    SlPopoverContent,
    SlPopoverLayer,
    SlPopoverTrigger,
    SlTextField,
    SlTextFieldInput,
    SlTextFieldStart,
  ],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlColorField), multi: true },
  ],
  template: `
    <ng-container slPopover side="bottom" align="start" [(open)]="open">
      <div slTextField slPopoverAnchor mono [size]="size()">
        <span slTextFieldStart>
          <button
            slPopoverTrigger
            type="button"
            data-ui="color-picker"
            data-ui-color-picker=""
            data-part="trigger"
            data-part-trigger=""
            [attr.aria-label]="t('trigger')"
            [disabled]="resolvedDisabled()"
            [style.--slotted-color-picker-color]="css()"
          ></button>
        </span>
        <input
          slTextFieldInput
          dir="ltr"
          spellcheck="false"
          autocomplete="off"
          [attr.aria-label]="label"
          [disabled]="resolvedDisabled()"
          [invalid]="draftValid() ? undefined : true"
          [value]="draft() ?? current()"
          (valueChange)="draft.set($event.value)"
          (keydown.enter)="$event.preventDefault(); commit($event)"
          (blur)="commit($event); onTouched()"
        />
      </div>
      <ng-template slPopoverLayer>
        <div slPopoverContent [attr.aria-label]="t('trigger')">
          <div slPopoverBody>
            <div
              slColorPicker
              [value]="current()"
              [format]="resolvedFormat()"
              [alpha]="alpha()"
              [presets]="presets()"
              [contrastWith]="contrastWith()"
              [messages]="messages()"
              (valueChange)="request($event.value, $event.reason, $event.source)"
              (formatChange)="ownFormat.set($event.value); formatChange.emit($event)"
            ></div>
          </div>
        </div>
      </ng-template>
    </ng-container>
  `,
  /* The swatch's stylesheet: carried by the panel alone, it arrived on the first open. */
  styleUrls: ['../../../styles/src/color-picker/color-picker.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[attr.aria-label]': 'null' },
})
export class SlColorField implements ControlValueAccessor {
  readonly value = input<string | undefined>(undefined);
  readonly defaultValue = input<string | undefined>(undefined);
  readonly format = input<ColorFormat | undefined>(undefined);
  readonly alpha = input(true, { transform: booleanAttribute });
  readonly presets = input<readonly string[] | undefined>(undefined);
  readonly contrastWith = input<string | undefined>(undefined);
  readonly size = input<ColorPickerSize | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Words laid over the catalog of the language in force, for the trigger and the panel. */
  readonly messages = input<PartialMessages<ColorPickerMessages> | undefined>(undefined);
  /** Whether the panel is open. */
  readonly open = model(false);

  readonly valueChange = output<ChangeRequest<string>>();
  readonly formatChange = output<ChangeRequest<ColorFormat>>();

  protected readonly defaults = injectColorPickerDefaults();
  /** The family's words in the language in force, with this field's `messages` laid over them. */
  readonly t = injectMessages(colorPickerMessages, this.messages);
  /** The consumer's name for the field, moved onto the text it names. */
  protected readonly label = inject(new HostAttributeToken('aria-label'), { optional: true });

  private readonly own = signal<string | undefined>(undefined);
  protected readonly ownFormat = signal<ColorFormat | undefined>(undefined);
  private readonly formDisabled = signal(false);
  protected readonly draft = signal<string | null>(null);
  private onChangeFn: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  readonly current = computed(() => this.value() ?? this.own() ?? this.defaultValue() ?? '#000000');
  protected readonly resolvedFormat = computed(
    () =>
      this.format() ??
      this.ownFormat() ??
      parseColor(this.current())?.format ??
      this.defaults.format,
  );
  protected readonly resolvedDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly css = computed(() =>
    toCss(clampToGamut(parseColor(this.current())?.rgba ?? { r: 0, g: 0, b: 0, a: 1 })),
  );
  protected readonly draftValid = computed(() => {
    const draft = this.draft();
    return draft === null || parseColor(draft) !== null;
  });

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

  protected request(next: string, reason: ChangeReason, source: unknown) {
    const state = createControllable<string>({
      controlled: this.value(),
      initial: this.current(),
      onRequest: (change) => this.valueChange.emit(change),
    });
    if (state.request(next, reason, source)) {
      this.own.set(next);
      this.onChangeFn(next);
    }
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
}
