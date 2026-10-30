import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  DestroyRef,
  effect,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import type { ComponentRef } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { injectMessages } from '@slotted/angular/i18n';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import type { DismissReason, DismissableLayerHandle } from '@slotted/core/dismissable-layer';
import { createFocusScope, tabbables } from '@slotted/core/focus';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createPortalRoot } from '@slotted/core/portal';
import type { PortalRootHandle } from '@slotted/core/portal';
import { createPositioner } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceStatus } from '@slotted/core/presence';
import { tourMessages, type PartialMessages, type TourMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import {
  cardFits,
  compactSide,
  createTourController,
  isCompactViewport,
  isTextEntry,
  keepOverTarget,
  stageStep,
  tourKey,
  tourProgress,
  watchTarget,
  writeTargetRect,
} from '@slotted/core/tour';
import type { ResolvedStep, SpotMove, TourNavigationReason } from '@slotted/core/tour';

import { SL_TOUR } from './tour-context';
import type { TourContext } from './tour-context';
import { injectTourDefaults, SlTourIdFactory } from './tour-defaults';
import type {
  TourAlign,
  TourFocusTarget,
  TourLayout,
  TourMissing,
  TourOpenReason,
  TourOpenRequest,
  TourOutcome,
  TourSide,
  TourSize,
  TourStep,
  TourStepRequest,
} from './tour-defaults';
import {
  SlTourBody,
  SlTourCard,
  SlTourClose,
  SlTourContent,
  SlTourDescription,
  SlTourFooter,
  SlTourHeader,
  SlTourMedia,
  SlTourNext,
  SlTourPrev,
  SlTourProgress,
  SlTourSkip,
  SlTourStep,
  SlTourTitle,
} from './tour-parts';

const optionalBoolean = (state: boolean | string | undefined) =>
  state === undefined ? undefined : booleanAttribute(state);

const optionalNumber = (value: number | string | undefined) =>
  value === undefined ? undefined : numberAttribute(value);

const DISMISS_REASONS: Record<DismissReason, TourOpenReason> = {
  back: 'back',
  blur: 'programmatic',
  escape: 'escape',
  outsidePress: 'outsidePress',
  programmatic: 'programmatic',
};

function eventReason(event: Event | undefined): TourNavigationReason {
  if (event === undefined) return 'programmatic';
  if (event instanceof KeyboardEvent) return 'keyboard';
  if (event instanceof MouseEvent) return event.detail === 0 ? 'keyboard' : 'pointer';
  return 'programmatic';
}

function directionOf(node: Element): 'ltr' | 'rtl' {
  const declared = node.closest('[dir]')?.getAttribute('dir');
  if (declared === 'rtl' || declared === 'ltr') return declared;
  return node.ownerDocument.defaultView?.getComputedStyle(node).direction === 'rtl' ? 'rtl' : 'ltr';
}

/**
 * The frame the tour draws over the page: scrim, spotlight and the card's
 * layer. A component of its own, created inside `sl-tour` and moved to the
 * portal, because a component's view is redrawn by the signals it reads.
 * The same template as an embedded view created by hand was drawn once and
 * never again outside a harness that checks the whole tree: the tour opened
 * with no scrim, its card never appeared, and a step change removed
 * `data-open` from a frame that no longer followed its state.
 */
@Component({
  selector: 'sl-tour-frame',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    SlButton,
    SlTourBody,
    SlTourClose,
    SlTourContent,
    SlTourDescription,
    SlTourFooter,
    SlTourHeader,
    SlTourMedia,
    SlTourNext,
    SlTourPrev,
    SlTourProgress,
    SlTourSkip,
    SlTourTitle,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  template: `<div
    data-ui="tour"
    data-ui-tour=""
    data-part="root"
    data-part-root=""
    [attr.data-open]="tour.visible() && tour.arrived() ? '' : null"
    [attr.data-modal]="tour.modal() ? '' : null"
    [attr.data-spot]="tour.spot().move"
    [attr.data-spotlight]="tour.spotlightOn() ? '' : null"
    [attr.data-compact]="tour.compact() ? '' : null"
    [attr.data-missing]="tour.drawn()?.missing ? '' : null"
    [attr.data-placement]="tour.anchored() ? 'anchored' : 'centered'"
    [attr.data-size]="tour.resolvedSize()"
    [attr.data-align]="tour.anchored() ? tour.resolvedAlign() : null"
  >
    @if (tour.modal() || tour.spotlightOn()) {
      <div data-part="backdrop" data-part-backdrop="" aria-hidden="true">
        @if (tour.spotlightOn()) {
          <div data-part="spotlight" data-part-spotlight=""></div>
        }
      </div>
    }
    <div
      data-part="surface"
      data-part-surface=""
      [attr.data-placement]="tour.anchored() ? 'anchored' : 'centered'"
      [attr.data-ready]="tour.ready() ? '' : null"
      [attr.data-leaving]="tour.leaving() ? '' : null"
    >
      @if (!tour.modal()) {
        <span
          data-part="focus-guard"
          data-part-focus-guard=""
          tabindex="0"
          aria-hidden="true"
          (focus)="tour.onGuardFocus()"
        ></span>
      }
      @if (tour.anchored() && tour.resolvedArrow()) {
        <div data-part="arrow" data-part-arrow=""></div>
      }
      @if (tour.card(); as custom) {
        <ng-container [ngTemplateOutlet]="custom.template" />
      } @else {
        <div slTourContent>
          <div slTourMedia></div>
          <div slTourHeader>
            <p slTourProgress></p>
            <button slTourClose></button>
          </div>
          <h2 slTourTitle></h2>
          <p slTourDescription></p>
          <div slTourBody></div>
          <div slTourFooter>
            <button slButton slTourSkip size="sm" tone="secondary" variant="ghost">
              {{ tour.t('skip') }}
            </button>
            <button slButton slTourPrev size="sm" tone="secondary" variant="outline">
              {{ tour.t('prev') }}
            </button>
            <button
              slButton
              slTourNext
              size="sm"
              tone="accent"
              variant="solid"
              [loading]="tour.pending()"
              [messages]="{ loading: tour.t('preparing') }"
            >
              {{ tour.t(tour.last() ? 'done' : 'next') }}
            </button>
          </div>
        </div>
      }
      @if (!tour.modal()) {
        <span
          data-part="focus-guard"
          data-part-focus-guard=""
          tabindex="0"
          aria-hidden="true"
          (focus)="tour.onGuardFocus()"
        ></span>
      }
    </div>
  </div>`,
})
export class SlTourFrame {
  protected readonly tour = inject(SL_TOUR) as unknown as SlTour;
}

/**
 * A guided walk through an interface, one step at a time.
 *
 * `open` and `step` are two-way; `@slotted/core/tour` owns everything between
 * a press and a card — conditions, preparation, a target that arrives late or
 * never. The frame is built from a template and portalled to the end of the
 * document, as `slPopoverLayer`'s is. A modal step makes the page `inert` and
 * keeps focus in the card; an interactive step leaves the page reachable so
 * the reader can operate the target.
 *
 * With no `ng-template slTourCard` inside, it renders the whole card.
 */
@Component({
  selector: 'sl-tour',
  standalone: true,
  exportAs: 'slTour',
  imports: [SlTourFrame],
  providers: [{ provide: SL_TOUR, useExisting: forwardRef(() => SlTour) }],
  styleUrls: ['../../../styles/src/tour/tour.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-container #outlet></ng-container>`,
})
export class SlTour implements TourContext {
  readonly steps = input.required<readonly TourStep[]>();
  /** Whether the tour is showing. Two-way. */
  readonly open = model<boolean>(false);
  /** The current step's id. Two-way; `null` is the first available step. */
  readonly step = model<string | null>(null);

  readonly size = input<TourSize | undefined>(undefined);
  /** `compact` or `regular` decide the phone composition; `auto` takes it below 600 pixels of viewport. */
  readonly layout = input<TourLayout | undefined>(undefined);
  readonly side = input<TourSide | undefined>(undefined);
  readonly align = input<TourAlign | undefined>(undefined);
  readonly missing = input<TourMissing | undefined>(undefined);
  /** Words laid over the catalog of the language in force, key by key. */
  readonly messages = input<PartialMessages<TourMessages> | undefined>(undefined);
  readonly finalFocus = input<TourFocusTarget | undefined>(undefined);

  readonly arrow = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly modalInput = input<boolean | undefined, boolean | string | undefined>(undefined, {
    alias: 'modal',
    transform: optionalBoolean,
  });
  readonly spotlight = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly autoFocus = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly closeOnEscape = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly closeOnOutsidePress = input<boolean | undefined, boolean | string | undefined>(
    undefined,
    { transform: optionalBoolean },
  );
  readonly scrollIntoView = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly keyboardNavigation = input<boolean | undefined, boolean | string | undefined>(
    undefined,
    { transform: optionalBoolean },
  );
  readonly targetTimeout = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly sideOffset = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly alignOffset = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly collisionPadding = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly arrowPadding = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });

  /** One output per transition, carrying the reason, the event and — on a close — the outcome. */
  readonly openChangeRequest = output<TourOpenRequest>();
  readonly stepChangeRequest = output<TourStepRequest>();

  readonly card = contentChild(SlTourCard);
  private readonly stepTemplates = contentChildren(SlTourStep);
  /**
   * Where the frame's view is inserted: inside this component's own view, so
   * the signals its template reads mark this component for check. Inserted
   * into the host's container instead — the parent's view — the frame was
   * never redrawn after the first time outside a test harness that checks the
   * whole tree: the tour opened with no scrim and its card never appeared.
   * The frame's nodes are then moved to the portal, as before.
   */
  private readonly outlet = viewChild.required('outlet', { read: ViewContainerRef });

  private readonly defaults = injectTourDefaults();
  private readonly base = inject(SlTourIdFactory).next();
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(ViewContainerRef).element.nativeElement
    .ownerDocument as Document;

  readonly titleId = `${this.base}-title`;
  readonly descriptionId = `${this.base}-description`;

  /* ── Resolution ─────────────────────────────────────────────────────── */

  private readonly shown = signal<ResolvedStep<TourStep> | null>(null);
  /** The cutout's target and the movement that brings it there. */
  readonly spot = signal<{ target: Element | null; move: SpotMove }>({
    target: null,
    move: 'rest',
  });
  readonly leaving = signal(false);
  /** The card of the drawn step has been placed, and may be shown. */
  readonly ready = signal(false);
  private staging: AbortController | null = null;
  readonly pending = signal(false);
  /** The last step drawn, kept through the exit so the card leaves as it was. */
  readonly drawn = signal<ResolvedStep<TourStep> | null>(null);
  readonly current = computed(() => this.drawn()?.step ?? null);

  /** The tour's own words and the drawn step's, laid over the catalog in that order. */
  private readonly override = computed(() => {
    const step = this.current()?.messages;
    return step === undefined ? this.messages() : { ...this.messages(), ...step };
  });
  /** The family's words in the language in force, with the tour's and the step's `messages` laid over them. */
  readonly t = injectMessages(tourMessages, this.override);

  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  /** The viewport is in the compact size class: a lateral side turns vertical, the card takes the width. */
  private readonly narrow = signal(false);
  readonly compact = computed(() => {
    const layout = this.layout() ?? this.defaults.layout;
    return layout === 'compact' || (layout === 'auto' && this.narrow());
  });
  /** The target leaves a card room on some side; when it does not, the card is centerd over it. */
  private readonly fits = signal(true);
  readonly resolvedSide = computed(() =>
    compactSide(this.current()?.side ?? this.side() ?? this.defaults.side, this.compact()),
  );
  readonly resolvedAlign = computed(
    () => this.current()?.align ?? this.align() ?? this.defaults.align,
  );
  readonly resolvedArrow = computed(() => this.arrow() ?? this.defaults.arrow);
  readonly modal = computed(
    () => (this.modalInput() ?? this.defaults.modal) && this.current()?.interactive !== true,
  );
  private readonly resolvedSpotlight = computed(
    () => this.current()?.spotlight ?? this.spotlight() ?? this.defaults.spotlight,
  );
  private readonly hasTarget = computed(() => (this.drawn()?.target ?? null) !== null);
  readonly anchored = computed(() => this.hasTarget() && this.fits());
  readonly spotlightOn = computed(() => this.resolvedSpotlight() && this.spot().target !== null);

  private readonly progress = computed(() =>
    tourProgress(this.steps(), this.current()?.id ?? null),
  );
  readonly position = computed(() => this.progress().position);
  readonly total = computed(() => this.progress().total);
  readonly first = computed(() => this.progress().first);
  readonly last = computed(() => this.progress().last);
  readonly hasDescription = computed(() => (this.current()?.description ?? '') !== '');

  readonly showPrev = computed(() => this.current()?.actions?.prev ?? !this.first());
  readonly showSkip = computed(
    () => this.current()?.actions?.skip ?? (!this.last() && this.total() > 1),
  );
  readonly showClose = computed(() => this.current()?.actions?.close ?? true);
  readonly showNext = computed(
    () => this.current()?.actions?.next ?? this.current()?.advanceOn === undefined,
  );

  private readonly namedTemplate = (slot: 'body' | 'media') =>
    this.stepTemplates().find((entry) => entry.id() === this.current()?.id && entry.slot() === slot)
      ?.template ?? null;

  readonly bodyTemplate = computed(() => {
    const content = this.current()?.content;
    return typeof content === 'object' && content !== null ? content : this.namedTemplate('body');
  });
  readonly mediaTemplate = computed(() => {
    const media = this.current()?.media;
    return typeof media === 'object' && media !== null ? media : this.namedTemplate('media');
  });

  private readonly controller = createTourController<TourStep>({
    steps: () => this.steps(),
    settings: () => ({
      missing: this.missing() ?? this.defaults.missing,
      targetTimeout: this.targetTimeout() ?? this.defaults.targetTimeout,
    }),
    onShow: (resolved) => this.shown.set(resolved),
    onPending: (value) => {
      if (value) {
        const card = this.document.activeElement?.closest('[data-ui="tour"] [data-part="content"]');
        this.leftFromCard = card !== null && card !== undefined;
      }
      this.pending.set(value);
    },
    requestStep: (id, reason, source) => this.requestStep(id, reason, source as Event | undefined),
    requestClose: (outcome, reason, source) =>
      this.requestOpen(false, reason, outcome, source as Event | undefined),
  });

  /* ── Frame, presence and layer ──────────────────────────────────────── */

  private readonly status = signal<PresenceStatus>('unmounted');
  private readonly presence = createPresence({
    present: false,
    onStatusChange: (next) => this.status.set(next),
  });
  readonly visible = computed(() => this.open() && this.drawn() !== null);
  /**
   * `data-open` is written a frame after the frame exists, so the scrim and
   * the card have a closed style to arrive from.
   */
  readonly arrived = signal(false);
  private readonly mounted = computed(
    () => this.drawn() !== null && (this.visible() || this.status() !== 'unmounted'),
  );
  private readonly rootNode = signal<HTMLElement | null>(null);
  private frameRef: ComponentRef<SlTourFrame> | null = null;
  private portal: PortalRootHandle | null = null;
  private closing: TourOutcome | undefined = undefined;
  private opener: HTMLElement | null = null;
  private focusedStep: string | null = null;
  /** Whether focus was in the card when the reader asked to move; a dialog a step opens may take it meanwhile. */
  private leftFromCard = false;
  private layerHandle: DismissableLayerHandle | null = null;
  private readonly layer = signal<DismissableLayerHandle | null>(null);
  /** The target of an interactive step, which a press on is not a press outside. */
  private readonly interactiveTarget = computed(() =>
    this.current()?.interactive === true ? (this.drawn()?.target ?? null) : null,
  );
  private reposition_: () => void = () => {};

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      const open = this.open();
      const id = this.step();
      untracked(() => {
        if (open) {
          if (this.opener === null) {
            const active = this.document.activeElement;
            this.opener =
              active instanceof HTMLElement && active !== this.document.body ? active : null;
          }
          this.controller.sync(id);
          return;
        }
        this.controller.reset();
        this.shown.set(null);
        this.pending.set(false);
        this.restoreFocus();
        const outcome = this.closing;
        this.closing = undefined;
        if (outcome !== undefined && outcome !== 'close') this.step.set(null);
      });
    });

    /* The steps changed under an open tour: the shown one may have gone. */
    effect(() => {
      const steps = this.steps();
      const shown = untracked(() => this.shown());
      if (shown !== null && !steps.some((candidate) => candidate.id === shown.step.id)) {
        untracked(() => this.controller.sync(null));
      }
    });

    effect(() => this.presence.sync(this.visible()));
    effect((onCleanup) => {
      const root = this.rootNode();
      if (root === null || !this.visible()) {
        untracked(() => this.arrived.set(false));
        return;
      }
      const frame = requestAnimationFrame(() => this.arrived.set(true));
      onCleanup(() => cancelAnimationFrame(frame));
    });
    effect(() => (this.mounted() ? this.build() : this.teardown()));

    /**
     * Every step the controller shows is staged: the old card leaves while the
     * cutout moves and the page scrolls, and the new card arrives once the
     * cutout has landed (`@slotted/core/tour`'s `stageStep`). `drawn` is the
     * step whose card is on screen, and it trails `shown` by that sequence.
     */
    effect(() => {
      const shown = this.shown();
      untracked(() => {
        this.staging?.abort();
        this.staging = null;
        if (shown === null) return;
        const run = new AbortController();
        this.staging = run;
        const opening = this.drawn() === null;
        void stageStep({
          /* Before the tour has an element of its own, the target — or the
             tour's own host — stands in the theme's region and carries the
             same duration tokens. */
          root: this.rootNode() ?? shown.target ?? this.viewContainer.element.nativeElement,
          from: opening ? undefined : this.spot().target,
          to: shown.target,
          scroll: this.scrollIntoView() ?? this.defaults.scrollIntoView,
          signal: run.signal,
          spot: (target, move) => {
            /* Written on the element at once, before the rectangle it moves to
               is: a transition needs its property in place before the value
               changes, and the frame's bindings are drawn a tick later. */
            this.rootNode()?.setAttribute('data-spot', move);
            this.spot.set({ target, move });
          },
          card: (phase) => {
            if (phase === 'leave') {
              this.leaving.set(true);
              return;
            }
            this.ready.set(false);
            /* Whether the arriving card fits beside its target is its own
               target's answer, taken as it arrives. */
            const rect = shown.target?.getBoundingClientRect();
            const view = this.document.defaultView;
            this.fits.set(
              rect === undefined ||
                view === null ||
                cardFits(
                  { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
                  { width: view.innerWidth, height: view.innerHeight },
                ),
            );
            this.drawn.set(shown);
            this.leaving.set(false);
          },
        });
      });
    });

    effect((onCleanup) => {
      const root = this.rootNode();
      const target = this.spot().target;
      if (root === null) return;
      if (target === null) {
        writeTargetRect(root, null);
        return;
      }
      onCleanup(
        watchTarget(target, {
          onRect: (rect) => {
            writeTargetRect(root, rect);
            const view = this.document.defaultView;
            /* Only the card's own target answers whether the card fits beside it. */
            if (view !== null && target === untracked(() => this.drawn()?.target)) {
              this.fits.set(cardFits(rect, { width: view.innerWidth, height: view.innerHeight }));
            }
          },
          onRemoved: () => this.controller.markMissing(),
        }),
      );
    });

    effect((onCleanup) => {
      const view = this.document.defaultView;
      if (!this.mounted() || view === null) return;
      const update = () => this.narrow.set(isCompactViewport(view));
      update();
      view.addEventListener('resize', update, { passive: true });
      onCleanup(() => view.removeEventListener('resize', update));
    });

    effect((onCleanup) => this.place(onCleanup));
    effect((onCleanup) => this.stack(onCleanup));
    effect((onCleanup) => {
      const layer = this.layer();
      const branch = this.interactiveTarget();
      if (layer === null || branch === null) return;
      onCleanup(layer.addBranch(branch));
    });

    effect((onCleanup) => {
      const root = this.rootNode();
      if (root === null || !this.visible() || !this.modal()) return;
      const scope = createFocusScope(root, { contain: true, initial: false, restore: false });
      onCleanup(() => scope.destroy());
    });

    effect(() => {
      const drawn = this.drawn();
      const root = this.rootNode();
      /* A frame still hidden until the frame it arrives in cannot take focus. */
      if (!this.visible() || !this.arrived() || drawn === null || root === null) return;
      afterNextRender(() => this.focusStep(drawn, root), { injector: this.injector });
    });

    /**
     * A step whose target lives in a layer opened after the tour — a dialog its
     * `prepare` opened — would stand under that layer, inert and unreachable.
     * The tour is raised back over it, in the document and in the stack.
     */
    effect((onCleanup) => {
      const root = this.rootNode();
      const target = this.spot().target;
      /* The portal's own element, which stands beside the other layers; the
         root's parent is the frame component's host. */
      const layerNode = root === null ? null : (this.portal?.container ?? null);
      if (!this.visible() || target === null || layerNode === null) return;
      onCleanup(
        keepOverTarget(layerNode, target, () => {
          this.portal?.raise();
          this.layerHandle?.raise();
        }),
      );
    });

    effect((onCleanup) => {
      const target = this.drawn()?.target ?? null;
      const event = this.current()?.advanceOn;
      if (!this.visible() || target === null || event === undefined) return;
      const listener = (source: Event) => this.controller.next(eventReason(source), source);
      target.addEventListener(event, listener);
      onCleanup(() => target.removeEventListener(event, listener));
    });

    destroyRef.onDestroy(() => {
      this.controller.destroy();
      this.presence.destroy();
      this.teardown();
    });
  }

  /* ── The two values ─────────────────────────────────────────────────── */

  private requestOpen(
    next: boolean,
    reason: TourOpenReason,
    outcome: TourOutcome | undefined,
    source: Event | undefined,
  ) {
    if (next === this.open()) return;
    let cancelled = false;
    const state = createControllable<boolean>({
      initial: this.open(),
      onRequest: (raw) => {
        this.openChangeRequest.emit({
          get cancelled() {
            return raw.cancelled;
          },
          cancel: () => raw.cancel(),
          outcome,
          previous: raw.previous,
          reason,
          source: raw.source,
          value: raw.value,
        });
        cancelled = raw.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled || !moved) return;
    if (!next) this.closing = outcome;
    this.open.set(next);
  }

  private requestStep(id: string, reason: TourNavigationReason, source: Event | undefined) {
    if (id === this.step()) {
      this.controller.sync(id);
      return;
    }
    let cancelled = false;
    const state = createControllable<string | null>({
      initial: this.step(),
      onRequest: (raw) => {
        this.stepChangeRequest.emit({
          get cancelled() {
            return raw.cancelled;
          },
          cancel: () => raw.cancel(),
          previous: raw.previous,
          reason,
          source: raw.source,
          value: raw.value,
        });
        cancelled = raw.cancelled;
      },
    });
    const moved = state.request(id, reason, source);
    if (!cancelled && moved) this.step.set(id);
  }

  /* ── The handle a template reaches through exportAs ─────────────────── */

  /** Opens the tour at a step, or at the first available one. */
  start(id?: string) {
    if (id !== undefined) this.requestStep(id, 'programmatic', undefined);
    this.requestOpen(true, 'programmatic', undefined, undefined);
  }

  next(source?: Event) {
    this.controller.next(eventReason(source), source);
  }

  prev(source?: Event) {
    this.controller.prev(eventReason(source), source);
  }

  goTo(id: string) {
    this.controller.goTo(id, 'programmatic');
  }

  close(outcome: TourOutcome = 'close', source?: Event, dismiss = false) {
    this.requestOpen(false, dismiss ? 'dismiss' : eventReason(source), outcome, source);
  }

  /** Measures the target and the card again, after the page moved without scrolling. */
  reposition() {
    this.reposition_();
  }

  onKeyDown(event: KeyboardEvent) {
    if (!(this.keyboardNavigation() ?? this.defaults.keyboardNavigation)) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const origin = event.target instanceof Element ? event.target : null;
    if (isTextEntry(origin)) return;
    const action = tourKey(event.key, origin === null ? 'ltr' : directionOf(origin));
    if (action === null) return;
    event.preventDefault();
    if (action === 'next') this.controller.next('keyboard', event);
    else this.controller.prev('keyboard', event);
  }

  onGuardFocus() {
    const target = this.drawn()?.target;
    let destination: HTMLElement | null = null;
    if (target instanceof HTMLElement) {
      destination = tabbables(target)[0] ?? (target.tabIndex >= 0 ? target : null);
    }
    (destination ?? this.contentNode())?.focus();
  }

  /* ── The frame ──────────────────────────────────────────────────────── */

  private contentNode(): HTMLElement | null {
    return this.rootNode()?.querySelector<HTMLElement>('[data-part="content"]') ?? null;
  }

  private build() {
    if (untracked(() => this.rootNode()) !== null) return;
    const frame = untracked(() => this.outlet()).createComponent(SlTourFrame);
    frame.changeDetectorRef.detectChanges();
    const element: HTMLElement = frame.location.nativeElement;
    const root = element.querySelector<HTMLElement>('[data-ui="tour"]');
    if (root === null) return;

    /**
     * The layer inherits its theme, scheme, density and direction from its
     * origin. The tour's own element stands where the consumer wrote it, in
     * the region whose theme the layer belongs to, which a centerd first step
     * with no target could not otherwise say.
     */
    const host: Element = this.viewContainer.element.nativeElement;
    const portal = createPortalRoot({ origin: untracked(() => this.drawn()?.target ?? host) });
    (portal.container ?? this.document.body).appendChild(element);

    this.frameRef = frame;
    this.portal = portal;
    this.presence.setNode(root);
    this.rootNode.set(root);
  }

  private teardown() {
    const root = untracked(() => this.rootNode());
    if (root === null && this.frameRef === null) return;
    this.presence.setNode(null);
    this.frameRef?.location.nativeElement.remove();
    this.rootNode.set(null);
    this.frameRef?.destroy();
    this.frameRef = null;
    this.portal?.release();
    this.portal = null;
    untracked(() => {
      this.drawn.set(null);
      this.spot.set({ target: null, move: 'rest' });
      this.leaving.set(false);
      this.ready.set(false);
    });
  }

  private place(onCleanup: (cleanup: () => void) => void) {
    const root = this.rootNode();
    const target = this.anchored() ? (this.drawn()?.target ?? null) : null;
    const stepId = this.current()?.id;
    const options = {
      align: this.resolvedAlign(),
      alignOffset: this.alignOffset() ?? this.defaults.alignOffset,
      boundaryPadding: this.collisionPadding() ?? this.defaults.collisionPadding,
      side: this.resolvedSide(),
      sideOffset: this.sideOffset() ?? this.defaults.sideOffset,
      strategy: 'absolute' as const,
    };
    const arrowPadding = this.arrowPadding() ?? this.defaults.arrowPadding;
    const withArrow = this.resolvedArrow();
    if (root === null || stepId === undefined) return;

    let destroy: () => void = () => {};
    let live = true;
    afterNextRender(
      () => {
        if (!live) return;
        const surface = root.querySelector<HTMLElement>('[data-part="surface"]');
        if (surface === null) return;
        if (target === null) {
          surface.style.removeProperty('left');
          surface.style.removeProperty('top');
          surface.removeAttribute('data-side');
          surface.removeAttribute('data-positioned');
          /* A centerd card is placed by the stylesheet; it is ready on the
             next frame, so its arrival starts from nothing. */
          requestAnimationFrame(() => live && this.ready.set(true));
          return;
        }
        const arrow = withArrow ? root.querySelector<HTMLElement>('[data-part="arrow"]') : null;
        const handle = createPositioner(target, surface, {
          ...options,
          ...(arrow ? { arrow, arrowPadding } : {}),
        });
        this.reposition_ = () => void handle.update();
        void handle.update().then(() => {
          if (live) requestAnimationFrame(() => live && this.ready.set(true));
        });
        destroy = () => {
          handle.destroy();
          surface.removeAttribute('data-positioned');
          this.reposition_ = () => {};
        };
      },
      { injector: this.injector },
    );
    onCleanup(() => {
      live = false;
      destroy();
    });
  }

  /**
   * One layer in the single stack. A modal step makes everything outside it
   * `inert` and holds a history entry for the way back; the target of an
   * interactive step is a branch, so pressing it is not a press outside.
   */
  /**
   * The layer is made again only when something that defines it changes —
   * whether it is modal, and the two dismissals. A modal layer holds a history
   * entry for the way back, and one made again on every step gave its entry
   * back and took a new one on every Next: the browser's own `popstate` for
   * the entry given back arrived as the way back, and the tour closed itself.
   * The target of an interactive step joins the layer as a branch instead.
   */
  private stack(onCleanup: (cleanup: () => void) => void) {
    const root = this.rootNode();
    const visible = this.visible();
    const modal = this.modal();
    const escape = this.closeOnEscape() ?? this.defaults.closeOnEscape;
    const outside = this.closeOnOutsidePress() ?? this.defaults.closeOnOutsidePress;
    if (root === null || !visible) return;
    const surface = root.querySelector<HTMLElement>('[data-part="surface"]') ?? root;

    const layer = createDismissableLayer(root, {
      back: modal,
      content: surface,
      escape,
      modal,
      outsidePress: outside,
      scrollLock: false,
      onDismiss: (request) =>
        this.requestOpen(
          false,
          DISMISS_REASONS[request.reason],
          'close',
          request.source as Event | undefined,
        ),
    });
    this.layerHandle = layer;
    this.layer.set(layer);
    onCleanup(() => {
      this.layerHandle = null;
      this.layer.set(null);
      layer.destroy();
    });
  }

  /**
   * Focus follows the reader rather than the tour: the card takes it when the
   * tour opens, and on a step change only when it was already in the card. A
   * reader elsewhere keeps their place and hears the new step instead.
   */
  private focusStep(shown: ResolvedStep<TourStep>, root: HTMLElement) {
    const id = shown.step.id;
    if (this.focusedStep === id) return;
    const first = this.focusedStep === null;
    this.focusedStep = id;
    const content = root.querySelector<HTMLElement>('[data-part="content"]');
    const active = this.document.activeElement;
    const inCard = active === null || active === this.document.body || root.contains(active);

    /* The mark is the navigation's that led here; the opening has none, and
       a first card focused late must not take the mark of the next move. */
    const fromCard = !first && this.leftFromCard;
    if (!first) this.leftFromCard = false;
    if (first ? (this.autoFocus() ?? this.defaults.autoFocus) : inCard || fromCard) {
      content?.focus({ preventScroll: true });
      return;
    }
    if (!first) {
      const text = shown.step.announcement ?? shown.step.title;
      if (text !== '') getLiveAnnouncer(this.document).announce(text);
    }
  }

  private restoreFocus() {
    const wasOpen = this.focusedStep !== null;
    this.focusedStep = null;
    const origin = this.opener;
    this.opener = null;
    if (!wasOpen) return;
    const root = this.rootNode();
    const active = this.document.activeElement;
    const inside =
      active === null || active === this.document.body || (root?.contains(active) ?? false);
    if (!inside) return;
    const named = this.finalFocus();
    const destination =
      named === undefined
        ? origin
        : typeof named === 'string'
          ? this.document.querySelector<HTMLElement>(named)
          : (named as HTMLElement);
    if (destination?.isConnected) destination.focus();
  }
}
