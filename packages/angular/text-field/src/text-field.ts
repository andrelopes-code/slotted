import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { SlField } from '@slotted/angular/field';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { writeToClipboard } from '@slotted/core/clipboard';
import {
  type PartialMessages,
  textFieldMessages,
  type TextFieldMessages,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';

import { injectTextFieldDefaults, SlTextFieldControl } from './text-field-defaults';
import type { TextFieldCopyDetail, TextFieldSize, TextFieldVariant } from './text-field-defaults';

/** How long the check stays in place of the copy mark: `code-block`'s number. */
const COPIED_FOR = 2000;

export type { TextFieldSize, TextFieldType, TextFieldVariant } from './text-field-defaults';

/**
 * The frame: one line of text, and everything that sits inside its border.
 *
 * **It is not the control.** The element carrying `data-ui` is the consumer's
 * own box with no role; the `input` inside it holds the value, the identifier
 * and every native attribute. WAI-ARIA settles the shape: a `textbox` may hold
 * only non-interactive, presentational children, so the clear and reveal
 * buttons are the control's siblings rather than its children.
 *
 * **Angular pays one element for that frame, and React pays none.** React can
 * render a wrapper from inside a component; an Angular directive cannot create
 * a box around its own host. `slTextFieldInput` injects this class, so a
 * control written without the frame is a compile-time failure rather than a
 * silent one — the property `docs/history/designs/2026-08-31-field-aware-controls-design.md`
 * asks of every control this library ships.
 */
@Component({
  selector: '[slTextField]',
  standalone: true,
  exportAs: 'slTextField',
  imports: [SlGlyph, SlIcon],
  template: `<ng-content select="[slTextFieldStart]" />
    <ng-content />
    <!-- The ring, the mark and the two buttons below stay rendered for as long
         as their capability is on, and leave through hidden, so the stylesheet
         can take them out as well as bring them in. -->
    @if (loading() !== undefined) {
      <span
        data-part="busy"
        data-part-busy=""
        data-ui="spinner"
        data-ui-spinner=""
        aria-hidden="true"
        [hidden]="!loading()"
        ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="8.875" />
          <circle cx="12" cy="12" r="8.875" pathLength="100" /></svg
      ></span>
    }
    @if (control()?.password()) {
      <span
        data-part="caps-lock"
        data-part-caps-lock=""
        aria-hidden="true"
        [hidden]="!control()!.capsLock()"
      >
        <span slIcon><svg slGlyph name="caps-lock"></svg></span>
      </span>
    }
    @if (clearable()) {
      <button
        data-part="clear"
        data-part-clear=""
        type="button"
        [hidden]="!showClear()"
        [attr.aria-label]="t('clear')"
        (click)="control()!.clear($event)"
      >
        <span slIcon><svg slGlyph name="x"></svg></span>
      </button>
    }
    @if (copyable()) {
      <button
        data-part="copy"
        data-part-copy=""
        type="button"
        [hidden]="!showCopy()"
        [attr.aria-label]="t('copy')"
        [attr.data-complete]="copied() ? '' : null"
        (click)="copy($event)"
      >
        <!-- Two blocks, so the check is a new element and arrives. -->
        @if (copied()) {
          <span slIcon><svg slGlyph name="check"></svg></span>
        } @else {
          <span slIcon><svg slGlyph name="copy"></svg></span>
        }
      </button>
    }
    @if (showReveal()) {
      <button
        data-part="reveal"
        data-part-reveal=""
        type="button"
        [attr.aria-label]="t('reveal')"
        [attr.aria-pressed]="control()!.revealed()"
        (click)="control()!.toggleReveal($event)"
      >
        @if (control()!.revealed()) {
          <span slIcon><svg slGlyph name="eye-off"></svg></span>
        } @else {
          <span slIcon><svg slGlyph name="eye"></svg></span>
        }
      </button>
    }
    <ng-content select="[slTextFieldEnd]" />`,
  styleUrl: '../../../styles/src/text-field/text-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'text-field',
    'data-ui-text-field': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-mono]': "resolvedMono() ? '' : null",
    '[attr.data-disabled]': "control()?.resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "control()?.resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "control()?.resolvedReadOnly() === true ? '' : null",
    '[attr.data-loading]': "loading() === true ? '' : null",
  },
})
export class SlTextField {
  /** Defaults to the field, then to the token, then to `md`. */
  readonly size = input<TextFieldSize | undefined>(undefined);
  /** Defaults to the token, then to `outline`. */
  readonly variant = input<TextFieldVariant | undefined>(undefined);
  /** Sets the value in the monospaced family, for identifiers, hashes and keys. */
  readonly mono = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** Draws a button that empties the value and returns focus to the control. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Draws a toggle that turns a password from dots into characters. */
  readonly revealable = input(false, { transform: booleanAttribute });
  /**
   * Draws a button that writes the value to the clipboard, shows a check for
   * two seconds and announces the outcome. It stays for a read-only value and
   * leaves while the value is empty or disabled.
   */
  readonly copyable = input(false, { transform: booleanAttribute });
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * names of the clear, copy and reveal buttons (`reveal` does not change with
   * the state), and what a copy and the Caps Lock mark announce.
   */
  readonly messages = input<PartialMessages<TextFieldMessages> | undefined>(undefined);
  /**
   * Draws the shared ring before the buttons while something about the value
   * is being checked, and marks the control `aria-busy`. The value stays
   * editable. Stating it at all — `false` included — keeps the ring's place,
   * so it can leave as well as arrive.
   */
  readonly loading = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });

  /** Once the copy button has asked the clipboard, with the outcome. */
  readonly valueCopy = output<TextFieldCopyDetail>();

  protected readonly defaults = injectTextFieldDefaults();
  private readonly element: HTMLElement = inject(ElementRef).nativeElement;
  protected readonly copied = signal(false);
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly field = inject(SlField, { optional: true });

  /**
   * The control inside. It provides itself as `SlTextFieldControl`, so the
   * frame can read whether the value is empty and whether it is a password
   * without either directive importing the other.
   */
  readonly control = contentChild(SlTextFieldControl, { descendants: true });

  readonly resolvedSize = computed(
    () => this.size() ?? this.field?.resolvedSize() ?? this.defaults.size,
  );
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedMono = computed(() => this.mono() ?? this.defaults.mono);
  /** The family's words in the language in force, with this field's `messages` laid over them. */
  readonly t = injectMessages(textFieldMessages, this.messages);

  /**
   * A button that clears an empty control, or a value the reader cannot change,
   * is a button that lies. Both cases withdraw it rather than disabling it,
   * because a disabled control in the frame is one more thing to tab past.
   */
  protected readonly showClear = computed(() => {
    const control = this.control();
    if (control === undefined || !this.clearable()) return false;
    return (
      !control.empty() && control.resolvedDisabled() !== true && control.resolvedReadOnly() !== true
    );
  });

  /** A read-only value may still be copied: only an empty or disabled one withdraws it. */
  protected readonly showCopy = computed(() => {
    const control = this.control();
    return control !== undefined && !control.empty() && control.resolvedDisabled() !== true;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.copiedTimer));
  }

  protected async copy(event: MouseEvent) {
    const reason = event.detail === 0 ? 'keyboard' : 'pointer';
    const value = this.control()?.currentValue() ?? '';
    const done = (await writeToClipboard(value)) !== 'refused';
    if (done) {
      this.copied.set(true);
      clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => this.copied.set(false), COPIED_FOR);
    }
    getLiveAnnouncer(this.element.ownerDocument).announce(
      done ? this.t('copied') : this.t('copyFailed'),
    );
    this.valueCopy.emit({ copied: done, reason, source: event, value });
  }

  /** A read-only password may still be read: only `disabled` withdraws it. */
  protected readonly showReveal = computed(() => {
    const control = this.control();
    if (control === undefined || !this.revealable()) return false;
    return control.password() && control.resolvedDisabled() !== true;
  });
}
