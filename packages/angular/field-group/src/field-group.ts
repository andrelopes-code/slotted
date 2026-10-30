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
  ViewEncapsulation,
} from '@angular/core';
import {
  injectFieldDefaults,
  SlFieldDefaultsSource,
  SlFieldIdFactory,
} from '@slotted/angular/field';
import type {
  FieldDefaults,
  FieldLabelPlacement,
  FieldNecessity,
  FieldSize,
} from '@slotted/angular/field';
import { injectMessages } from '@slotted/angular/i18n';
import { SlInlineMessage } from '@slotted/angular/inline-message';
import { fieldMessages, type FieldMessages, type PartialMessages } from '@slotted/core/i18n';

import { SlFieldGroupDescription, SlFieldGroupError } from './field-group-parts';

/**
 * Whether the group asks something. A `question` (a set of radios) states its
 * own necessity on the legend; a `section` ("Address") is a topic, and says
 * nothing about it.
 */
export type FieldGroupKind = 'question' | 'section';

/** How the fields inside the group flow. */
export type FieldGroupOrientation = 'vertical' | 'horizontal';

/** The three identifiers a group derives from one base. */
export interface FieldGroupIds {
  description: string;
  error: string;
  legend: string;
}

/**
 * A set of fields under one name.
 *
 * **The platform does the work.** The element is a native `fieldset` and the
 * name is a native `legend` — the technique the APG's naming practice calls for
 * under its Rule 3, prefer native techniques — so the `group` role and the
 * accessible name arrive without a single ARIA attribute. `disabled` is the
 * native attribute, and every control inside is disabled by the browser with
 * nothing passed down.
 *
 * **What is said about the set is said before the set.** The description and
 * the error come between the legend and the fields, which is where GOV.UK's
 * fieldset example puts a hint and an error, and the opposite of where a single
 * field puts its own. A message the page did not write is not drawn, which is
 * the DOM React's `FieldGroupDescription` and `FieldGroupError` produce.
 *
 * **`aria-describedby` goes on the fieldset.** A reader entering any control in
 * the group hears the group's hint and its error once, from the element that
 * names them both. A message with no text — a reserved line waiting for its
 * text — keeps its box and is not named until the text arrives.
 *
 * **The group provides for its fields.** It answers `SlFieldDefaultsSource` for
 * its own subtree, so `size`, `labelPlacement`, `necessity`, the necessity
 * words, `disabled` and `readOnly` reach every field inside — the same six an
 * application sets once with `provideFieldDefaults()`. `required` is not among
 * them: it is a fact about one value, and a section cannot know it.
 */
@Component({
  selector: 'fieldset[slFieldGroup]',
  standalone: true,
  exportAs: 'slFieldGroup',
  imports: [SlInlineMessage],
  template: `<ng-content select="[slFieldGroupLegend]" />
    @if (description(); as message) {
      <p
        slInlineMessage
        [id]="ids().description"
        [size]="messageSize()"
        [mark]="message.mark() ?? 'none'"
        [tone]="message.tone() ?? 'secondary'"
        [live]="message.live() ?? 'off'"
        [hideIcon]="message.hideIcon() ?? false"
        [reserve]="message.reserve() ?? false"
        [prefix]="message.prefix()"
      >
        <ng-content select="[slFieldGroupDescription]" />
      </p>
    }
    @if (error(); as message) {
      <p
        slInlineMessage
        [id]="ids().error"
        [size]="messageSize()"
        [mark]="message.mark() ?? 'none'"
        [tone]="message.tone() ?? 'danger'"
        [live]="message.live() ?? 'off'"
        [hideIcon]="message.hideIcon() ?? false"
        [reserve]="message.reserve() ?? false"
        [prefix]="message.prefix()"
      >
        <ng-content select="[slFieldGroupError]" />
      </p>
    }
    <div data-part="content" data-part-content=""><ng-content /></div>`,
  styleUrl: '../../../styles/src/field-group/field-group.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: SlFieldDefaultsSource, useExisting: forwardRef(() => SlFieldGroup) }],
  host: {
    'data-ui': 'field-group',
    'data-ui-field-group': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-kind]': 'kind()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-necessity]': 'resolvedNecessity()',
    '[attr.data-disabled]': "disabled() === true ? '' : null",
    '[attr.data-invalid]': "invalid() === true ? '' : null",
    '[attr.data-readonly]': "readOnly() === true ? '' : null",
    '[attr.data-required]': "required() === true ? '' : null",
    '[attr.disabled]': "disabled() === true ? '' : null",
    '[attr.aria-describedby]': 'describedBy()',
  },
})
export class SlFieldGroup extends SlFieldDefaultsSource {
  /** Provided to every field inside. Defaults to the token, then to `md`. */
  readonly size = input<FieldSize | undefined>(undefined);
  /** How the fields inside flow. */
  readonly orientation = input<FieldGroupOrientation>('vertical');
  /** Provided to every field inside. Defaults to the token, then to `mark`. */
  readonly necessity = input<FieldNecessity | undefined>(undefined);
  /**
   * Words laid over the field catalog of the language in force for the
   * legend's own necessity word (`optional`, `required`). A field inside
   * states its own `messages`.
   */
  readonly messages = input<PartialMessages<FieldMessages> | undefined>(undefined);
  /** Provided to every field inside, unless the field states its own. */
  readonly labelPlacement = input<FieldLabelPlacement | undefined>(undefined);

  /**
   * The native attribute on the `fieldset`, which the platform propagates to
   * every control inside with nothing passed down. It is provided to the fields
   * as well, because the platform disables controls and a label is not one.
   */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** A `section` draws no necessity on its legend. */
  readonly kind = input<FieldGroupKind>('question');
  /** Unstated rather than `false`. Writes `data-invalid` on the fieldset. */
  readonly invalid = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** Draws the necessity marker on the legend, and is not provided to the fields. */
  readonly required = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** Provided to every field inside, unless the field states its own. */
  readonly readOnly = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });

  /**
   * The application's own defaults, or an outer group's. A group inside a group
   * answers for the inner one and inherits everything it does not restate.
   */
  private readonly outer = inject(SlFieldDefaultsSource, { optional: true, skipSelf: true });
  private readonly token = injectFieldDefaults();
  private readonly inherited = computed(() => this.outer?.fieldDefaults() ?? this.token);

  private readonly base =
    inject(new HostAttributeToken('id'), { optional: true }) ??
    `${inject(SlFieldIdFactory).next()}-group`;

  private readonly writtenDescribedBy = inject(new HostAttributeToken('aria-describedby'), {
    optional: true,
  });

  readonly ids = computed<FieldGroupIds>(() => ({
    description: `${this.base}-description`,
    error: `${this.base}-error`,
    legend: `${this.base}-legend`,
  }));

  /**
   * The group's own markers rather than the field's, and direct content rather
   * than any descendant — so a description written inside one of the fields is
   * never read as the set's.
   */
  protected readonly description = contentChild(SlFieldGroupDescription, { descendants: false });
  protected readonly error = contentChild(SlFieldGroupError, { descendants: false });

  readonly resolvedSize = computed(() => this.size() ?? this.inherited().size);
  readonly resolvedNecessity = computed(() => this.necessity() ?? this.inherited().necessity);
  /** The field family's words in the language in force, with the group's `messages` laid over them. */
  readonly t = injectMessages(fieldMessages, this.messages);

  /**
   * One step louder than a field's own. `inline-message` defines `md` as the
   * message of a section and `sm` as the message of a field, and what a group
   * says is about the section — held at the field's step, the sentence about a
   * whole set read as the help under the control above it.
   */
  protected readonly messageSize = computed<'sm' | 'md'>(() =>
    this.resolvedSize() === 'sm' ? 'sm' : 'md',
  );

  protected readonly describedBy = computed(() => {
    const parts = [
      this.writtenDescribedBy,
      this.description()?.hasContent() ? this.ids().description : undefined,
      this.error()?.hasContent() ? this.ids().error : undefined,
    ].filter(Boolean);
    return parts.length === 0 ? null : parts.join(' ');
  });

  /**
   * What every field inside reads instead of the application's own defaults.
   *
   * It is a method rather than a value handed over once, because Angular
   * creates every directive a template declares before it binds any input: a
   * group that provided a snapshot would hand its fields the value its inputs
   * held before the consumer's bindings ran.
   */
  fieldDefaults(): FieldDefaults {
    return {
      disabled: this.disabled() ?? this.inherited().disabled,
      labelPlacement: this.labelPlacement() ?? this.inherited().labelPlacement,
      necessity: this.resolvedNecessity(),
      readOnly: this.readOnly() ?? this.inherited().readOnly,
      size: this.resolvedSize(),
    };
  }
}
