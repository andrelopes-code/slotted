import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  forwardRef,
  HostAttributeToken,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { SlInlineMessage } from '@slotted/angular/inline-message';
import { fieldMessages, type FieldMessages, type PartialMessages } from '@slotted/core/i18n';

import {
  deriveFieldIds,
  FIELD_DESCRIBED_ORDER,
  injectFieldDefaults,
  SlFieldContext,
  SlFieldDefaultsSource,
  SlFieldHeaderSlot,
  SlFieldHelpSlot,
  SlFieldIdFactory,
  SlFieldIndicatorSlot,
} from './field-defaults';
import type { FieldLabelPlacement, FieldNecessity, FieldSize, FieldWidth } from './field-defaults';
import { formatFieldCount, isFieldCountOver, SlFieldCounter } from './field-counter';
import type { FieldCount } from './field-counter';
import { SlFieldDescription, SlFieldError } from './field-messages';

export type { FieldCount } from './field-counter';
export type {
  FieldIds,
  FieldLabelPlacement,
  FieldNecessity,
  FieldSize,
  FieldWidth,
} from './field-defaults';

/**
 * One control, its name, its necessity, its help and its error — and the
 * identifiers that bind the four together.
 *
 * **Every shared state is unset rather than `false`.** `disabled`, `invalid`,
 * `required` and `readOnly` default to `undefined`, so a field defers to the
 * `slFieldGroup` around it and the group to the application. A field that
 * defaulted to `false` could not be told from a consumer saying "not disabled",
 * and it would quietly override a disabled section.
 *
 * **The identifiers are derived, not registered.** One base yields four, so
 * `label[for]` resolves to the identifier the control will use with no ordering
 * dependency between siblings and nothing to coordinate during hydration.
 *
 * **The field renders its own messages.** The page writes what it wants said —
 * `<span slFieldError>` — and the field puts it inside an `inline-message` it
 * renders itself, with the identifier, the step and the disabled state already
 * resolved. `SlInlineMessage` takes its values as `input()` signals, and nothing
 * outside the template that instantiates it can write one; a directive sharing
 * the element could only set attributes its host bindings would overwrite. A
 * message the page did not write is not drawn, which is the DOM React's
 * `FieldDescription` and `FieldError` produce.
 */
@Component({
  selector: '[slField]',
  standalone: true,
  exportAs: 'slField',
  imports: [SlInlineMessage],
  template: `<ng-content select="[slFieldLabel], [slFieldHeader]" />
    <ng-content select="[slFieldCounter]" />
    @if (drawnCount(); as count) {
      <span
        data-part="counter"
        data-part-counter=""
        [id]="ids().counter"
        [attr.data-invalid]="countOver() ? '' : null"
        >{{ formatCount(count) }}</span
      >
    }
    <ng-content />
    @if (description(); as message) {
      <p
        slInlineMessage
        [id]="ids().description"
        [size]="messageSize()"
        [disabled]="resolvedDisabled()"
        [mark]="message.mark() ?? 'none'"
        [tone]="message.tone() ?? 'secondary'"
        [live]="message.live() ?? 'off'"
        [hideIcon]="message.hideIcon() ?? false"
        [reserve]="message.reserve() ?? false"
        [prefix]="message.prefix()"
      >
        <ng-content select="[slFieldDescription]" />
      </p>
    }
    @if (error(); as message) {
      <p
        slInlineMessage
        [id]="ids().error"
        [size]="messageSize()"
        [disabled]="resolvedDisabled()"
        [mark]="message.mark() ?? 'none'"
        [tone]="message.tone() ?? 'danger'"
        [live]="message.live() ?? 'off'"
        [hideIcon]="message.hideIcon() ?? false"
        [reserve]="message.reserve() ?? false"
        [prefix]="message.prefix()"
      >
        <ng-content select="[slFieldError]" />
      </p>
    }`,
  styleUrl: '../../../styles/src/field/field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: SlFieldContext, useExisting: forwardRef(() => SlField) }],
  host: {
    'data-ui': 'field',
    'data-ui-field': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-label-placement]': 'resolvedLabelPlacement()',
    '[attr.data-necessity]': 'resolvedNecessity()',
    '[attr.data-width]': 'width()',
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "invalid() === true ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() === true ? '' : null",
    '[attr.data-required]': "required() === true ? '' : null",
  },
})
export class SlField {
  /** Defaults to the token, then to `md`. */
  readonly size = input<FieldSize | undefined>(undefined);
  /** Defaults to the token, then to `top`. */
  readonly labelPlacement = input<FieldLabelPlacement | undefined>(undefined);
  /** Defaults to the token, then to `mark`. */
  readonly necessity = input<FieldNecessity | undefined>(undefined);
  readonly width = input<FieldWidth>('full');
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * necessity words (`optional`, `required`) and the help control's name (`help`).
   */
  readonly messages = input<PartialMessages<FieldMessages> | undefined>(undefined);

  /**
   * Unstated rather than `false`, so the field defers to its group and the group
   * to the application. Stated, it wins, and it reaches the control as the
   * native attribute: removing it from the tab order and from submission is what
   * the word means.
   */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** Unstated rather than `false`. Reaches the control as `aria-invalid`. */
  readonly invalid = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /**
   * Unstated rather than `false`. Reaches the control as `aria-required` and
   * never as the native `required`, which would engage browser constraint
   * validation and change submit behaviour.
   */
  readonly required = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** Unstated rather than `false`. Reaches the control as the native `readonly`. */
  readonly readOnly = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });

  /**
   * What the control inside published about its value. A control this library
   * ships calls `setCount`; the field draws the counter in the spare column of
   * its label row — the header draws it at its own end when there is one — and
   * only when the page wrote none of its own.
   */
  private readonly countState = signal<FieldCount | undefined>(undefined);
  /** The counter the page wrote, anywhere in the field. */
  readonly writtenCounter = contentChild(SlFieldCounter, { descendants: true });
  protected readonly header = contentChild(SlFieldHeaderSlot);
  protected readonly help = contentChild(SlFieldHelpSlot, { descendants: true });
  protected readonly indicator = contentChild(SlFieldIndicatorSlot, { descendants: true });
  protected readonly drawnCount = computed(() =>
    this.writtenCounter() === undefined && this.header() === undefined
      ? this.countState()
      : undefined,
  );
  protected readonly countOver = computed(() => {
    const count = this.drawnCount();
    return count !== undefined && isFieldCountOver(count);
  });
  protected readonly formatCount = formatFieldCount;

  /** The count a control this library ships publishes, whenever its value changes. */
  setCount(count: FieldCount | undefined) {
    this.countState.set(count);
  }

  /** What the control published, for a page that draws the counter itself. */
  readonly count = this.countState.asReadonly();

  private readonly token = injectFieldDefaults();
  /**
   * The group around this field, if there is one. It answers before the
   * application's own token, and it is read on every change rather than
   * captured, because Angular binds a component's inputs after it has created
   * the directives its template declares.
   */
  private readonly source = inject(SlFieldDefaultsSource, { optional: true });
  private readonly defaults = computed(() => this.source?.fieldDefaults() ?? this.token);

  /**
   * The base every identifier is derived from. A consumer's own `id` is the
   * base and stays on the element; the generated one is not written anywhere,
   * because the field is addressable through its parts rather than as a box.
   */
  private readonly base =
    inject(new HostAttributeToken('id'), { optional: true }) ?? inject(SlFieldIdFactory).next();

  readonly ids = computed(() => deriveFieldIds(this.base));

  /**
   * Direct content rather than any descendant: a field nested inside another
   * field's control — a composed control, a fieldset of its own — must not have
   * its message read as this field's.
   */
  protected readonly description = contentChild(SlFieldDescription, { descendants: false });
  protected readonly error = contentChild(SlFieldError, { descendants: false });

  readonly resolvedSize = computed(() => this.size() ?? this.defaults().size);
  readonly resolvedLabelPlacement = computed(
    () => this.labelPlacement() ?? this.defaults().labelPlacement,
  );
  readonly resolvedNecessity = computed(() => this.necessity() ?? this.defaults().necessity);
  readonly resolvedDisabled = computed(() => this.disabled() ?? this.defaults().disabled);
  readonly resolvedReadOnly = computed(() => this.readOnly() ?? this.defaults().readOnly);
  /** The field's words in the language in force, with this field's `messages` laid over them. */
  readonly t = injectMessages(fieldMessages, this.messages);

  /**
   * A message is quieter than the control it is about, so it starts one step
   * below and only the largest field's message reaches the second step.
   */
  protected readonly messageSize = computed<'sm' | 'md'>(() =>
    this.resolvedSize() === 'lg' ? 'md' : 'sm',
  );

  /**
   * The contract's order, and only the parts with something to say: the
   * indicator, the help, the description, the count, the error. Known slots
   * have one correct reading order, so it is stated rather than read from the
   * DOM. The count is there whenever one is drawn — the page's, or the one the
   * field or its header draws from what the control published.
   */
  readonly describedBy = computed(() => {
    const present = {
      counter: this.writtenCounter() !== undefined || this.countState() !== undefined,
      description: this.description()?.hasContent() === true,
      error: this.error()?.hasContent() === true,
      help: this.help() !== undefined,
      indicator: this.indicator() !== undefined,
    };
    const ids = this.ids();
    const parts = FIELD_DESCRIBED_ORDER.filter((slot) => present[slot]).map((slot) => ids[slot]);
    return parts.length === 0 ? null : parts.join(' ');
  });
}
