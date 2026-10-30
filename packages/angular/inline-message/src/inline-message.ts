import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  forwardRef,
  HostAttributeToken,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { BUTTON_DEFAULTS_TOKEN } from '@slotted/angular/button';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import type { GlyphName } from '@slotted/angular/icon';

import { injectInlineMessageDefaults, SlInlineMessageIdFactory } from './inline-message-defaults';
import type {
  InlineMessageLive,
  InlineMessageMark,
  InlineMessageSize,
  InlineMessageTone,
} from './inline-message-defaults';

export type {
  InlineMessageLive,
  InlineMessageMark,
  InlineMessagePrefixes,
  InlineMessageSize,
  InlineMessageTone,
} from './inline-message-defaults';

/**
 * The glyph each tone draws: `specs/components/inline-message/contract.json`
 * holds the map. Help is not a severity and draws none.
 */
const TONE_GLYPH: Record<InlineMessageTone, GlyphName | null> = {
  accent: 'status-info',
  secondary: null,
  info: 'status-info',
  success: 'status-success',
  warning: 'status-warning',
  danger: 'status-danger',
};

/**
 * The two roles that announce, and the value that does not. Both roles imply
 * `aria-live` and `aria-atomic`, so the whole message is read rather than the
 * word that changed, and nothing here writes either attribute by hand.
 */
const LIVE_ROLE: Record<InlineMessageLive, string | null> = {
  off: null,
  polite: 'status',
  assertive: 'alert',
};

/**
 * One sentence about one field or one control; a message about a section is
 * an alert. Help, an error, a warning, a confirmation, or a wait.
 *
 * The directive is written on the consumer's own element, and the element it
 * belongs on is a `p`: the message is a sentence of prose about something else,
 * and a paragraph is the box a screen reader reads as one unit.
 *
 * **The severity is a word as well as a color.** A reader who cannot see the
 * message hears the sentence and nothing else — neither the red ink nor the
 * crossed circle reaches the accessibility tree — so the family writes the
 * severity in clipped text before the message, which is GOV.UK's answer
 * generalized to every tone and to a table an application replaces once.
 *
 * **The role goes on this element, not on an inner one.** `slAlert` puts its
 * live role on the text part because it has a dismiss button beside the text,
 * and MDN's `alert` role reference is explicit that the role is for text
 * content alone. This family has no controls, so there is nothing to keep out.
 */
/** What the message queries for, declared before the directive it stands for. */
export abstract class SlInlineMessageActionsRef {}

@Component({
  selector: '[slInlineMessage]',
  standalone: true,
  exportAs: 'slInlineMessage',
  imports: [SlGlyph, SlIcon],
  template: `@if (prefixWord() !== '') {
      <span data-part="prefix" data-part-prefix="">{{ prefixWord() }}</span>
    }
    @if (!hideIcon()) {
      <span aria-hidden="true" data-part="icon" data-part-icon=""
        ><ng-content select="[slInlineMessageIcon]">
          @if (glyph(); as name) {
            <span slIcon><svg slGlyph [name]="name"></svg></span>
          }</ng-content
      ></span>
    }
    <span
      data-part="text"
      data-part-text=""
      [attr.id]="grouped() ? textId : null"
      [attr.role]="grouped() ? liveRole() : null"
      ><ng-content
    /></span>
    <ng-content select="[slInlineMessageActions]" />`,
  styleUrl: '../../../styles/src/inline-message/inline-message.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'inline-message',
    'data-ui-inline-message': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-tone]': 'resolvedTone()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-live]': 'resolvedLive()',
    '[attr.data-mark]': 'resolvedMark()',
    '[attr.data-loading]': "loading() ? '' : null",
    '[attr.data-disabled]': "disabled() === true ? '' : null",
    '[attr.data-reserve]': "reserve() ? '' : null",
    '[attr.role]': 'role()',
    '[attr.aria-labelledby]': 'grouped() ? textId : null',
    '[attr.id]': 'messageId',
  },
})
export class SlInlineMessage {
  /** Defaults to the token, then to `secondary` — help text. */
  readonly tone = input<InlineMessageTone | undefined>(undefined);
  /** Defaults to the token, then to `sm`. */
  readonly size = input<InlineMessageSize | undefined>(undefined);
  /** Defaults to the token, then to `off`. */
  readonly live = input<InlineMessageLive | undefined>(undefined);
  /**
   * Which mark is drawn. Defaults to the token, then to `glyph`. `slField` and
   * `slFieldGroup` ask for `none` instead, because a form reads a column of
   * sentences rather than a column of silhouettes.
   */
  readonly mark = input<InlineMessageMark | undefined>(undefined);
  /**
   * The word read before the message. Unstated is the tone's own — `Error:`,
   * `Warning:`, `Success:` — and the empty string removes it, for a message
   * whose sentence already names the severity.
   */
  readonly prefix = input<string | undefined>(undefined);
  /**
   * Removes the mark's box from the markup, for a message that carries its own
   * artwork beside it. `mark='none'` is the other way to draw nothing: it is an
   * axis a provider can set for every message under it, and it leaves the box
   * in place for `reserve` to hold a line open with.
   */
  readonly hideIcon = input(false, { transform: booleanAttribute });
  /** The message is waiting for something: the mark becomes a turning ring. */
  readonly loading = input(false, { transform: booleanAttribute });
  /**
   * Unstated rather than `false`, so a `field` can answer it once this family
   * is inside one. Stated, it wins.
   */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /**
   * Holds one line box open whether or not there is a message, so the form
   * below does not move when the error arrives.
   */
  readonly reserve = input(false, { transform: booleanAttribute });

  private readonly defaults = injectInlineMessageDefaults();

  /**
   * An identifier bound by whatever renders the message. It is what a family
   * that composes with this one — `field`, whose description and error *are*
   * inline messages — uses to give the message an identifier derived from its
   * own base, which a static attribute cannot express and a directive on the
   * same element cannot write.
   */
  readonly id = input<string | undefined>(undefined);

  private readonly writtenId = inject(new HostAttributeToken('id'), { optional: true });
  private readonly generatedId = inject(SlInlineMessageIdFactory).next();

  /**
   * The identifier an `aria-describedby` or an `aria-errormessage` points at.
   * A consumer's own is never replaced, and the generated one is reachable from
   * a template through `exportAs` — which is the reach an Angular template has
   * and a React consumer answers with `useId` in their own component.
   *
   * A getter rather than a signal, so `message.messageId` keeps reading as a
   * value in every template that already writes it. The host binding below
   * calls it in a reactive context, so the `id` input above is tracked.
   */
  get messageId(): string {
    return this.id() ?? this.writtenId ?? this.generatedId;
  }
  /** The sentence's id, which names the group a message with actions becomes. */
  protected get textId(): string {
    return `${this.messageId}-text`;
  }

  /**
   * A role the consumer wrote is never replaced by the family's. A host binding
   * wins over a static attribute in Angular, so the written value has to be
   * read before the binding is computed rather than after — the asymmetry with
   * React, where a consumer's prop simply spreads over the family's.
   */
  private readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });

  protected readonly resolvedTone = computed(() => this.tone() ?? this.defaults.tone);
  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  protected readonly resolvedLive = computed(() => this.live() ?? this.defaults.live);
  protected readonly resolvedMark = computed(() => this.mark() ?? this.defaults.mark);
  /* The glyph the family draws when the page supplies none. A message that is
     waiting draws a ring instead, and one that asked for no mark draws none. */
  protected readonly glyph = computed<GlyphName | null>(() => {
    const mark = this.resolvedMark();
    if (this.loading() || mark === 'none') return null;
    return mark === 'dot' ? 'dot' : TONE_GLYPH[this.resolvedTone()];
  });
  protected readonly liveRole = computed(() => LIVE_ROLE[this.resolvedLive()]);
  /**
   * A message that holds `[slInlineMessageActions]` is a group named by its
   * sentence, written on a `div`: a paragraph cannot hold a button. Its live
   * role moves to the sentence, so the buttons are not announced with it.
   */
  private readonly actions = contentChild(SlInlineMessageActionsRef);
  protected readonly grouped = computed(() => this.actions() !== undefined);
  protected readonly role = computed(
    () => this.writtenRole ?? (this.grouped() ? 'group' : this.liveRole()),
  );

  /* Unstated asks the table; the empty string is a consumer removing the word. */
  protected readonly prefixWord = computed(
    () => this.prefix() ?? this.defaults.prefixes[this.resolvedTone()] ?? '',
  );
}

/**
 * The answers a message offers, after its sentence: two amounts the reader
 * may have meant, a way to undo. Written on a `div` inside the message, which
 * is then a `div` itself; the buttons take the message's size.
 */
@Directive({
  selector: '[slInlineMessageActions]',
  standalone: true,
  exportAs: 'slInlineMessageActions',
  host: { 'data-part': 'actions', 'data-part-actions': '' },
  providers: [
    { provide: SlInlineMessageActionsRef, useExisting: forwardRef(() => SlInlineMessageActions) },
    {
      provide: BUTTON_DEFAULTS_TOKEN,
      useFactory: () => ({
        ...inject(BUTTON_DEFAULTS_TOKEN, { skipSelf: true }),
        size: inject(SlInlineMessage).resolvedSize(),
      }),
    },
  ],
})
export class SlInlineMessageActions {}
