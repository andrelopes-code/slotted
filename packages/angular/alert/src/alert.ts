import { alertMessages, type AlertMessages, type PartialMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import type { GlyphName } from '@slotted/angular/icon';

import { injectAlertDefaults, SlAlertIdFactory } from './alert-defaults';
import type {
  AlertActionsPlacement,
  AlertLive,
  AlertReach,
  AlertTone,
  AlertVariant,
} from './alert-defaults';

export type {
  AlertActionsPlacement,
  AlertLive,
  AlertReach,
  AlertTone,
  AlertVariant,
} from './alert-defaults';

/**
 * The glyph each tone draws, in its solid form: `specs/components/alert/contract.json`
 * holds the map. Every one is circled, so every mark is the same disc and the
 * symbol cut out of it tells the tones apart. `secondary` draws none: a neutral
 * note has no severity to state, and a disc with nothing cut out of it said
 * nothing. Its absence is itself the difference under forced colors.
 */
const TONE_GLYPH: Record<AlertTone, GlyphName | null> = {
  accent: 'status-info',
  secondary: null,
  info: 'status-info',
  success: 'status-success',
  warning: 'status-warning',
  danger: 'status-danger',
};

/**
 * Why the message closed. `dismiss` is the control at its corner;
 * `programmatic` is the application asking through `exportAs`. `escape` is
 * deliberately absent: an alert is not a dismissable layer, and one inside a
 * dialog would swallow the dialog's Escape.
 */
export type AlertCloseReason = 'dismiss' | 'programmatic';

/**
 * A message about the page, a section, or the thing beside it.
 *
 * The directive is written on the consumer's own element, and the element it
 * belongs on is a `section`: named by its own title through `aria-labelledby`,
 * a `section` is a `region` landmark a reader can jump to, and unnamed it is a
 * plain grouping element that costs nothing.
 *
 * **The box is not the live region.** MDN's `alert` role reference states that
 * the role "should only be used for text content, not interactive elements such
 * as links or buttons", and every alert worth shipping has a dismiss control.
 * `slAlertContent` is what announces, and it holds the title and the
 * description alone; the actions and the dismiss control are its siblings.
 *
 * **Closing hides rather than removes.** A live region has to be in the
 * document before its text changes, so an alert that removed itself could not
 * announce the second time the message arrived — and `data-open` is only a
 * state a consumer can style if the element is there to carry it.
 */
/**
 * A mark the page supplies instead of the tone's own. It is projected into the
 * box the family draws, so it keeps the size, the color and the place on the
 * message's first line that the tone's own mark would have had.
 */
@Directive({
  selector: '[slAlertIcon]',
  standalone: true,
  exportAs: 'slAlertIcon',
})
export class SlAlertIcon {}

@Component({
  selector: '[slAlert]',
  standalone: true,
  exportAs: 'slAlert',
  imports: [SlGlyph, SlIcon],
  template: `@if (!hideIcon() && (glyph() || suppliedIcon())) {
      <span aria-hidden="true" data-part="icon" data-part-icon=""
        ><ng-content select="[slAlertIcon]">
          @if (glyph(); as name) {
            <span slIcon><svg slGlyph [name]="name" solid></svg></span>
          }</ng-content
      ></span>
    }
    <ng-content />
    @if (dismissible()) {
      <button
        type="button"
        data-part="dismiss"
        data-part-dismiss=""
        [attr.aria-label]="t('dismiss')"
        (click)="onDismiss($event)"
      >
        <span slIcon><svg slGlyph name="x"></svg></span>
      </button>
    }`,
  styleUrl: '../../../styles/src/alert/alert.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'alert',
    'data-ui-alert': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-tone]': 'resolvedTone()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-reach]': 'resolvedReach()',
    '[attr.data-actions-placement]': 'resolvedActionsPlacement()',
    '[attr.data-live]': 'resolvedLive()',
    '[attr.data-open]': "isOpen() ? '' : null",
    '[attr.hidden]': "isOpen() ? null : ''",
    '[attr.tabindex]': 'writtenTabIndex ?? -1',
    '[attr.aria-labelledby]': 'labelledBy()',
    '(focusin)': 'onFocusIn($event)',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class SlAlert {
  /** Defaults to the provider, then to `accent`. */
  readonly tone = input<AlertTone | undefined>(undefined);
  /** Defaults to the provider, then to `soft`. */
  readonly variant = input<AlertVariant | undefined>(undefined);
  /** Defaults to the provider, then to `section`. */
  readonly reach = input<AlertReach | undefined>(undefined);
  /** Defaults to the provider, then to `off`. */
  readonly live = input<AlertLive | undefined>(undefined);
  /** Defaults to `end` for a `page` banner and to `below` for every other reach. */
  readonly actionsPlacement = input<AlertActionsPlacement | undefined>(undefined);
  /** Draws no mark at all, for a callout carrying its own artwork. */
  readonly hideIcon = input(false, { transform: booleanAttribute });
  /**
   * Renders the control that closes the message. React reads the same fact from
   * whether a handler was passed; Angular cannot see whether an output was
   * subscribed, so the opt-in is stated — the asymmetry `tag` recorded.
   */
  readonly dismissible = input(false, { transform: booleanAttribute });
  /** Words laid over the catalog of the language in force, key by key: what that control announces (`dismiss`). */
  readonly messages = input<PartialMessages<AlertMessages> | undefined>(undefined);
  /** Present means controlled, for the life of the component. */
  readonly open = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** The openness an uncontrolled alert starts from, read once. */
  readonly defaultOpen = input(true, { transform: booleanAttribute });
  /**
   * Returns the keyboard to where it came from when the message closes with
   * focus inside it. Nothing moves when focus was never there.
   */
  readonly restoreFocus = input(true, { transform: booleanAttribute });

  /**
   * One output for one transition, carrying the value, the value it replaces,
   * the reason, the originating event and `cancel()`. There is no `[(open)]`
   * because a two-way binding has one slot and cannot carry any of those.
   */
  readonly openChange = output<ChangeRequest<boolean>>();

  private readonly defaults = injectAlertDefaults();
  /** The family's words in the language in force, with this alert's `messages` laid over them. */
  readonly t = injectMessages(alertMessages, this.messages);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** An explicit tab index the consumer wrote is never replaced by the family's. */
  protected readonly writtenTabIndex = inject(new HostAttributeToken('tabindex'), {
    optional: true,
  });

  /** The identifier the title writes, and the box is named by. */
  readonly titleId = `${inject(SlAlertIdFactory).next()}-title`;

  private readonly own = signal<boolean | undefined>(undefined);
  private readonly titlePresent = signal(false);

  /**
   * Where the keyboard came from, and whether it is here now. Both are read at
   * the moment the message closes, when the element focus was on may already be
   * gone — so they are remembered as focus crosses the boundary rather than
   * looked up in the DOM afterwards.
   */
  private cameFrom: HTMLElement | null = null;
  private holdsFocus = false;

  readonly resolvedTone = computed(() => this.tone() ?? this.defaults.tone);
  protected readonly glyph = computed(() => TONE_GLYPH[this.resolvedTone()]);
  /** A mark the page projected, which draws even where the tone has none. */
  protected readonly suppliedIcon = contentChild(SlAlertIcon);
  protected readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  protected readonly resolvedReach = computed(() => this.reach() ?? this.defaults.reach);
  protected readonly resolvedActionsPlacement = computed(
    () => this.actionsPlacement() ?? (this.resolvedReach() === 'page' ? 'end' : 'below'),
  );
  readonly resolvedLive = computed(() => this.live() ?? this.defaults.live);

  readonly isOpen = computed(() => this.open() ?? this.own() ?? this.defaultOpen());

  /**
   * A `section` with an `aria-labelledby` pointing at nothing has no accessible
   * name and is not a landmark, so the attribute is written only once a title
   * has said it exists.
   */
  protected readonly labelledBy = computed(() => (this.titlePresent() ? this.titleId : null));

  constructor() {
    let previous = this.isOpen();
    effect(() => {
      const next = this.isOpen();
      if (previous && !next) this.restore();
      previous = next;
    });
    /* The message removed by the consumer rather than closed by itself. */
    inject(DestroyRef).onDestroy(() => this.restore());
  }

  /** Called by `slAlertTitle`, which is the part that names the box. */
  registerTitle(present: boolean) {
    this.titlePresent.set(present);
  }

  /** Sends the keyboard to the message. The family never does this by itself. */
  focus() {
    this.host.nativeElement.focus();
  }

  /**
   * Asks to open or close, carrying `programmatic` as the reason. It is the
   * reach a template has and React does not: JSX can re-render an input, and an
   * Angular template can only call a method on the instance `exportAs` gives it.
   */
  setOpen(next: boolean) {
    this.request(next, 'programmatic');
  }

  protected onDismiss(event: MouseEvent) {
    /* A consumer that called preventDefault has refused the dismissal, and a
       refused dismissal moves nothing. */
    if (event.defaultPrevented) return;
    this.request(false, 'dismiss', event);
  }

  protected onFocusIn(event: FocusEvent) {
    const previous = event.relatedTarget;
    if (previous instanceof HTMLElement && !this.host.nativeElement.contains(previous)) {
      this.cameFrom = previous;
    }
    this.holdsFocus = true;
  }

  protected onFocusOut(event: FocusEvent) {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !this.host.nativeElement.contains(next)) {
      this.holdsFocus = false;
    }
  }

  private request(next: boolean, reason: AlertCloseReason, source?: Event) {
    const state = createControllable<boolean>({
      controlled: this.open(),
      initial: this.isOpen(),
      onRequest: (request) => this.openChange.emit(request),
    });

    if (state.request(next, reason, source)) this.own.set(next);
  }

  private restore() {
    if (!this.restoreFocus() || !this.holdsFocus) return;
    this.holdsFocus = false;
    const target = this.cameFrom;
    if (target === null || !target.isConnected) return;
    target.focus();
  }
}
