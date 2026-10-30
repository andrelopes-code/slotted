import { createFocusOrigin } from '@slotted/core/focus';
import {
  createScrollEdges,
  NO_SCROLL_EDGES,
  scrollEdgeAttributes,
  type LogicalEdge,
  type ScrollEdgesHandle,
  type ScrollEdgesState,
  type ScrollPosition,
} from '@slotted/core/overflow';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import {
  scrollAreaMessages,
  type PartialMessages,
  type ScrollAreaMessages,
} from '@slotted/core/i18n';

import { injectScrollAreaDefaults } from './scroll-area-defaults';
import type {
  ScrollAreaAxis,
  ScrollAreaFade,
  ScrollAreaGutter,
  ScrollAreaOverscroll,
  ScrollAreaScrollbars,
} from './scroll-area-defaults';

/** What `scrollChange` carries: where the scroller is, and the event that moved it. */
export interface ScrollAreaScrollEvent {
  readonly position: ScrollPosition;
  readonly source: Event;
}

/**
 * A scrollport, and the box that frames it.
 *
 * The scrollbar is the platform's, themed by the stylesheet through
 * `scrollbar-color`; the keyboard is the platform's too. What this component
 * adds is the measurement of whether the content overflows and which of its
 * ends show, published on the frame for CSS and emitted to the consumer, and
 * the tab stop a scrolling region owes a keyboard together with the name that
 * tab stop owes a screen reader — both written only while the content actually
 * overflows, which is the pattern `prose` shipped first for one block inside a
 * document.
 *
 * The frame is the consumer's own element — `<div slScrollArea>` — and the
 * scrollport is the component's, projected into: the frame is where a border,
 * a radius and a ground go, and the scrollport is the element the veil is on.
 * A consumer's own attributes on the host are never written over, because the
 * family writes its role, its tab stop and its name on an element it owns.
 *
 * The scroll position is never held. The browser moves it on a wheel, a
 * fling, a `Tab` into a child, an anchor navigation and a printed page, and a
 * consumer holding the value would have to accept every one of those or fight
 * the platform. It is emitted, and the instance moves it.
 */
@Component({
  selector: '[slScrollArea]',
  standalone: true,
  exportAs: 'slScrollArea',
  template: `
    <div
      #viewport
      data-part="viewport"
      data-part-viewport=""
      [attr.role]="wired() ? 'region' : null"
      [attr.tabindex]="wired() ? '0' : null"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-labelledby]="ariaLabelledBy()"
      (scroll)="onScroll($event)"
    >
      <ng-content />
    </div>
  `,
  styleUrl: '../../../styles/src/scroll-area/scroll-area.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'scroll-area',
    'data-ui-scroll-area': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-axis]': 'resolvedAxis()',
    '[attr.data-scrollbars]': 'resolvedScrollbars()',
    '[attr.data-gutter]': 'resolvedGutter()',
    '[attr.data-fade]': 'resolvedFade()',
    '[attr.data-overscroll]': 'resolvedOverscroll()',
    '[attr.data-overflowing]': "edgeAttributes()['data-overflowing'] ?? null",
    '[attr.data-at-block-start]': "edgeAttributes()['data-at-block-start'] ?? null",
    '[attr.data-at-block-end]': "edgeAttributes()['data-at-block-end'] ?? null",
    '[attr.data-at-inline-start]': "edgeAttributes()['data-at-inline-start'] ?? null",
    '[attr.data-at-inline-end]': "edgeAttributes()['data-at-inline-end'] ?? null",
    '[attr.data-sideways]': "sideways() ? '' : null",
    '[style.max-block-size]': 'maxBlockSize() ?? null',
    '[style.max-inline-size]': 'maxInlineSize() ?? null',
  },
})
export class SlScrollArea {
  readonly axis = input<ScrollAreaAxis | undefined>(undefined);
  readonly scrollbars = input<ScrollAreaScrollbars | undefined>(undefined);
  readonly gutter = input<ScrollAreaGutter | undefined>(undefined);
  readonly fade = input<ScrollAreaFade | undefined>(undefined);
  readonly overscroll = input<ScrollAreaOverscroll | undefined>(undefined);

  /**
   * Scroll only past this size, as any CSS length. It is Mantine's
   * `ScrollArea.Autosize` as one binding rather than a second component.
   */
  readonly maxBlockSize = input<string | undefined>(undefined);
  readonly maxInlineSize = input<string | undefined>(undefined);

  /**
   * Whether the scrollport joins the tab sequence while it overflows.
   *
   * On by default, because content that scrolls has to be scrollable by
   * keyboard and a scrollport with no tab stop is not — unless a child of it
   * already takes focus. A consumer who knows the content is reachable another
   * way turns it off and carries the reason.
   */
  readonly tabbable = input(true, { transform: booleanAttribute });

  /**
   * The name the region is announced by. Resolved in one order: `labelledBy`,
   * then `messages.label`, then the catalog of the language in force.
   */
  readonly labelledBy = input<string | undefined>(undefined);
  /** Words laid over the catalog of the language in force: the region's name (`label`). */
  readonly messages = input<PartialMessages<ScrollAreaMessages> | undefined>(undefined);

  /**
   * The position, as a distance from each logical start, on every scroll. It
   * is a report and not a request: the browser moves the position on a wheel,
   * a fling, a `Tab` into a child and a printed page, and a consumer holding it
   * would have to accept every one of those.
   */
  readonly scrollChange = output<ScrollAreaScrollEvent>();

  /** The measurement, and only a new one: which axes overflow, and which ends show. */
  readonly overflowChange = output<ScrollEdgesState>();

  private readonly defaults = injectScrollAreaDefaults();
  /** The family's words in the language in force, with this area's `messages` laid over them. */
  readonly t = injectMessages(scrollAreaMessages, this.messages);
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewportRef = viewChild.required<ElementRef<HTMLElement>>('viewport');

  /**
   * The measurement, as a signal, so the attributes it becomes are rendered.
   * Before the first render it is the state of content that fits — four ends
   * showing and nothing overflowing — which paints no veil and writes no tab
   * stop, so a server render and its hydration agree and the veil does not
   * flash on before the browser has said whether there is anything behind it.
   */
  private readonly measured = signal<ScrollEdgesState>(NO_SCROLL_EDGES);
  protected readonly sideways = signal(false);
  private edges: ScrollEdgesHandle | null = null;

  protected readonly resolvedAxis = computed(() => this.axis() ?? this.defaults.axis);
  protected readonly resolvedScrollbars = computed(
    () => this.scrollbars() ?? this.defaults.scrollbars,
  );
  protected readonly resolvedGutter = computed(() => this.gutter() ?? this.defaults.gutter);
  protected readonly resolvedFade = computed(() => this.fade() ?? this.defaults.fade);
  protected readonly resolvedOverscroll = computed(
    () => this.overscroll() ?? this.defaults.overscroll,
  );

  protected readonly edgeAttributes = computed(() => scrollEdgeAttributes(this.measured()));

  protected readonly overflowing = computed(() => {
    const state = this.measured();
    return state.block.overflowing || state.inline.overflowing;
  });
  protected readonly wired = computed(() => this.overflowing() && this.tabbable());
  protected readonly ariaLabelledBy = computed(() =>
    this.wired() ? (this.labelledBy() ?? null) : null,
  );
  protected readonly ariaLabel = computed(() => {
    if (!this.wired() || this.labelledBy() !== undefined) return null;
    return this.t('label');
  });

  constructor() {
    /**
     * After the first render and only in a browser: Angular builds the
     * component during a server render too, and there is nothing to measure
     * there. The wiring appears at the first moment a browser can say whether
     * the content overflows at all.
     */
    afterNextRender(() => {
      const viewport = this.viewportRef().nativeElement;
      const handle = createScrollEdges(viewport, {
        onChange: (next) => {
          this.measured.set(next);
          if (this.edges !== null) this.sideways.set(this.edges.sideways());
          this.overflowChange.emit(next);
        },
      });
      this.edges = handle;
      this.measured.set(handle.state());
      this.sideways.set(handle.sideways());

      /** A click on the content focuses the scrollport; its ring is for the keyboard (`createFocusOrigin`). */
      const origin = createFocusOrigin(viewport);
      this.destroyRef.onDestroy(origin.destroy);
    });

    this.destroyRef.onDestroy(() => {
      this.edges?.destroy();
      this.edges = null;
    });
  }

  /** The frame: the consumer's own element. */
  get root(): HTMLElement {
    return this.element;
  }

  /** The scrollport: the element that scrolls and takes focus. */
  get viewport(): HTMLElement {
    return this.viewportRef().nativeElement;
  }

  /** The last measurement: whether each axis overflows, and which of its ends show. */
  state(): ScrollEdgesState {
    return this.edges?.state() ?? NO_SCROLL_EDGES;
  }

  /** The distance from each logical start, read now. */
  position(): ScrollPosition {
    return this.edges?.position() ?? { block: 0, inline: 0 };
  }

  /** Moves to a logical position. An axis left out is an axis left alone. */
  scrollTo(target: Partial<ScrollPosition>): void {
    this.edges?.scrollTo(target);
  }

  /** Moves to one end of one axis. */
  scrollToEdge(edge: LogicalEdge): void {
    this.edges?.scrollToEdge(edge);
  }

  /** Brings one element into view by the shortest movement that does it, without moving anything else. */
  reveal(element: Element): void {
    this.edges?.reveal(element);
  }

  /** Measures again, after content the observer could not see changed. */
  refresh(): void {
    this.edges?.refresh();
  }

  /** Moves focus to the scrollport. */
  focus(): void {
    this.viewport.focus();
  }

  protected onScroll(event: Event) {
    if (this.edges === null) return;
    this.scrollChange.emit({ position: this.edges.position(), source: event });
  }
}

/**
 * The inset that scrolls with the content.
 *
 * Padding on a scrollport is not applied at the end edge of its scrollable
 * overflow in every engine, so an inset that has to survive a scroll to the
 * end goes on an element inside it. The family states no inset of its own: the
 * directive exists to give the consumer's one a place to live, on the
 * consumer's own element, and an area whose content already carries its own
 * inset uses no `slScrollAreaContent` at all.
 */
@Directive({
  selector: '[slScrollAreaContent]',
  standalone: true,
  exportAs: 'slScrollAreaContent',
  host: { 'data-part': 'content', 'data-part-content': '' },
})
export class SlScrollAreaContent {}
