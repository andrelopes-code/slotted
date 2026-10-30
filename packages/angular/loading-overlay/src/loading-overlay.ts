import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import type { DismissableLayerHandle } from '@slotted/core/dismissable-layer';
import { createFocusScope } from '@slotted/core/focus';
import {
  loadingOverlayMessages,
  type LoadingOverlayMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { initialLoadingVisibility, nextLoadingVisibility } from '@slotted/core/loading';
import type { LoadingVisibilityState } from '@slotted/core/loading';
import { createPortalRoot } from '@slotted/core/portal';
import type { PortalRootHandle } from '@slotted/core/portal';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle } from '@slotted/core/presence';
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
  inject,
  input,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { SlLoader } from '@slotted/angular/progress-indicator';

import { injectLoadingOverlayDefaults } from './loading-overlay-defaults';
import {
  LOADING_OVERLAY_DEFAULT_LIVE,
  LOADING_OVERLAY_DEFAULT_SIZE,
  LOADING_OVERLAY_DEFAULT_VEIL,
  type LoadingOverlayCancelReason,
  type LoadingOverlayCancelRequest,
  type LoadingOverlayLive,
  type LoadingOverlayScope,
  type LoadingOverlaySize,
  type LoadingOverlayVeil,
} from './loading-overlay.constants';

/**
 * The mark the consumer puts in the panel, in place of the family's own.
 *
 * It writes nothing and behaves in no way: it exists so the overlay can ask
 * whether a mark was projected at all, which decides whether the slot centers
 * its contents or lets them fill it. A determinate bar has no intrinsic width
 * to be centerd at.
 */
@Directive({ selector: '[slLoadingOverlayIndicator]', standalone: true })
export class SlLoadingOverlayIndicator {}

/**
 * A region of the page taken out of reach while a wait the consumer owns runs.
 *
 * The content stays: in the document, measured, and the thing the region's
 * geometry comes from. That is the whole difference from `skeleton`, which
 * stands in for content that has not arrived, and the reason this family
 * writes `inert` rather than replacing anything.
 *
 * The selector is a bare attribute, so the element stays the consumer's: a
 * region is whatever already wraps the content — a `section`, a card, a list
 * item — and wrapping it in a second element would change their layout to
 * carry an attribute. `skeleton`'s region is written the same way and for the
 * same reason.
 *
 * Four things are composed rather than written here. `@slotted/core/loading`
 * decides when the layer is painted; `@slotted/core/presence` keeps the panel
 * in the document through the wash's exit; `@slotted/core/focus` moves focus
 * out of the content before it goes inert and puts it back after; and, in page
 * scope, `@slotted/core/dismissable-layer` in modal mode makes the rest of the
 * document inert and locks its scroll.
 */
@Component({
  selector: '[slLoadingOverlay]',
  standalone: true,
  imports: [SlLoader],
  template: `
    @if (liveValue() !== 'off') {
      <span
        data-part="announcement"
        data-part-announcement=""
        data-ui="visually-hidden"
        data-ui-visually-hidden=""
        role="status"
        >{{ announcement() }}</span
      >
    }

    @if (scope() === 'region') {
      <div data-part="content" data-part-content="" #content [attr.inert]="painted() ? '' : null">
        <ng-content />
      </div>
    }

    <div
      data-part="scrim"
      data-part-scrim=""
      #scrim
      [attr.data-loading]="painted() ? '' : null"
      (keydown.escape)="onEscape($event)"
    >
      @if (mounted()) {
        <div data-part="panel" data-part-panel="" #panel tabindex="-1">
          <span
            data-part="indicator"
            data-part-indicator=""
            [attr.data-default]="ownMark() ? '' : null"
          >
            <ng-content select="[slLoadingOverlayIndicator]">
              <div slLoader contained decorative [size]="sizeValue()"></div>
            </ng-content>
          </span>
          <span aria-hidden="true" data-part="label" data-part-label="">{{ labelValue() }}</span>
          @if (description(); as text) {
            <span aria-hidden="true" data-part="description" data-part-description="">{{
              text
            }}</span>
          }
          @if (cancellable()) {
            <ng-content select="[slLoadingOverlayCancel]">
              <button
                data-part="cancel"
                data-part-cancel=""
                type="button"
                (click)="requestCancel($event)"
              >
                {{ t('cancel') }}
              </button>
            </ng-content>
          }
        </div>
      }
    </div>
  `,
  styleUrls: [
    '../../../styles/src/loading-overlay/loading-overlay.css',
    '../../../styles/src/progress-indicator/progress-indicator.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slLoadingOverlay',
  host: {
    'data-ui': 'loading-overlay',
    'data-ui-loading-overlay': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-scope]': 'scope()',
    '[attr.data-size]': 'sizeValue()',
    '[attr.data-veil]': 'veilValue()',
    '[attr.data-loading]': 'painted() ? "" : null',
    /* ARIA 1.2 asks for it on the region until it is finished loading. Page
       scope writes it nowhere: the busy region would be the document root, and
       this family owns no part of it. */
    '[attr.aria-busy]': 'scope() === "region" && painted() ? "true" : null',
  },
})
export class SlLoadingOverlay {
  /**
   * Whether the data is still on its way. The consumer's own fact: the family
   * never moves it, so there is no `model()` here and no request for it.
   *
   * Blocking is the default, because a consumer who forgets the input sees a
   * covered region on the first render, while the other default leaves a
   * region reachable during a real wait and says nothing.
   */
  readonly loading = input(true, { transform: booleanAttribute });
  readonly scope = input<LoadingOverlayScope>('region');
  readonly veil = input<LoadingOverlayVeil | undefined>(undefined);
  readonly size = input<LoadingOverlaySize | undefined>(undefined);
  readonly live = input<LoadingOverlayLive | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * short line (`label`), painted in the panel and announced once, and the
   * cancel control's words (`cancel`).
   */
  readonly messages = input<PartialMessages<LoadingOverlayMessages> | undefined>(undefined);
  readonly loadedLabel = input<string | undefined>(undefined);
  readonly description = input<string | undefined>(undefined);
  readonly cancellable = input(false, { transform: booleanAttribute });
  readonly delay = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  readonly minDuration = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  /** Where the page-scoped layer is portalled. Defaults to the document body. */
  readonly container = input<HTMLElement | null | undefined>(undefined);

  /**
   * Asks to stop, carrying the reason and the event. The family commits
   * nothing: abort the work and lower `loading` when it has stopped.
   */
  readonly cancel = output<LoadingOverlayCancelRequest>();
  /**
   * The moment the covered content is reachable again, which is later than
   * `loading` turning false whenever `minDuration` is holding the layer. An
   * application moving focus on the input would move it under the wash.
   */
  readonly reveal = output<void>();

  private readonly defaults = injectLoadingOverlayDefaults();
  /** The family's words in the language in force, with this overlay's `messages` laid over them. */
  readonly t = injectMessages(loadingOverlayMessages, this.messages);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * Whether the mark in the panel is the family's own. A consumer's mark fills
   * the slot and the family's is centerd in it, and only a content query can
   * tell the two apart: `ng-content` fallback content leaves no trace in the
   * DOM that CSS could ask about without reaching into the nested family.
   */
  private readonly projectedMark = contentChild(SlLoadingOverlayIndicator);
  protected readonly ownMark = computed(() => this.projectedMark() === undefined);

  private readonly contentRef = viewChild<ElementRef<HTMLElement>>('content');
  private readonly scrimRef = viewChild<ElementRef<HTMLElement>>('scrim');
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  readonly sizeValue = computed(
    () => this.size() ?? this.defaults.size ?? LOADING_OVERLAY_DEFAULT_SIZE,
  );
  readonly veilValue = computed(
    () => this.veil() ?? this.defaults.veil ?? LOADING_OVERLAY_DEFAULT_VEIL,
  );
  readonly liveValue = computed(
    () => this.live() ?? this.defaults.live ?? LOADING_OVERLAY_DEFAULT_LIVE,
  );
  readonly labelValue = computed(() => this.t('label'));
  private readonly delayValue = computed(() => this.delay() ?? this.defaults.delay ?? 0);
  private readonly holdValue = computed(() => this.minDuration() ?? this.defaults.minDuration ?? 0);

  /** Whether the layer is painted, which is not the `loading` input. */
  readonly painted = signal(false);
  /** Whether the panel belongs in the document, which outlives `painted`. */
  readonly mounted = signal(false);

  /**
   * Emptying a live region announces nothing, which is what makes one wait one
   * announcement rather than two. A completion message is opt-in for the same
   * reason: a page of six regions would otherwise say six things nobody asked
   * to hear. `skeleton` established the rule and this family takes it whole.
   */
  readonly announcement = computed(() =>
    this.painted() ? this.labelValue() : (this.loadedLabel() ?? this.defaults.loadedLabel ?? ''),
  );

  private machine: LoadingVisibilityState = initialLoadingVisibility;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private presence: PresenceHandle | undefined;
  private portal: PortalRootHandle | undefined;
  private layer: DismissableLayerHandle | undefined;

  constructor() {
    const destroy = inject(DestroyRef);
    destroy.onDestroy(() => {
      clearTimeout(this.timer);
      this.presence?.destroy();
      this.layer?.destroy();
      this.portal?.release();
    });

    effect(() => {
      const request = {
        loading: this.loading(),
        delay: this.delayValue(),
        minDuration: this.holdValue(),
      };
      untracked(() => this.settle(request));
    });

    /**
     * The wash is in the document for the life of the family, because a
     * transition needs a style the browser computed last and a node that has
     * just been mounted has none. The panel is not: `presence` mounts it while
     * the layer is painted and holds it through the wash's own exit, so
     * nothing turns a mark nobody is looking at and a resting layer holds no
     * control for Tab to find.
     */
    effect(() => {
      const scrim = this.scrimRef()?.nativeElement;
      const present = this.painted();
      untracked(() => {
        this.presence ??= createPresence({
          present,
          onStatusChange: () => this.mounted.set(this.presence?.mounted ?? false),
        });
        if (scrim !== undefined) this.presence.setNode(scrim);
        this.presence.sync(present);
        this.mounted.set(this.presence.mounted);
      });
    });

    /**
     * Page scope moves the host into a portal root and hands the rest to
     * `dismissable-layer` in modal mode, which writes `inert` on every sibling
     * of that root, locks the document scroll, and takes `Escape` in the
     * capture phase. Outside press is refused outright — a press on the wash is
     * a reader trying to reach what is behind it, and the operation has not
     * finished.
     */
    effect(() => {
      if (this.scope() !== 'page') return;
      const named = this.container();
      untracked(() => {
        this.portal?.release();
        this.portal = createPortalRoot(
          named === undefined || named === null ? {} : { container: named },
        );
        this.portal.container?.append(this.host.nativeElement);
      });
    });

    effect((onCleanup) => {
      const panel = this.panelRef()?.nativeElement;
      if (this.scope() !== 'page' || !this.painted() || panel === undefined) return;
      const escape = this.cancellable();

      const handle = createDismissableLayer(this.host.nativeElement, {
        content: panel,
        escape,
        modal: true,
        onDismiss: (request) => {
          if (request.reason !== 'escape') return;
          this.ask('escape', (request.source ?? new Event('keydown')) as Event);
        },
        outsidePress: false,
      });
      this.layer = handle;
      onCleanup(() => {
        handle.destroy();
        if (this.layer === handle) this.layer = undefined;
      });
    });

    /**
     * The defect none of the surveyed implementations has, because none of
     * them makes anything inert: making an element inert while it holds focus
     * drops focus to the body, and the reader who was typing loses their
     * place.
     *
     * Focus is read before the content goes inert. If it was inside, it moves
     * into the panel — the control when there is one, the panel itself
     * otherwise, which is the `'container'` destination the APG advises for
     * content that has to be read before it is operated. If it was somewhere
     * else, nothing moves: a background save does not take the caret out of
     * another form.
     */
    effect((onCleanup) => {
      const panel = this.panelRef()?.nativeElement;
      if (!this.painted() || panel === undefined) return;
      const page = this.scope() === 'page';
      const cancellable = this.cancellable();

      const active = panel.ownerDocument.activeElement;
      const displaced =
        page || (active !== null && (this.contentRef()?.nativeElement.contains(active) ?? false));
      if (!displaced) return;

      const scope = createFocusScope(panel, {
        contain: page,
        initial: cancellable
          ? () => panel.querySelector<HTMLElement>('[data-part="cancel"]')
          : 'container',
      });
      scope.enter();
      onCleanup(() => scope.destroy());
    });
  }

  /**
   * `Escape` in region scope, where there is no dismissable layer to take it.
   * The listener is on the layer rather than on the document, so the key only
   * asks when focus is inside the thing it is about: an overlay covering a card
   * in the corner of a page has no claim on a key pressed elsewhere.
   */
  protected onEscape(event: Event) {
    if (this.scope() === 'page' || !this.cancellable()) return;
    event.stopPropagation();
    this.ask('escape', event);
  }

  /**
   * Public because the projection directive below calls it: a consumer's own
   * control is the same ask as the family's own.
   */
  requestCancel(source: Event) {
    this.ask('dismiss', source);
  }

  private ask(reason: LoadingOverlayCancelReason, source: Event) {
    this.cancel.emit({ reason, source });
  }

  /**
   * One step of the shared machine, plus at most one timer. The rule lives in
   * `@slotted/core/loading` rather than here so React and Angular cannot
   * disagree about when a layer appears — a difference no test that looked at
   * either binding alone would report.
   */
  private settle(request: { loading: boolean; delay: number; minDuration: number }) {
    clearTimeout(this.timer);
    const answer = nextLoadingVisibility({ ...request, now: Date.now(), state: this.machine });
    this.machine = answer.state;

    const was = this.painted();
    this.painted.set(answer.state.visible);
    if (was && !answer.state.visible) this.reveal.emit();

    if (answer.wait === null) return;
    this.timer = setTimeout(() => this.settle(request), answer.wait);
  }
}

/**
 * Absence has to survive the transform. `numberAttribute` maps an unset input
 * to `NaN`, and `NaN` is a value: it would stop the application's own timing
 * decision from ever reaching an overlay that says nothing.
 */
function optionalNumber(value: unknown): number | undefined {
  return value === undefined || value === null || value === '' ? undefined : numberAttribute(value);
}

/**
 * A consumer's own control, put where the family's would have been.
 *
 * It writes the part and takes the press; everything else about the element is
 * the consumer's, including its paint — the family's own control rules are
 * written `:not([data-ui])`, so a `sl-button` here is a button and not a button
 * wearing this family's clothes as well.
 */
@Directive({
  selector: '[slLoadingOverlayCancel]',
  standalone: true,
  host: {
    'data-part': 'cancel',
    'data-part-cancel': '',
    '(click)': 'overlay.requestCancel($event)',
  },
})
export class SlLoadingOverlayCancel {
  protected readonly overlay = inject(SlLoadingOverlay);
}
