import { createPresence } from '@slotted/core/presence';
import type { PresenceStatus } from '@slotted/core/presence';
import { findScrollParent } from '@slotted/core/sticky-header';
import { SlContainer } from '@slotted/angular/container';
import { injectMessages } from '@slotted/angular/i18n';
import { SlHeadingLevel } from '@slotted/angular/typography';
import { pageMessages, type PageMessages, type PartialMessages } from '@slotted/core/i18n';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  isDevMode,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { injectPageDefaults } from './page-defaults';
import type { PageGround, PageInset, PageLandmark, PageScroll, PageWidth } from './page-defaults';

export type {
  PageDefaults,
  PageGround,
  PageInset,
  PageLandmark,
  PageScroll,
  PageWidth,
} from './page-defaults';

/** The custom property the scroller carries for what sticks above the footer. */
export const STICKY_BOTTOM_PROPERTY = '--slotted-page-sticky-bottom';

/**
 * The custom property the scroller carries for its own visible height: a
 * sticky element of the consumer's caps its height by it rather than by the
 * viewport, which an inset canvas makes taller than the scroller.
 */
export const SCROLLPORT_BLOCK_SIZE_PROPERTY = '--slotted-page-scrollport-block-size';

/**
 * The inset lives on the body, so content written straight into the page is
 * drawn against the viewport's edges and nothing else says why. A header is
 * not that content — it carries its own inset — so it is the one child the
 * check passes over.
 */
function warnWithoutBody(root: HTMLElement) {
  const scroll = root.querySelector(':scope > [data-part="scroll"]');
  if (scroll === null) return;
  const content = [...scroll.children].filter(
    (child) => child.getAttribute('data-ui') !== 'page-header',
  );
  if (content.length === 0) return;
  if (content.some((child) => child.getAttribute('data-part') === 'body')) return;
  console.warn(
    'slPage has content outside slPageBody. Content outside the body receives no inset: wrap it in an element carrying slPageBody.',
  );
}

/**
 * The column of a screen: who scrolls, how wide the content is, where the
 * footer stays, how much air the body has.
 *
 * **The header is a direct child of what scrolls.** There is no header part: a
 * `sticky` element never leaves the box that contains it, so a wrapper exactly
 * the header's height would pin nothing. The element carrying `slPageHeader`
 * is projected first into the scroll part, beside the body.
 *
 * **The footer is projected outside the scroll part** — below the scroller
 * under `self`, stuck to the bottom of the root under `ancestor` — which is
 * what content projection is for. It keeps its box through its exit on
 * `open`, so the bar slides out rather than vanishing.
 *
 * **The element is the consumer's.** `<main slPage>` is the main landmark and
 * the directive adds nothing; `<div slPage>` gets `role="main"` unless
 * `landmark="none"` says the document already has one.
 */
@Component({
  selector: '[slPage]',
  standalone: true,
  exportAs: 'slPage',
  template: `<div data-part="scroll" data-part-scroll="">
      <ng-content select="[slPageHeader]" />
      <ng-content />
    </div>
    <ng-content select="[slPageFooter]" />`,
  styleUrl: '../../../styles/src/page/page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'page',
    'data-ui-page': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.role]': 'role()',
    '[attr.data-width]': 'resolvedWidth()',
    '[attr.data-scroll]': 'resolvedScroll()',
    '[attr.data-ground]': 'resolvedGround()',
    '[attr.data-fill]': "fill() ? '' : null",
    '[attr.data-loading]': "loading() ? '' : null",
  },
})
export class SlPage {
  /** Defaults to the provider, then `wide`. */
  readonly width = input<PageWidth | undefined>(undefined);
  /** Defaults to the provider, then `6`. */
  readonly inset = input<PageInset | undefined>(undefined);
  /** Defaults to the provider, then `ancestor`. */
  readonly scroll = input<PageScroll | undefined>(undefined);
  /** Defaults to the provider, then `sunken`. */
  readonly ground = input<PageGround | undefined>(undefined);
  /** Defaults to the provider, then `main`. */
  readonly landmark = input<PageLandmark | undefined>(undefined);
  /**
   * Fills the height it was given: the body stops growing with its content and
   * the container inside it stretches to what is left. With `scroll="self"`
   * nothing then scrolls outside the body, so the body's principal scroller —
   * not a form control, and at least half the body's height — is what
   * collapses the header: past 16 pixels down it snaps the area shut, and back
   * at its top it opens it again. From 600 pixels of the page's width up;
   * below it the page scrolls as it does without `fill`.
   */
  readonly fill = input(false, { transform: booleanAttribute });
  /** The body carries `aria-busy`; what stands in for the content is each family's own placeholder. */
  readonly loading = input(false, { transform: booleanAttribute });
  /**
   * Words laid over the catalog of the language in force: the footer's
   * accessible name (`footer`). A static `aria-label` on the footer still wins.
   */
  readonly messages = input<PartialMessages<PageMessages> | undefined>(undefined);

  private readonly defaults = injectPageDefaults();
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;
  private readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });

  readonly resolvedWidth = computed(() => this.width() ?? this.defaults.width);
  readonly resolvedInset = computed(() => this.inset() ?? this.defaults.inset);
  readonly resolvedScroll = computed(() => this.scroll() ?? this.defaults.scroll);
  readonly resolvedGround = computed(() => this.ground() ?? this.defaults.ground);
  readonly resolvedLandmark = computed(() => this.landmark() ?? this.defaults.landmark);
  /** The family's words in the language in force, with this page's `messages` laid over them. */
  readonly t = injectMessages(pageMessages, this.messages);

  /** `role="main"` only where the element is not already `main`, and only when asked. */
  protected readonly role = computed(() => {
    if (this.writtenRole !== null) return this.writtenRole;
    if (this.resolvedLandmark() !== 'main') return null;
    return this.native.tagName === 'MAIN' ? null : 'main';
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (isDevMode()) warnWithoutBody(this.native);
      if (typeof ResizeObserver === 'undefined') return;
      const target = findScrollParent(this.native) ?? this.native.ownerDocument.documentElement;
      const bar = () => this.native.querySelector<HTMLElement>(':scope > [data-part="footer"]');
      /* The property inherits, so every write invalidates style for everything
         under the scroller: it is written only when the height changes. */
      const write = (property: string, length: number) => {
        const value = `${length}px`;
        if (target.style.getPropertyValue(property) === value) return;
        target.style.setProperty(property, value);
      };
      /* Under `self` the page's own scroll part is what scrolls. */
      const scroller =
        (this.resolvedScroll() === 'self'
          ? this.native.querySelector<HTMLElement>(':scope > [data-part="scroll"]')
          : null) ?? target;
      const publish = () => {
        const height = this.resolvedScroll() === 'self' ? 0 : (bar()?.offsetHeight ?? 0);
        write(STICKY_BOTTOM_PROPERTY, height);
      };
      /* The scroller is read on a size report only, never while rendering:
         the observer reports once as soon as it observes. */
      const observer = new ResizeObserver(() => {
        publish();
        write(SCROLLPORT_BLOCK_SIZE_PROPERTY, scroller.clientHeight);
      });
      observer.observe(this.native);
      observer.observe(scroller);
      const footer = bar();
      if (footer !== null) observer.observe(footer);
      publish();
      destroyRef.onDestroy(() => {
        observer.disconnect();
        target.style.removeProperty(STICKY_BOTTOM_PROPERTY);
        target.style.removeProperty(SCROLLPORT_BLOCK_SIZE_PROPERTY);
      });
    });
  }
}

/**
 * The padded column: one container at the page's width and inset, and one
 * outline step deeper than the header — `slHeadingLevel` is a host directive,
 * so a section written directly in the body takes `h2`.
 */
@Component({
  selector: '[slPageBody]',
  standalone: true,
  exportAs: 'slPageBody',
  imports: [SlContainer],
  hostDirectives: [SlHeadingLevel],
  template: `<div slContainer [size]="page?.resolvedWidth()" [inset]="page?.resolvedInset()">
    <ng-content />
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'body',
    'data-part-body': '',
    '[attr.aria-busy]': "page?.loading() ? 'true' : null",
  },
})
export class SlPageBody {
  protected readonly page = inject(SlPage, { optional: true });
}

/**
 * The bar for the actions that finish the task. In the flow and never fixed:
 * it takes its own height, so the last line of content scrolls up to it
 * rather than under it. `open` keeps the element through its exit, so the bar
 * slides out rather than vanishing; the status reaches the DOM for the
 * stylesheet to transition on.
 */
@Component({
  selector: '[slPageFooter]',
  standalone: true,
  exportAs: 'slPageFooter',
  imports: [SlContainer],
  template: `<div slContainer [size]="page?.resolvedWidth()" [inset]="page?.resolvedInset()">
    <div data-part="actions" data-part-actions=""><ng-content /></div>
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'footer',
    'data-part-footer': '',
    '[attr.aria-label]': 'label()',
    '[attr.data-status]': 'status()',
    '[attr.hidden]': "status() === 'unmounted' ? '' : null",
  },
})
export class SlPageFooter {
  /** Whether the bar is shown. `false` slides it out and hides it once it has left. */
  readonly open = input(true, { transform: booleanAttribute });

  protected readonly page = inject(SlPage, { optional: true });
  private readonly written = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;
  protected readonly status = signal<PresenceStatus>('open');
  /** A footer outside a page still speaks the language in force. */
  private readonly own = injectMessages(pageMessages);

  protected readonly label = computed(
    () => this.written ?? (this.page === null ? this.own('footer') : this.page.t('footer')),
  );

  constructor() {
    const presence = createPresence({
      present: this.open(),
      skipInitialAnimation: true,
      onStatusChange: (next) => this.status.set(next),
    });
    presence.setNode(this.native);
    effect(() => presence.sync(this.open()));
    inject(DestroyRef).onDestroy(() => presence.destroy());
  }
}
