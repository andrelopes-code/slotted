import { hostSelectorKey } from '@slotted/core/selector-key';
import { tabbables } from '@slotted/core/focus';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostAttributeToken,
  inject,
  ViewEncapsulation,
} from '@angular/core';

import { SlHoverCard } from './hover-card';

/**
 * The link the card is about. It is the family's one part: the element painted
 * while the card shows, and the anchor the card is measured against — many
 * triggers may share one `slHoverCard`, and the one that starts an opening
 * registers itself.
 *
 * A component rather than a directive, as `slLink` and `slMenuItem` are,
 * because a component is what can carry `styleUrl`: this is where the family's
 * authored stylesheet enters an Angular application, and the trigger has to be
 * painted before any card has opened.
 *
 * The wiring — `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` — is
 * written only when the card is navigable. A card the keyboard cannot enter is
 * not a popup the link has, and saying so would be a lie a screen reader
 * repeats.
 */
@Component({
  selector: '[slHoverCardTrigger]',
  standalone: true,
  exportAs: 'slHoverCardTrigger',
  template: '<ng-content />',
  styleUrl: '../../../styles/src/hover-card/hover-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[attr.data-ui]': 'ui',
    '[attr.data-part]': 'part',
    '[attr.data-open]': 'open() ? "" : null',
    '[attr.aria-haspopup]': 'card.resolvedNavigable() ? "dialog" : null',
    '[attr.aria-expanded]': 'card.resolvedNavigable() ? open() : null',
    '[attr.aria-controls]': 'card.resolvedNavigable() && open() ? card.contentId : null',
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'onPointerLeave($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(click)': 'onClick($event)',
    '(focus)': 'onFocus($event)',
    '(blur)': 'onBlur($event)',
    '(keydown)': 'onKeyDown($event)',
  },
})
export class SlHoverCardTrigger {
  protected readonly card = inject(SlHoverCard);
  private readonly element: HTMLElement = inject(ElementRef).nativeElement;

  /* A host that already carries an identity — `a[slLink]` cannot, since two
     components do not share an element, but a consumer's own part can — keeps
     it, as `menu-trigger.ts` records for two directives on one element. */
  private readonly writtenUi = inject(new HostAttributeToken('data-ui'), { optional: true });
  private readonly writtenPart = inject(new HostAttributeToken('data-part'), { optional: true });
  protected readonly ui = hostSelectorKey(this.element, 'ui', this.writtenUi ?? 'hover-card');
  protected readonly part = hostSelectorKey(this.element, 'part', this.writtenPart ?? 'root');

  /** Whether this trigger is the one the open card hangs from. */
  protected readonly anchors = computed(() => this.card.triggerNode() === this.element);
  protected readonly open = computed(() => this.card.isOpen() && this.anchors());

  private tapped = false;

  constructor() {
    /* The first trigger to mount is the anchor until another takes it. */
    afterNextRender(() => {
      if (this.card.triggerNode() === null) this.card.triggerNode.set(this.element);
    });
  }

  private claim() {
    if (this.card.triggerNode() !== this.element) this.card.triggerNode.set(this.element);
  }

  private layer(): HTMLElement | null {
    const panel = this.card.contentNode();
    return panel?.parentElement ?? panel;
  }

  protected onPointerEnter(source: Event) {
    const event = source as PointerEvent;
    if (this.card.disabled() || event.pointerType === 'touch') return;
    this.claim();
    if (this.card.isOpen() && this.anchors()) {
      this.card.cancelPending();
      return;
    }
    this.card.openAfterDelay(event);
  }

  /**
   * Leaving the trigger with the card open starts the grace: the card stays
   * while the pointer's own path still points into it, and closes after
   * `closeDelay` once the pointer has parked somewhere else. Leaving with an
   * open still pending cancels the open.
   */
  protected onPointerLeave(source: Event) {
    const event = source as PointerEvent;
    if (event.pointerType === 'touch') return;
    if (!this.card.isOpen() || !this.anchors()) {
      this.card.cancelPending();
      return;
    }
    this.card.graceToward(
      () => this.element.getBoundingClientRect(),
      () => this.element.matches(':hover') || (this.layer()?.matches(':hover') ?? false),
      event,
    );
  }

  /**
   * `:focus-visible` rather than every focus: a press that focuses a link is a
   * navigation, not a request for its preview — and focus the family itself
   * put back after Escape or a focus guard must not reopen the card.
   */
  protected onFocus(event: Event) {
    if (this.card.disabled()) return;
    if (this.card.suppressFocusOpen) return;
    if (!this.element.matches(':focus-visible')) return;
    this.claim();
    this.card.toggle(true, 'keyboard', event);
  }

  protected onBlur(source: Event) {
    const event = source as FocusEvent;
    this.card.suppressFocusOpen = false;
    if (!this.card.isOpen() || !this.anchors()) return;
    const next = event.relatedTarget;
    if (next instanceof Node && this.layer()?.contains(next)) return;
    this.card.toggle(false, 'blur', event);
  }

  /**
   * `Tab` on the open trigger enters a navigable card, which lives at the end
   * of the document and would otherwise never be reached. The popover's focus
   * guards bring focus back out past either end.
   */
  protected onKeyDown(source: Event) {
    const event = source as KeyboardEvent;
    if (!this.card.resolvedNavigable() || !this.card.isOpen() || !this.anchors()) return;
    if (event.key !== 'Tab' || event.shiftKey) return;
    const panel = this.card.contentNode();
    if (panel === null) return;
    const [first] = tabbables(panel);
    if (first === undefined) return;
    event.preventDefault();
    first.focus();
  }

  /**
   * There is no hover on a coarse pointer. A tap on a closed trigger opens the
   * card and does not follow the link; a tap on an open one follows it.
   */
  protected onPointerDown(source: Event) {
    this.tapped = (source as PointerEvent).pointerType === 'touch';
  }

  protected onClick(event: Event) {
    if (!this.tapped) return;
    this.tapped = false;
    if (this.card.disabled() || (this.card.isOpen() && this.anchors())) return;
    event.preventDefault();
    this.claim();
    this.card.toggle(true, 'pointer', event);
  }
}
