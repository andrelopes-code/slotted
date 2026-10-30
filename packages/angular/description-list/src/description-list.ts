import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  Injector,
  numberAttribute,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  descriptionListMessages,
  type DescriptionListMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';

import {
  COPIED_FOR,
  copyToClipboard,
  DESCRIPTION_LIST_DEFAULT_COLUMNS,
  DESCRIPTION_LIST_DEFAULT_LAYOUT,
  DESCRIPTION_LIST_DEFAULT_MIN_COLUMN_WIDTH,
  DESCRIPTION_LIST_DEFAULT_VARIANT,
  DESCRIPTION_LIST_EMPTY_VALUE_MARK,
  injectDescriptionListDefaults,
  overflowsClamp,
  selectValue,
  SlDescriptionListIdFactory,
  spanWithin,
  type DescriptionListColumns,
  type DescriptionListCopyRequest,
  type DescriptionListLayout,
  type DescriptionListMinColumnWidth,
  type DescriptionListVariant,
} from './description-list.constants';

/**
 * Pairs of a term and its description, read rather than edited.
 *
 * **The semantics are the platform's.** `dl`, `dt` and `dd` already carry
 * `list`, `term` and `definition`, so the family writes no role: MDN records
 * that authoring the ARIA `term` and `definition` roles by hand changes how
 * VoiceOver announces the construct.
 *
 * **The `dl` is the component's and the element around it is the consumer's.**
 * An element with `container-type: inline-size` is a query container for its
 * descendants and not for itself, and what the container query changes here is
 * the grid — so the consumer's own element is the container, and the `dl` the
 * component draws inside it is the grid. Every pair a consumer writes is
 * projected into that `dl`.
 */
@Component({
  selector: 'div[slDescriptionList]',
  standalone: true,
  template: '<dl data-part="list" data-part-list=""><ng-content></ng-content></dl>',
  styleUrls: [
    '../../../styles/src/description-list/description-list.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slDescriptionList',
  host: {
    'data-ui': 'description-list',
    'data-ui-description-list': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-layout]': 'layoutValue()',
    '[attr.data-columns]': 'columnsValue()',
    '[attr.data-min-column-width]': 'minColumnWidthValue()',
    '[attr.data-variant]': 'variantValue()',
    '[style.--slotted-description-list-term-width]': 'termWidthValue() ?? null',
  },
})
export class SlDescriptionList {
  readonly layout = input<DescriptionListLayout | undefined>(undefined);
  readonly columns = input(undefined, { transform: optionalColumns });
  readonly variant = input<DescriptionListVariant | undefined>(undefined);
  /** The narrowest column before the count folds: `md` holds two columns to 34rem, `sm` to 25rem. */
  readonly minColumnWidth = input<DescriptionListMinColumnWidth | undefined>(undefined);
  /** The maximum width of the term column, as a CSS length. */
  readonly termWidth = input<string | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * copy control and its announcements, the reveal control, and the sentence
   * read in place of a missing value.
   */
  readonly messages = input<PartialMessages<DescriptionListMessages> | undefined>(undefined);

  private readonly defaults = injectDescriptionListDefaults();

  readonly layoutValue = computed(
    () => this.layout() ?? this.defaults.layout ?? DESCRIPTION_LIST_DEFAULT_LAYOUT,
  );
  readonly columnsValue = computed(
    () => this.columns() ?? this.defaults.columns ?? DESCRIPTION_LIST_DEFAULT_COLUMNS,
  );
  readonly minColumnWidthValue = computed(
    () =>
      this.minColumnWidth() ??
      this.defaults.minColumnWidth ??
      DESCRIPTION_LIST_DEFAULT_MIN_COLUMN_WIDTH,
  );
  readonly variantValue = computed(
    () => this.variant() ?? this.defaults.variant ?? DESCRIPTION_LIST_DEFAULT_VARIANT,
  );
  readonly termWidthValue = computed(() => this.termWidth() ?? this.defaults.termWidth);

  /** The family's words in the language in force, with this list's `messages` laid over them. */
  readonly t = injectMessages(descriptionListMessages, this.messages);
}

/**
 * One name-value pair, and the `div` the HTML Standard permits inside a `dl`.
 *
 * It is the box a rule, a tint and a span apply to, and the only part that can
 * see both the term and the action — so it is where the identifier that ties
 * the two together is made.
 */
@Directive({
  selector: 'div[slDescriptionListItem]',
  standalone: true,
  exportAs: 'slDescriptionListItem',
  host: {
    'data-part': 'item',
    'data-part-item': '',
    '[attr.data-span]': 'spanValue()',
  },
})
export class SlDescriptionListItem {
  readonly list = inject(SlDescriptionList);
  readonly span = input(undefined, { transform: optionalColumns });

  /** The `dt`'s identifier, which the row's action is described by. */
  readonly termId = inject(SlDescriptionListIdFactory).next();

  readonly spanValue = computed(() => spanWithin(this.span(), this.list.columnsValue()) ?? null);
}

/**
 * The name. It carries an identifier so the row's action can be described by
 * it; a static `id` the consumer wrote wins, because a page that already
 * references this term references it by the name it chose.
 */
@Directive({
  selector: 'dt[slDescriptionListTerm]',
  standalone: true,
  exportAs: 'slDescriptionListTerm',
  host: {
    'data-part': 'term',
    'data-part-term': '',
    '[attr.id]': 'identifier',
  },
})
export class SlDescriptionListTerm {
  private readonly item = inject(SlDescriptionListItem, { optional: true });
  private readonly ownId = inject(new HostAttributeToken('id'), { optional: true });

  readonly identifier = this.ownId ?? this.item?.termId ?? null;
}

/**
 * One line explaining what the term means, inside the `dt` that names it. It is
 * part of the term's own text on purpose: a reader who reaches the term hears
 * the explanation with it, and the row's action — described by the same `dt` —
 * inherits the context rather than repeating it.
 */
@Directive({
  selector: '[slDescriptionListHint]',
  standalone: true,
  exportAs: 'slDescriptionListHint',
  host: { 'data-part': 'hint', 'data-part-hint': '' },
})
export class SlDescriptionListHint {}

/**
 * The value's cell: the value itself, and the controls that reach it.
 *
 * **Clamping is visual only.** Every character stays in the DOM, selectable,
 * copyable and readable by a screen reader, which is what section 10 of the
 * feature guide means by never truncating without access.
 *
 * **Empty is stated rather than inferred.** Angular cannot read projected
 * content without reading the DOM after a render, so the absence of a value is
 * an input here where React reads nullish children. Levelling the two down to
 * the input in both would remove the case that matters most in React — a value
 * missing because the data is missing — to make the two look alike.
 */
@Component({
  selector: 'dd[slDescriptionListDescription]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `
    <span #value data-part="value" data-part-value="">
      <ng-content></ng-content>
      @if (empty()) {
        @if (placeholder()) {
          <span data-part="placeholder" data-part-placeholder="">{{ placeholder() }}</span>
        } @else {
          <span aria-hidden="true" data-part="placeholder" data-part-placeholder="">{{
            emptyMark
          }}</span>
          <span data-ui="visually-hidden" data-ui-visually-hidden="">{{ placeholderText() }}</span>
        }
      }
    </span>
    @if (copy()) {
      <button
        [attr.aria-label]="list.t('copy')"
        [attr.data-complete]="copied() ? '' : null"
        data-part="copy"
        data-part-copy=""
        type="button"
        (click)="onCopy($event)"
        (keydown)="onKeydown($event)"
      >
        <!-- A finished copy changes its mark as well as its color. -->
        <span slIcon><svg slGlyph [name]="copied() ? 'check' : 'copy'"></svg></span>
      </button>
    }
    @if (clampValue() > 0 && overflows()) {
      <button
        [attr.aria-expanded]="revealed()"
        data-part="toggle"
        data-part-toggle=""
        type="button"
        (click)="onToggle($event)"
        (keydown)="onKeydown($event)"
      >
        {{ revealed() ? list.t('collapse') : list.t('reveal') }}
        <span slIcon><svg slGlyph name="chevron-down"></svg></span>
      </button>
    }
  `,
  styleUrls: [
    '../../../styles/src/description-list/description-list.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slDescriptionListDescription',
  host: {
    'data-part': 'description',
    'data-part-description': '',
    '[attr.data-clamp]': 'clampValue() > 0 ? "" : null',
    '[attr.data-revealed]': 'clampValue() > 0 && revealed() ? "" : null',
    '[style.--slotted-description-list-clamp]': 'clampValue() > 0 ? clampValue() : null',
  },
})
export class SlDescriptionListDescription {
  readonly list = inject(SlDescriptionList);

  /** The character a row shows where it has no value. */
  protected readonly emptyMark = DESCRIPTION_LIST_EMPTY_VALUE_MARK;

  /** Lines the value is held to before it is revealed. `0` never clamps. */
  readonly clamp = input(0, { transform: (value: number | string) => numberAttribute(value, 0) });
  /** Draws the control that puts the value on the clipboard. */
  readonly copy = input(false, { transform: booleanAttribute });
  /**
   * The text the control copies. Absent, the rendered text of the value is read
   * at the moment of the press, which is what a formatted value needs.
   */
  readonly copyValue = input<string | undefined>(undefined);
  /** Draws the placeholder in place of a value that is missing. */
  readonly empty = input(false, { transform: booleanAttribute });
  /** What is read in place of that value. */
  readonly placeholder = input<string | undefined>(undefined);

  /**
   * Present means controlled, for the life of the component, which is why the
   * unset value is `undefined` rather than `false`: a family that read `false`
   * as a consumer's answer would never own its own state.
   */
  readonly revealedValue = input(undefined, {
    alias: 'revealed',
    transform: (value: boolean | string | undefined) =>
      value === undefined ? undefined : booleanAttribute(value),
  });
  /** What an uncontrolled description starts from, read once. */
  readonly defaultRevealed = input(false, { transform: booleanAttribute });

  /**
   * Emitted before the value is revealed, carrying the value it replaces, the
   * reason and the event it came from. It is not the second half of a two-way
   * binding: one slot can carry none of those.
   */
  readonly revealedChange = output<ChangeRequest<boolean>>();
  /** Emitted after a copy, whether or not the platform accepted it. */
  readonly copied$ = output<DescriptionListCopyRequest>({ alias: 'copied' });

  private readonly own = signal(false);
  private readonly done = signal(false);
  private readonly overflowing = signal(false);
  private readonly value = viewChild<ElementRef<HTMLElement>>('value');
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private observer: ResizeObserver | undefined;
  private keyed = false;

  readonly revealed = computed(() => this.revealedValue() ?? this.own());
  readonly clampValue = computed(() => Math.max(0, Math.trunc(this.clamp())));
  readonly copied = computed(() => this.done());
  /** Whether the value wants more room than the clamp gives it. */
  readonly overflows = computed(() => this.overflowing());
  readonly placeholderText = computed(() => this.placeholder() ?? this.list.t('placeholder'));

  constructor() {
    this.own.set(this.defaultRevealed());
    this.destroyRef.onDestroy(() => {
      clearTimeout(this.timer);
      this.observer?.disconnect();
    });

    /**
     * A control that reveals nothing is a control a reader presses once and
     * learns to distrust. A clamp is a maximum rather than a promise: most
     * values in a panel are shorter than it, and the toggle appears only for
     * the ones that are not. The value is remeasured whenever its box changes,
     * which is what the container query does to it at every breakpoint.
     */
    afterNextRender(
      () => {
        effect(
          () => {
            const lines = this.clampValue();
            const node = this.value()?.nativeElement;
            this.observer?.disconnect();
            this.observer = undefined;

            if (lines <= 0 || !node || typeof ResizeObserver === 'undefined') {
              this.overflowing.set(false);
              return;
            }

            const measure = () => {
              const lineHeight = Number.parseFloat(getComputedStyle(node).lineHeight);
              this.overflowing.set(overflowsClamp(node.scrollHeight, lineHeight, lines));
            };

            measure();
            this.observer = new ResizeObserver(measure);
            this.observer.observe(node);
          },
          { injector: this.injector },
        );
      },
      { injector: this.injector },
    );
  }

  /**
   * `Enter` and `Space` both activate a button and the browser turns each into
   * a click, so the reason a request carries is decided by whether a key came
   * first. It is the difference between a press and a key, and a consumer that
   * has to guess writes the wrong handler.
   */
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') this.keyed = true;
  }

  onToggle(event: Event) {
    const reason = this.takeReason();
    const state = createControllable<boolean>({
      controlled: this.revealedValue(),
      initial: this.revealed(),
      onRequest: (request) => this.revealedChange.emit(request),
    });
    if (state.request(!this.revealed(), reason, event)) this.own.set(!this.own());
  }

  async onCopy(event: Event) {
    const reason = this.takeReason();
    /* Read at the moment of the press rather than at render: a formatted value
       is what the reader sees, and `copyValue` is for when it is not. */
    const text = this.copyValue() ?? this.value()?.nativeElement.textContent?.trim() ?? '';
    const copied = await copyToClipboard(text);
    let selected = false;

    if (copied) {
      this.done.set(true);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.done.set(false), COPIED_FOR);
      /* Through the shared announcer rather than a region this family owns, so
         two copies in one update are both heard. */
      getLiveAnnouncer().announce(this.list.t('copied'));
    } else {
      /**
       * A refused write used to leave the control at rest and the reader with
       * nothing — which is indistinguishable from a broken button, and is
       * exactly what a browser does when the document is not focused or the
       * page is in an iframe carrying no `clipboard-write` permission. So the
       * family does the part it still can: it selects the value, which the
       * reader can see and copy with the keyboard, and says so.
       */
      selected = selectValue(this.value()?.nativeElement);
      getLiveAnnouncer().announce(this.list.t('copyBlocked'));
    }

    this.copied$.emit({ copied, reason, selected, source: event, value: text });
  }

  private takeReason(): 'pointer' | 'keyboard' {
    const reason = this.keyed ? 'keyboard' : 'pointer';
    this.keyed = false;
    return reason;
  }
}

/**
 * The row's own action, in a second `dd` of the same group — which is what a
 * `dt` followed by more than one `dd` is for, and what GOV.UK's summary list
 * does.
 *
 * It is named by its own term through `aria-describedby`, so a reader who
 * reaches "Change" out of context hears which row it changes. GOV.UK repeats
 * the term as visually hidden text inside every action, which a template system
 * has to do; a reference says it once and cannot drift. A static
 * `aria-describedby` the consumer wrote is composed with rather than replaced.
 */
@Directive({
  selector: 'dd[slDescriptionListAction]',
  standalone: true,
  exportAs: 'slDescriptionListAction',
  host: {
    'data-part': 'action',
    'data-part-action': '',
    '[attr.aria-describedby]': 'describedBy',
  },
})
export class SlDescriptionListAction {
  private readonly item = inject(SlDescriptionListItem, { optional: true });
  private readonly own = inject(new HostAttributeToken('aria-describedby'), { optional: true });

  readonly describedBy = [this.own, this.item?.termId].filter(Boolean).join(' ') || null;
}

/**
 * Absence has to survive the transform: `numberAttribute` maps an unset input
 * to `NaN`, and a family that read that would stop deferring to the provider.
 */
function optionalColumns(value: DescriptionListColumns | string | undefined) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = numberAttribute(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(Math.max(Math.trunc(parsed), 1), 3) as DescriptionListColumns;
}
