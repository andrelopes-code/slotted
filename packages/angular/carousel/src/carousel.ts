import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import {
  canStep,
  createCarouselEngine,
  createCarouselRotation,
  EMPTY_PAGES,
  stepPage,
} from '@slotted/core/carousel';
import type {
  CarouselEngineHandle,
  CarouselPages,
  CarouselRotationHandle,
  CarouselSlidesPerMove,
} from '@slotted/core/carousel';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { carouselMessages, type CarouselMessages, type PartialMessages } from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';

import { injectCarouselDefaults, SlCarouselIdFactory } from './carousel-defaults';
import type {
  CarouselAlign,
  CarouselArrows,
  CarouselOrientation,
  CarouselSize,
  CarouselTransition,
} from './carousel-defaults';

/** Why the page moved. */
export type CarouselPageReason =
  'pointer' | 'keyboard' | 'scroll' | 'timeout' | 'resize' | 'programmatic';

/** Why the rotation started or stopped. */
export type CarouselPlayingReason = 'pointer' | 'keyboard' | 'scroll' | 'timeout' | 'programmatic';

export type CarouselPageRequest = ChangeRequest<number>;
export type CarouselPlayingRequest = ChangeRequest<boolean>;

/** `autoplay` as an attribute is on; a number is the wait in milliseconds. */
function autoplayAttribute(value: boolean | number | string | null | undefined): boolean | number {
  if (value === undefined || value === null || value === false || value === 'false') return false;
  if (value === '' || value === true || value === 'true') return true;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : true;
}

function optionalBoolean(value: boolean | string | undefined): boolean | undefined {
  return value === undefined ? undefined : booleanAttribute(value);
}

/** Whether focus arrived the way a keyboard brings it; an engine without the selector says yes. */
function focusVisible(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  try {
    return target.matches(':focus-visible');
  } catch {
    return true;
  }
}

/**
 * A set of slides shown a page at a time, and the controls that move it.
 *
 * **The viewport is a native scroller with snap**, so a finger, a trackpad
 * and the keyboard page it as the platform does. `@slotted/core/carousel`
 * reads the pages from the slides' own boxes, animates the scroll on the
 * theme's motion scale, drags it with a mouse and reports where a gesture
 * ended; the page a consumer owns is decided here, as a request with a reason.
 *
 * **The rotation follows the APG.** It never starts unless asked, does not
 * start for a reader who asked for reduced motion, pauses on hover and on a
 * hidden document with the time that was left, and stops on the first
 * keyboard focus inside until the rotation control starts it again.
 */
@Component({
  selector: 'section[slCarousel]',
  standalone: true,
  exportAs: 'slCarousel',
  template: '<ng-content />',
  styleUrl: '../../../styles/src/carousel/carousel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'carousel',
    'data-ui-carousel': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.aria-roledescription]': "t('roleDescription')",
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.data-transition]': 'resolvedTransition()',
    '[attr.data-align]': 'resolvedAlign()',
    '[attr.data-arrows]': 'resolvedArrows()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-draggable]': "resolvedDraggable() ? '' : null",
    '[attr.data-dragging]': "dragging() ? '' : null",
    '[attr.data-measured]': "measured() ? '' : null",
    '[attr.data-playing]': "isPlaying() ? '' : null",
    '[attr.data-paused]': "isPlaying() && held() ? '' : null",
    '[style.--slotted-carousel-slides-per-view]': 'slidesPerView() ?? null',
    '[style.--slotted-carousel-autoplay-delay]': "rotates() ? delay() + 'ms' : null",
    '(focusin)': 'onFocusIn($event)',
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'onPointerLeave()',
  },
})
export class SlCarousel {
  /** Present means the consumer owns the page, counted from 0. */
  readonly page = input<number | undefined>(undefined);
  /** The page an uncontrolled carousel starts on, read once. */
  readonly defaultPage = input(0);
  /** Present means the consumer owns whether the rotation runs. */
  readonly playing = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  /** Whether an uncontrolled rotation starts running. */
  readonly defaultPlaying = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  /** Turns the rotation on: present as an attribute waits the provider's delay, a number that many ms. */
  readonly autoplay = input<boolean | number, boolean | number | string | null | undefined>(false, {
    transform: autoplayAttribute,
  });
  readonly loop = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly draggable = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly orientation = input<CarouselOrientation | undefined>(undefined);
  readonly transition = input<CarouselTransition | undefined>(undefined);
  readonly align = input<CarouselAlign | undefined>(undefined);
  readonly arrows = input<CarouselArrows | undefined>(undefined);
  readonly size = input<CarouselSize | undefined>(undefined);
  /** Written as `--slotted-carousel-slides-per-view`; unset, a container query may write it. */
  readonly slidesPerView = input<number | undefined>(undefined);
  /** How many slides a page moves: a number, or `page` for the slides wholly in view. */
  readonly slidesPerMove = input<CarouselSlidesPerMove>('page');
  /** Words laid over the catalog of the language in force, key by key. */
  readonly messages = input<PartialMessages<CarouselMessages> | undefined>(undefined);

  /** The page after it moved, for `[(page)]`. */
  readonly pageChange = output<number>();
  /** Asked before the page moves, with the reason; `cancel()` keeps the page. */
  readonly pageRequest = output<CarouselPageRequest>();
  /** Whether the rotation runs, after it changed, for `[(playing)]`. */
  readonly playingChange = output<boolean>();
  /** Asked before the rotation starts or stops, with the reason. */
  readonly playingRequest = output<CarouselPlayingRequest>();

  private readonly defaults = injectCarouselDefaults();
  private readonly destroyRef = inject(DestroyRef);
  readonly baseId = inject(SlCarouselIdFactory).next();

  readonly resolvedOrientation = computed(() => this.orientation() ?? this.defaults.orientation);
  readonly resolvedTransition = computed(() => this.transition() ?? this.defaults.transition);
  readonly resolvedAlign = computed(() => this.align() ?? this.defaults.align);
  readonly resolvedArrows = computed(() => this.arrows() ?? this.defaults.arrows);
  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedLoop = computed(() => this.loop() ?? this.defaults.loop);
  readonly resolvedDraggable = computed(() => this.draggable() ?? this.defaults.draggable);
  /** The family's words in the language in force, with this carousel's `messages` laid over them. */
  readonly t = injectMessages(carouselMessages, this.messages);
  /** The locale in force: what the counter's numbers are written in. */
  readonly locale = injectLocale();
  readonly rotates = computed(() => this.autoplay() !== false);
  readonly delay = computed(() => {
    const value = this.autoplay();
    return typeof value === 'number' ? value : this.defaults.autoplayDelay;
  });

  private readonly ownPage = signal<number | null>(null);
  private readonly ownPlaying = signal<boolean | null>(null);
  private readonly visualPage = signal<number | null>(null);
  readonly pages = signal<CarouselPages>(EMPTY_PAGES);
  readonly slideIds = signal<string[]>([]);
  protected readonly measured = signal(false);
  protected readonly dragging = signal(false);
  protected readonly held = signal(false);
  private readonly revision = signal(0);
  private readonly viewportElement = signal<HTMLElement | null>(null);

  private engine: CarouselEngineHandle | null = null;
  private rotation: CarouselRotationHandle | null = null;
  private motion = { animate: false, announce: false };
  private placed: number | null = null;

  readonly pageCount = computed(() => this.pages().positions.length);
  private readonly committed = computed(
    () => this.page() ?? this.ownPage() ?? untracked(() => this.defaultPage()),
  );
  /** The page the family holds, kept inside the pages that exist. */
  readonly current = computed(() => {
    const count = this.pageCount();
    const page = this.committed();
    return count === 0 ? page : Math.min(Math.max(page, 0), count - 1);
  });
  /** The page the parts draw: the committed one, or the one a gesture is crossing. */
  readonly shown = computed(() => this.visualPage() ?? this.current());
  readonly isPlaying = computed(() => {
    if (!this.rotates()) return false;
    return this.playing() ?? this.ownPlaying() ?? this.defaultPlaying() !== false;
  });
  readonly canPrevious = computed(() =>
    canStep(this.current(), -1, this.pageCount(), this.resolvedLoop()),
  );
  readonly canNext = computed(() =>
    canStep(this.current(), 1, this.pageCount(), this.resolvedLoop()),
  );
  readonly viewportId = `${this.baseId}-viewport`;

  constructor() {
    afterNextRender(() => {
      const viewport = this.viewportElement();
      if (viewport !== null) this.start(viewport);
    });

    /** The viewport follows the page the family holds, whoever moved it. */
    effect(() => {
      const current = this.current();
      this.revision();
      this.pages();
      untracked(() => this.place(current));
    });

    effect(() => {
      const playing = this.isPlaying();
      const count = this.pageCount();
      untracked(() => {
        if (playing && count > 1) this.rotation?.start();
        else this.rotation?.stop();
      });
    });

    /** A page that stopped existing is asked away with `resize`. */
    effect(() => {
      const count = this.pageCount();
      untracked(() => {
        if (count > 0 && this.committed() > count - 1) {
          this.go(count - 1, 'resize', undefined, { instant: true });
        }
      });
    });

    this.destroyRef.onDestroy(() => {
      this.engine?.destroy();
      this.rotation?.destroy();
    });
  }

  /** The viewport hands the root its element; the root owns the engine that moves it. */
  attachViewport(element: HTMLElement) {
    this.viewportElement.set(element);
  }

  private start(viewport: HTMLElement) {
    const doc = viewport.ownerDocument;
    if (this.defaultPlaying() !== true && this.playing() === undefined) {
      const reduced = doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)');
      if (reduced?.matches === true) this.ownPlaying.set(false);
    }

    const engine = createCarouselEngine(viewport, {
      orientation: () => this.resolvedOrientation(),
      align: () => this.resolvedAlign(),
      slidesPerMove: () => this.slidesPerMove(),
      transition: () => this.resolvedTransition(),
      draggable: () => this.resolvedDraggable(),
      page: () => this.current(),
      idPrefix: `${this.baseId}-slide-`,
      slideLabel: (index, count) => this.t('slide', { index: index + 1, count }),
      onPages: (pages, ids) => {
        this.pages.set(pages);
        this.slideIds.set(ids);
        this.measured.set(true);
      },
      onVisualPage: (page) => this.visualPage.set(page),
      onSettle: (page, reason, event) => this.go(page, reason, event, { instant: true }),
      onDraggingChange: (dragging) => this.dragging.set(dragging),
      onSwipe: (delta, event) => this.step(delta, 'pointer', event),
      onPeekPress: (slide, event) => {
        const target = engine.pages().pageOfSlide[slide];
        if (target !== undefined) this.go(target, 'pointer', event);
      },
    });
    this.engine = engine;

    if (this.rotates()) {
      this.rotation = createCarouselRotation({
        delay: () => this.delay(),
        document: doc,
        onHeldChange: (held) => this.held.set(held),
        onTick: () => this.tick(),
      });
      this.held.set(this.rotation.held());
      if (this.isPlaying() && this.pageCount() > 1) this.rotation.start();
    }
    this.place(this.current());
  }

  private place(current: number) {
    const engine = this.engine;
    if (engine === null) return;
    const moved = this.placed !== current;
    this.placed = current;
    engine.setCurrent(current);
    /* An unmoved page is a request the consumer refused: the viewport glides back to it. */
    engine.scrollToPage(current, { animate: moved ? this.motion.animate : true });
    const count = this.pageCount();
    if (moved && this.motion.announce && count > 0) {
      getLiveAnnouncer(this.viewportElement()?.ownerDocument).announce(
        this.t('announce', { page: current + 1, count }),
      );
    }
    this.motion = { animate: false, announce: false };
    this.rotation?.restart();
  }

  private tick() {
    const count = this.pageCount();
    const at = this.current();
    if (count <= 1) return;
    if (at >= count - 1 && !this.resolvedLoop()) {
      this.setPlaying(false, 'timeout');
      return;
    }
    this.go(stepPage(at, 1, count, true), 'timeout');
  }

  /** Asks for a page, carrying the reason and the originating event. */
  go(
    next: number,
    reason: CarouselPageReason,
    source?: Event,
    options: { instant?: boolean } = {},
  ) {
    const count = this.pageCount();
    if (count === 0 || next < 0 || next >= count) return;
    if (
      (reason === 'pointer' || reason === 'keyboard' || reason === 'scroll') &&
      this.isPlaying()
    ) {
      this.setPlaying(false, reason, source);
    }
    this.visualPage.set(null);
    this.revision.update((value) => value + 1);
    const current = this.current();
    if (next === current) return;

    this.motion = {
      animate: options.instant !== true,
      announce: reason === 'pointer' || reason === 'keyboard' || reason === 'scroll',
    };
    let cancelled = false;
    const state = createControllable<number>({
      controlled: this.page(),
      initial: current,
      onRequest: (request) => {
        this.pageRequest.emit(request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled) return;
    if (moved) this.ownPage.set(next);
    this.pageChange.emit(next);
  }

  /** Steps a page forward or back, within the ends unless the carousel loops. */
  step(delta: 1 | -1, reason: CarouselPageReason, source?: Event) {
    const count = this.pageCount();
    const current = this.current();
    if (!canStep(current, delta, count, this.resolvedLoop())) return;
    this.go(stepPage(current, delta, count, this.resolvedLoop()), reason, source);
  }

  /** Asks for the rotation to start or stop. */
  setPlaying(next: boolean, reason: CarouselPlayingReason, source?: Event) {
    if (!this.rotates() || next === this.isPlaying()) return;
    let cancelled = false;
    const state = createControllable<boolean>({
      controlled: this.playing(),
      initial: this.isPlaying(),
      onRequest: (request) => {
        this.playingRequest.emit(request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled) return;
    if (moved) this.ownPlaying.set(next);
    this.playingChange.emit(next);
  }

  /** Asks for a page with reason `programmatic`. */
  scrollTo(page: number) {
    this.go(page, 'programmatic');
  }

  /** Asks for the page that holds a slide, with reason `programmatic`. */
  scrollToSlide(slide: number) {
    const target = this.pages().pageOfSlide[slide];
    if (target !== undefined) this.go(target, 'programmatic');
  }

  /** Reads the layout again. */
  refresh() {
    this.engine?.measure();
  }

  protected onFocusIn(event: FocusEvent) {
    /* "Automatic slide rotation stops when any element in the carousel receives keyboard focus." */
    if (this.isPlaying() && focusVisible(event.target)) this.setPlaying(false, 'keyboard', event);
  }

  protected onPointerEnter(event: PointerEvent) {
    if (event.pointerType === 'mouse') this.rotation?.hold('hover');
  }

  protected onPointerLeave() {
    this.rotation?.release('hover');
  }
}
