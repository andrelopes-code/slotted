import { isPlatformBrowser } from '@angular/common';
import { injectMessages } from '@slotted/angular/i18n';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import type { DismissableLayerHandle } from '@slotted/core/dismissable-layer';
import {
  attachSheetScroll,
  extentBounds,
  isInlineSide,
  measureSheetStops,
  sameStop,
  stopAsExtent,
} from '@slotted/core/extent';
import type { SheetScroll } from '@slotted/core/extent';
import { createFocusScope } from '@slotted/core/focus';
import type { FocusScopeHandle } from '@slotted/core/focus';
import { drawerMessages, type DrawerMessages, type PartialMessages } from '@slotted/core/i18n';
import { clamp, observeKeyboardInset } from '@slotted/core/measure';
import { createPortalRoot } from '@slotted/core/portal';
import type { PortalRootHandle } from '@slotted/core/portal';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle, PresenceStatus } from '@slotted/core/presence';
import { createControllable } from '@slotted/core/state';
import {
  afterRenderEffect,
  ApplicationRef,
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
  model,
  OnInit,
  output,
  PLATFORM_ID,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';

import { injectDrawerDefaults, SlDrawerIdFactory } from './drawer-defaults';
import type {
  DrawerChangeRequest,
  DrawerDismissPolicy,
  DrawerDrag,
  DrawerExtentReason,
  DrawerExtentRequest,
  DrawerFinalFocus,
  DrawerInitialFocus,
  DrawerMode,
  DrawerMount,
  DrawerOpenReason,
  DrawerSide,
  DrawerSize,
} from './drawer-defaults';

const NO_SNAP_POINTS: readonly number[] = [];

/** What the stylesheet leaves above a content sheet, for the press outside. */
const CONTENT_RESERVE = 'var(--slotted-space-12, 4rem)';

/** How long a close by the hand waits before it reads the consumer's refusal. */
const REFUSED_CLOSE_MS = 300;

/**
 * A panel that comes in from an edge, and either covers the page or stands
 * beside it.
 *
 * The layer is composed from `packages/core` and rewritten nowhere: `portal`
 * decides where it lives and keeps the theme of the region that opened it,
 * `dismissable-layer` owns Escape, outside press, `inert`, the scroll lock and
 * the single z-index stack, `presence` keeps it mounted long enough to leave,
 * `focus` contains the keyboard and gives it back to the trigger, and `extent`
 * holds the arithmetic the separator's pointer and keyboard share.
 *
 * **The host is not the layer.** `<sl-drawer>` renders `display: contents` and
 * stays exactly where the consumer wrote it; the layer is the `div` in the
 * template. Under `mode="overlay"` that `div` is moved into the portal and
 * given back before it is destroyed; under `mode="inline"` it never moves,
 * which is what makes the host's own parent the drawer's place in the layout.
 * Either way the host is the portal's *origin*, so the layer keeps the scheme,
 * density, theme and direction of the region it was written in whether or not
 * a trigger exists — React has to use the trigger for that, and
 * `docs/history/designs/2026-09-04-drawer-design.md` §11 records the
 * asymmetry rather than levelling both down.
 */
@Component({
  selector: 'sl-drawer',
  standalone: true,
  exportAs: 'slDrawer',
  template: `
    @if (mounted()) {
      <div
        #layer
        data-ui="drawer"
        data-ui-drawer=""
        data-part="root"
        data-part-root=""
        [attr.data-mode]="resolvedMode()"
        [attr.data-side]="resolvedSide()"
        [attr.data-size]="resolvedSize()"
        [attr.data-mount]="resolvedMount()"
        [attr.data-modal]="resolvedModal() ? '' : null"
        [attr.data-open]="visible() ? '' : null"
        [attr.data-loading]="loading() ? '' : null"
        [attr.data-dragging]="dragging() ? '' : null"
        [attr.data-drag]="sheet() ? resolvedDrag() : null"
        [attr.data-undimmed]="undimmed() ? '' : null"
        [attr.data-expanded]="expanded() ? '' : null"
        [attr.inert]="interactive() ? null : ''"
        [style.--slotted-drawer-extent]="extentLength()"
      >
        @if (showBackdrop()) {
          <div data-part="backdrop" data-part-backdrop=""></div>
        }
        <div
          #panel
          data-part="panel"
          data-part-panel=""
          [id]="panelId"
          [attr.role]="role()"
          [attr.aria-modal]="resolvedModal() ? 'true' : null"
          [attr.aria-label]="label()"
          [attr.aria-labelledby]="labelledBy()"
          [attr.aria-describedby]="describedBy()"
        >
          <ng-content />
        </div>
      </div>
    }
  `,
  styleUrl: '../../../styles/src/drawer/drawer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  /* The host is the origin the layer inherits its theme from, and nothing else. */
  host: { '[style.display]': "'contents'" },
})
export class SlDrawer implements OnInit {
  /** Whether the drawer is open. Two-way, so a template may bind it directly. */
  readonly open = model<boolean>(false);

  /**
   * How much of the box the panel is measured in it takes, in `[0, 1]`. Unset
   * means the `size` step decides. It is a fraction rather than a length so
   * that the separator's three ARIA values, the limits and the snap points are
   * all the same kind of number.
   */
  readonly extent = model<number | undefined>(undefined);

  readonly mode = input<DrawerMode | undefined>(undefined);
  readonly side = input<DrawerSide | undefined>(undefined);
  readonly size = input<DrawerSize | undefined>(undefined);
  readonly mount = input<DrawerMount | undefined>(undefined);
  readonly escape = input<DrawerDismissPolicy | undefined>(undefined);
  readonly outsidePress = input<DrawerDismissPolicy | undefined>(undefined);
  /**
   * The platform's way back — a phone's gesture, a browser's button — closes
   * the layer instead of leaving the page, while the layer is modal.
   */
  readonly back = input<DrawerDismissPolicy | undefined>(undefined);
  /**
   * Whether the background is inert, the scroll is locked and focus is
   * contained. Fixed at `false` under `mode="inline"`: a panel in the flow that
   * claimed `aria-modal` while the page around it stayed reachable is the
   * failure the APG calls severe.
   */
  readonly modal = input(true, { transform: booleanAttribute });
  /** Whether the panel's content is still on its way. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Words laid over the catalog of the language in force, key by key: the close control's name (`close`). */
  readonly messages = input<PartialMessages<DrawerMessages> | undefined>(undefined);
  /** What a hand moves an overlay sheet from the bottom by. */
  readonly drag = input<DrawerDrag | undefined>(undefined);
  /**
   * Below this fraction the scrim is not painted and a press reaches the page:
   * the sheet over a map. It pairs with `[modal]="false"` and
   * `outsidePress="none"`, because a page left undimmed and inert would promise
   * something it does not do.
   */
  readonly scrimFrom = input(0);
  /** The smallest the reader may make it. A drag released below it asks to close. */
  readonly minExtent = input(0.2);
  readonly maxExtent = input(1);
  /** The stops the separator lands on. Empty means the range is continuous. */
  readonly snapPoints = input<readonly number[]>(NO_SNAP_POINTS);
  /** A parent for this layer alone, instead of the shared portal root. */
  readonly container = input<Element | null | undefined>(undefined);
  readonly initialFocus = input<DrawerInitialFocus | undefined>(undefined);
  readonly finalFocus = input<DrawerFinalFocus | undefined>(undefined);

  /** One output per transition, each carrying its reason and its event. */
  readonly openChangeRequest = output<DrawerChangeRequest>();
  readonly extentChangeRequest = output<DrawerExtentRequest>();
  /**
   * What `afterClosed()` is in Angular Material, as an output. It fires once
   * the drawer has actually closed, with the result the close carried.
   */
  readonly closed = output<string | undefined>();
  /**
   * After the panel's entrance or exit has ended: `true` once it is settled
   * open, `false` once it has left. An application that removes the drawer on
   * close waits for `false`, so the exit runs.
   */
  readonly openChangeComplete = output<boolean>();

  private readonly defaults = injectDrawerDefaults();
  /** The family's words in the language in force, with this drawer's `messages` laid over them. */
  readonly t = injectMessages(drawerMessages, this.messages);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  /** The server lays nothing out, and its DOM cannot be measured. */
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private readonly appRef = inject(ApplicationRef);
  /** The scroll that moves a sheet from the bottom, while its panel is there. */
  sheetScroll: SheetScroll | null = null;
  /** Whether the sheet was open when its opening and closing were last answered. */
  private sheetWasOpen = false;
  private readonly baseId = inject(SlDrawerIdFactory).next();

  /** The element the consumer wrote us beside, recorded before anything moves. */
  private readonly origin = this.host.parentElement;

  /**
   * A consumer's own `aria-label` on `<sl-drawer>`, read before the host
   * bindings are written and moved to the panel, which is the element the role
   * is on. Without this a label written on the host would name a box with
   * `display: contents` and no role at all.
   */
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), {
    optional: true,
  });

  protected readonly layerRef = viewChild<ElementRef<HTMLElement>>('layer');
  protected readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  /** The parts that have said they exist, so only what was rendered is wired. */
  readonly hasTitle = signal(false);
  readonly hasDescription = signal(false);
  readonly triggerNode = signal<HTMLElement | null>(null);
  /** Whether the reader has the separator under the pointer. */
  readonly dragging = signal(false);
  /**
   * Where the hand is holding the panel while the body is dragged, which may be
   * past the highest stop. `null` outside a gesture: the request is made once,
   * on release, rather than once per move.
   */
  readonly live = signal<number | null>(null);
  /**
   * What the panel measures at rest — the height of its content under
   * `size="content"` — as a fraction, measured while `extent` is unset.
   */
  readonly rest = signal<number | undefined>(undefined);

  readonly titleId = `${this.baseId}-title`;
  readonly descriptionId = `${this.baseId}-description`;
  readonly panelId = `${this.baseId}-panel`;
  readonly triggerId = `${this.baseId}-trigger`;

  /**
   * The status rather than a boolean. `entering` is one frame long and it is
   * the whole reason it exists: a panel that appears already open gives its CSS
   * transition no closed style to start from.
   */
  private readonly status = signal<PresenceStatus>('unmounted');
  private readonly presence: PresenceHandle = createPresence({
    present: false,
    onStatusChange: (next) => this.status.set(next),
    onEnterComplete: () => this.openChangeComplete.emit(true),
    onExitComplete: () => this.openChangeComplete.emit(false),
  });

  /** Whether this drawer has ever been open, which is what `lazy` reads. */
  private readonly seen = signal(false);
  private readonly result = signal<string | undefined>(undefined);
  /** The measured length the stylesheet reads, kept in step by an observer. */
  private readonly measured = signal<string | null>(null);

  readonly resolvedMode = computed(() => this.mode() ?? this.defaults.mode);
  readonly resolvedSide = computed(() => this.side() ?? this.defaults.side);
  /**
   * A sheet measures what it holds and a side panel takes a named step: every
   * native sheet sizes to its content, and Ant, Fluent and MUI all give a side
   * panel a width. The side decides only when nothing else has.
   */
  readonly resolvedSize = computed<DrawerSize>(() => {
    const side = this.resolvedSide();
    return (
      this.size() ?? this.defaults.size ?? (side === 'top' || side === 'bottom' ? 'content' : 'md')
    );
  });
  readonly resolvedDrag = computed<DrawerDrag>(() => this.drag() ?? this.defaults.drag);
  /** An overlay sheet from the bottom, which is the only panel a body drag moves. */
  readonly sheet = computed(
    () => this.resolvedMode() === 'overlay' && this.resolvedSide() === 'bottom',
  );
  /** The measure right now: the hand's while a body drag holds it, the state otherwise. */
  readonly currentExtent = computed(() => this.live() ?? this.extent());
  /**
   * A sheet that spans the layer is the screen: the stylesheet squares its top
   * corners and clears the safe area above its header.
   */
  protected readonly expanded = computed(() => {
    const extent = this.extent();
    return (
      this.resolvedMode() === 'overlay' &&
      this.resolvedSide() === 'bottom' &&
      (this.resolvedSize() === 'full' || (extent !== undefined && sameStop(extent, 1)))
    );
  });
  protected readonly undimmed = computed(
    () =>
      this.resolvedMode() === 'overlay' &&
      (this.currentExtent() ?? this.rest() ?? 1) < this.scrimFrom(),
  );
  readonly resolvedMount = computed(() => this.mount() ?? this.defaults.mount);
  readonly resolvedModal = computed(() =>
    this.resolvedMode() === 'inline' ? false : this.modal(),
  );
  readonly resolvedEscape = computed<DrawerDismissPolicy>(() =>
    this.resolvedMode() === 'inline' ? 'none' : (this.escape() ?? this.defaults.escape),
  );
  readonly resolvedBack = computed<DrawerDismissPolicy>(() =>
    this.resolvedMode() === 'inline' ? 'none' : (this.back() ?? this.defaults.back),
  );
  readonly resolvedOutsidePress = computed<DrawerDismissPolicy>(() =>
    this.resolvedMode() === 'inline' ? 'none' : (this.outsidePress() ?? this.defaults.outsidePress),
  );

  /**
   * The limits are the first and last stop when there are stops, because a
   * range whose ends no stop can reach has two values nothing produces.
   */
  readonly bounds = computed(() => {
    const stops = extentBounds(this.snapPoints(), this.minExtent(), this.maxExtent());
    /* Under `content` the height of the content is a stop above the snap
       points, so the range reaches past the last of them. */
    return this.resolvedSize() === 'content'
      ? { ...stops, max: Math.max(stops.max, this.maxExtent()) }
      : stops;
  });

  /**
   * An inline drawer is always in the document: its own measure is what opens
   * and closes, and a box that left the layout would take the page's columns
   * with it every time the reader closed the panel.
   */
  readonly mounted = computed(() => {
    if (this.resolvedMode() === 'inline') return true;
    const mount = this.resolvedMount();
    if (mount === 'eager') return true;
    if (mount === 'lazy') return this.seen();
    return this.status() !== 'unmounted';
  });

  /** What the stylesheet keys on, which is a frame behind what was asked. */
  readonly visible = computed(() =>
    this.resolvedMode() === 'inline' ? this.open() : this.status() === 'open',
  );
  /**
   * Whether the layer takes focus and the pointer. `entering` counts: the
   * focus scope enters in that frame, and a layer still `inert` then refuses
   * the initial focus and leaves it on `body`.
   */
  readonly interactive = computed(() => {
    if (this.resolvedMode() === 'inline') return this.open();
    const status = this.status();
    return status === 'entering' || status === 'open';
  });

  /**
   * The scrim belongs to the layer, not to the dismissal policy: `modal`
   * decides what happens to the page behind it and never what is painted.
   * `dialog` draws it the same way, and a consumer who wants none sets
   * `--slotted-drawer-scrim: transparent`.
   */
  protected readonly showBackdrop = computed(() => this.resolvedMode() === 'overlay');
  protected readonly extentLength = computed(() => this.measured());
  /* An inline panel writes no role, and a name on a generic element names
     nothing: the consumer's landmark around it carries the name. */
  protected readonly labelledBy = computed(() =>
    this.resolvedMode() === 'overlay' && this.hasTitle() && this.writtenLabel === null
      ? this.titleId
      : null,
  );
  protected readonly describedBy = computed(() =>
    this.hasDescription() ? this.descriptionId : null,
  );
  protected readonly label = computed(() => this.writtenLabel);
  /**
   * Under `inline` the panel is a region of the page rather than a window over
   * it, so it writes no role: a navigation drawer is a navigation landmark and
   * a filter panel is complementary, and a family that cannot know which one
   * guesses wrong half the time. A consumer names it on their own element.
   */
  protected readonly role = computed(() => (this.resolvedMode() === 'overlay' ? 'dialog' : null));

  private portal: PortalRootHandle | null = null;
  private layer: DismissableLayerHandle | null = null;
  private scope: FocusScopeHandle | null = null;

  /**
   * What the consumer's own binding said before the reader moved anything.
   *
   * Read in `ngOnInit` and not in the field initializer: Angular creates every
   * directive in a template before it binds any input, so a measure read at
   * construction is always the model's own default and never the consumer's.
   */
  private initialExtent: number | undefined = undefined;

  ngOnInit() {
    this.initialExtent = this.extent();
  }

  constructor() {
    effect(() => {
      if (this.open()) this.seen.set(true);
      this.presence.sync(this.open());
    });

    /* A sheet closed by a drag keeps the hand's position through its exit, so
       it slides from there; opening again starts from rest. */
    effect(() => {
      if (this.open()) untracked(() => this.live.set(null));
    });

    /** Where an overlay layer lives, for as long as it is in the document. */
    effect(() => {
      const node = this.layerRef()?.nativeElement ?? null;
      this.presence.setNode(node);

      if (node === null || this.resolvedMode() === 'inline') {
        this.releasePortal();
        return;
      }
      if (this.portal !== null) return;

      const named = this.container();
      this.portal = createPortalRoot({
        origin: this.origin,
        ...(named === undefined ? {} : { container: named }),
      });
      this.portal.container?.append(node);
    });

    /**
     * The measure as a length the stylesheet can use. The public value is a
     * fraction; a percentage would not do, because under `inline` the drawer is
     * the box being sized and a percentage of its own containing block resolves
     * against a track whose size depends on it. The observer is what keeps the
     * pixels and the fraction in step when the window changes.
     */
    effect((onCleanup) => {
      const box = this.measuringBox();
      const fraction = this.currentExtent();
      const inline = isInlineSide(this.resolvedSide());

      if (box === null || fraction === undefined || !this.browser) {
        this.measured.set(null);
        return;
      }

      const measure = () => {
        const rect = box.getBoundingClientRect();
        const span = inline ? rect.width : rect.height;
        if (span > 0) this.measured.set(`${Math.round(fraction * span)}px`);
      };

      measure();
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(measure);
      observer.observe(box);
      onCleanup(() => observer.disconnect());
    });

    /**
     * Everything the drawer does while it is open, taken down when it closes
     * rather than when the node leaves — `presence` keeps the node mounted
     * through the exit, and a layer still holding the scroll lock and the
     * background's `inert` for those milliseconds is a page nobody can touch.
     *
     * An inline drawer composes neither the layer nor containment: it is a box
     * in the page, nothing is inert and nothing is contained. It still enters a
     * focus scope, because the scope is what returns focus to the trigger when
     * a panel the reader is standing in closes underneath them.
     */
    effect((onCleanup) => {
      const node = this.layerRef()?.nativeElement;
      const panel = this.panelRef()?.nativeElement;
      if (!this.open() || node === undefined || panel === undefined) return;

      const overlay = this.resolvedMode() === 'overlay';
      const escape = this.resolvedEscape() === 'close';
      const outsidePress = this.resolvedOutsidePress() === 'close';
      const modal = this.resolvedModal();
      /* A history entry is a modal layer's: a layer the page stays reachable
         under has no claim on the way back. */
      const back = modal && this.resolvedBack() === 'close';
      const trigger = this.triggerNode();

      if (overlay) {
        /* The panel is what a press is inside of; the scrim is the way out, on
           the click rather than the pointerdown so a selection dragged out of
           the panel is not a press on the scrim. */
        this.layer = createDismissableLayer(node, {
          back,
          branches: trigger === null ? [] : [trigger],
          content: panel,
          escape,
          modal,
          onDismiss: (request) => {
            if (request.reason === 'outsidePress' && !outsidePress) return request.cancel();
            this.request(false, request.reason as DrawerOpenReason, undefined, request.source);
          },
          outsidePress,
          outsidePressEvent: 'click',
        });
      }

      const wanted = this.initialFocus() ?? 'first';
      const returnTo = this.finalFocus();
      /**
       * Where focus goes back to with no `finalFocus`: what held it when the
       * drawer opened, or the trigger when that was nothing. A click does not
       * focus a button in Safari, so a drawer opened from its trigger there
       * had `body` as its origin and gave focus back to nowhere.
       */
      const origin = panel.ownerDocument.activeElement as HTMLElement | null;
      const originParent = origin?.parentElement ?? null;
      const fallback = (): HTMLElement | null => {
        if (origin === null || origin === origin.ownerDocument.body) return this.triggerNode();
        if (origin.isConnected) return origin;
        /* The row the drawer was opened from has gone: its nearest ancestor
           that is still in the document, as the contract's restore rule says. */
        let node: HTMLElement | null = originParent;
        while (node !== null && !node.isConnected) node = node.parentElement;
        return node;
      };
      this.scope = createFocusScope(panel, {
        contain: overlay && modal,
        initial: !overlay ? false : wanted instanceof HTMLElement ? () => wanted : wanted,
        restore: returnTo === undefined ? fallback : returnTo === false ? false : () => returnTo,
      });
      this.scope.enter();

      onCleanup(() => {
        /* The layer first: while it stands, a modal layer keeps every sibling
           up to the root `inert`, and focus given back to a trigger there is
           refused — the reader lands on `body`. */
        this.layer?.destroy();
        this.layer = null;
        this.scope?.destroy();
        this.scope = null;
        this.closed.emit(this.result());
        this.result.set(undefined);
      });
    });

    /**
     * What the panel measures at rest, as a fraction, while nothing has moved
     * it. It is what the separator reports and what `scrimFrom` compares
     * against, and content that arrives while the sheet is open moves it, so it
     * is observed rather than read once.
     */
    effect((onCleanup) => {
      const box = this.measuringBox();
      const panel = this.panelRef()?.nativeElement;
      if (
        !this.browser ||
        box === null ||
        panel === undefined ||
        !this.open() ||
        this.extent() !== undefined ||
        this.live() !== null ||
        this.dragging()
      ) {
        return;
      }
      const inline = isInlineSide(this.resolvedSide());
      const read = () => {
        /* A sheet's panel is as tall as its content; its rest is the scroll's. */
        if (this.sheetScroll !== null) return;
        const rect = box.getBoundingClientRect();
        const span = inline ? rect.width : rect.height;
        if (span <= 0) return;
        const own = inline ? panel.offsetWidth : panel.offsetHeight;
        this.rest.set(Math.round((own / span) * 1000) / 1000);
      };
      /* The observer's first report arrives after the layout that placed the
         panel, so reading there lays nothing out; a read here, as the panel
         mounts, forced that layout early. */
      if (typeof ResizeObserver === 'undefined') {
        read();
        return;
      }
      const observer = new ResizeObserver(read);
      observer.observe(panel);
      observer.observe(box);
      onCleanup(() => observer.disconnect());
    });

    /**
     * The virtual keyboard. The layer recedes by what it covers, so the panel
     * lands above the keys; `@slotted/core/measure` reads it from the visual
     * viewport.
     */
    effect((onCleanup) => {
      const node = this.layerRef()?.nativeElement;
      if (node === undefined || !this.open() || this.resolvedMode() !== 'overlay') return;
      const stop = observeKeyboardInset(node.ownerDocument.defaultView, (pixels) => {
        if (pixels === 0) node.style.removeProperty('--slotted-keyboard-inset');
        else node.style.setProperty('--slotted-keyboard-inset', `${pixels}px`);
      });
      onCleanup(() => {
        stop();
        node.style.removeProperty('--slotted-keyboard-inset');
      });
    });

    /**
     * A sheet from the bottom is moved by the platform's own scroll: the layer
     * scrolls, and its `scrollTop` is how much of the panel is in sight
     * (`attachSheetScroll`). The finger, the fling and the landing are the
     * compositor's; the family reads where the scroll came to rest and asks
     * for that extent, or for the close.
     */
    effect((onCleanup) => {
      const node = this.layerRef()?.nativeElement;
      const panel = this.panelRef()?.nativeElement;
      if (!this.browser || node === undefined || panel === undefined || !this.sheet()) return;
      const scroll = untracked(() =>
        attachSheetScroll(node, panel, {
          content: () => this.resolvedSize() === 'content',
          dismissible: () => true,
          onScroll: (at) => {
            const from = this.scrimFrom();
            if (from > 0) node.toggleAttribute('data-undimmed', at < from);
          },
          onSettle: (at) => {
            if (!this.open()) return;
            if (at === 'close') {
              this.request(false, 'pointer', undefined, null);
              /* A close the consumer refused puts the sheet back where it rests,
                 read once a change detection has had time to land. */
              setTimeout(() => {
                if (this.open() && scroll.at() === 0) scroll.scrollTo(scroll.rest(), true);
              }, REFUSED_CLOSE_MS);
              return;
            }
            this.requestExtent(this.asRequest(at, scroll.rest()), 'pointer', null);
          },
          reserve: CONTENT_RESERVE,
          snapPoints: () => this.snapPoints(),
          step: 'var(--_step)',
        }),
      );
      this.sheetScroll = scroll;
      onCleanup(() => {
        scroll.destroy();
        this.sheetScroll = null;
        this.sheetWasOpen = false;
      });
    });

    /**
     * Opening scrolls the sheet up from out of sight to its resting stop, and
     * closing other than by the hand scrolls it back down, in the drawer's
     * slide tokens both ways, the motion a released drag ends with. After the
     * render, when the layer is laid out.
     */
    afterRenderEffect(() => {
      const open = this.open();
      const interactive = this.interactive();
      this.panelRef();
      untracked(() => {
        const scroll = this.sheetScroll;
        if (scroll === null) return;
        if (open && interactive && !this.sheetWasOpen) {
          this.sheetWasOpen = true;
          scroll.enter(this.extent());
        } else if (!open && this.sheetWasOpen) {
          this.sheetWasOpen = false;
          if (scroll.at() > 0) scroll.scrollTo(0, true);
        }
      });
    });

    /* A measure asked for by the keyboard, the grabber or the consumer is scrolled to. */
    afterRenderEffect(() => {
      const extent = this.extent();
      const open = this.open();
      untracked(() => {
        const scroll = this.sheetScroll;
        const node = this.layerRef()?.nativeElement;
        /* An opening reads and writes in frames of its own; it scrolls to the extent itself. */
        if (scroll === null || node === undefined || !open || !this.sheetWasOpen || scroll.busy()) {
          return;
        }
        const wanted = extent ?? scroll.rest();
        if (Math.abs(scroll.at() - wanted) * node.clientHeight > 2) scroll.scrollTo(wanted, true);
      });
    });

    this.destroyRef.onDestroy(() => {
      this.scope?.destroy();
      this.layer?.destroy();
      this.presence.destroy();
      this.releasePortal();
    });
  }

  /** Renders what the signals hold now, so a gesture can let go of the panel it laid out. */
  flush() {
    this.appRef.tick();
  }

  /** The stops a sheet rests on and the rest among them, measured now. */
  measureStops(panel: HTMLElement, span: number) {
    return measureSheetStops({
      atRest: this.extent() === undefined && this.live() === null,
      content: this.resolvedSize() === 'content',
      panel,
      reserve: CONTENT_RESERVE,
      rest: this.rest(),
      snapPoints: this.snapPoints(),
      span,
    });
  }

  /**
   * What a settled fraction is asked as: the content stop is `undefined`, so
   * the sheet follows its content again when the content grows.
   */
  asRequest(fraction: number, rest: number | undefined) {
    return stopAsExtent(fraction, rest, this.resolvedSize() === 'content');
  }

  /**
   * The box the panel's measure is a fraction of: the layer under `overlay`,
   * which is fixed to the viewport, and the drawer's own parent under `inline`,
   * where the drawer is what is being sized and cannot measure itself.
   */
  measuringBox(): HTMLElement | null {
    const node = this.layerRef()?.nativeElement ?? null;
    if (node === null) return null;
    /* Under `inline` the layer's parent is the host, which renders
       `display: contents` and lays nothing out: the box is the host's own
       parent, the consumer's layout. */
    return this.resolvedMode() === 'inline' ? this.host.parentElement : node;
  }

  /**
   * The layer element is given back to the host before the portal goes, so
   * Angular removes a node that is where its own view expects it to be.
   */
  private releasePortal() {
    if (this.portal === null) return;
    const node = this.layerRef()?.nativeElement;
    if (node !== undefined) this.host.append(node);
    this.portal.release();
    this.portal = null;
  }

  /** Asks to open or close, carrying the reason, the result and the event. */
  request(next: boolean, reason: DrawerOpenReason, result: string | undefined, source: unknown) {
    if (next === this.open()) return;

    let cancelled = false;
    const state = createControllable<boolean>({
      initial: this.open(),
      onRequest: (raw) => {
        cancelled = raw.cancelled;
        this.openChangeRequest.emit({
          cancel: () => raw.cancel(),
          get cancelled() {
            return raw.cancelled;
          },
          previous: raw.previous,
          reason,
          result,
          source: raw.source,
          value: raw.value,
        });
      },
    });

    if (!state.request(next, reason, source) || cancelled) return;
    if (!next) this.result.set(result);
    this.open.set(next);
  }

  /**
   * Asks to move the measure. While the pointer is down the floor is not
   * enforced — a sheet the reader is pulling down has to follow the hand — and
   * the separator decides on release whether that means a smaller panel or a
   * closed one.
   */
  requestExtent(next: number | undefined, reason: DrawerExtentReason, source: unknown) {
    /* `undefined` travels whole: it is the panel back on its size step, and a
       clamp of it would be a clamp of a value that is not a fraction. */
    const wanted = next === undefined ? undefined : clamp(next, 0, this.bounds().max);
    if (wanted === this.extent()) return;

    let cancelled = false;
    const state = createControllable<number | undefined>({
      /* `undefined` is a value of this state — the panel on its size step —
         and not a gap to fill: a floor standing in for it made a request for
         the floor from the content stop look like no change at all. */
      initial: this.extent(),
      onRequest: (raw) => {
        cancelled = raw.cancelled;
        this.extentChangeRequest.emit({
          cancel: () => raw.cancel(),
          get cancelled() {
            return raw.cancelled;
          },
          previous: raw.previous,
          reason,
          source: raw.source,
          value: raw.value,
        });
      },
    });

    if (!state.request(wanted, reason, source) || cancelled) return;
    this.extent.set(wanted);
  }

  /**
   * Back to the measure the size step gives it, which is where the panel
   * started. Angular has one model rather than a controlled and an
   * uncontrolled input, so the measure to restore is the one the model held
   * before anything moved it, read once.
   */
  restoreExtent(reason: DrawerExtentReason, source: unknown) {
    this.requestExtent(this.initialExtent, reason, source);
  }

  /** Opens the drawer from code, carrying `programmatic`. */
  openDrawer() {
    this.request(true, 'programmatic', undefined, undefined);
  }

  /** Closes it from code, carrying `programmatic` and the result given. */
  close(result?: string) {
    this.request(false, 'programmatic', result, undefined);
  }

  /**
   * The panel, once it is in the document — what React's handle calls
   * `panel`. A family that composes the drawer reads it to hand the panel a
   * value only it knows, as `action-sheet` hands it its measure.
   */
  get panel(): HTMLElement | null {
    return this.panelRef()?.nativeElement ?? null;
  }

  /** Moves focus into the panel, as opening an overlay drawer does. */
  focus() {
    this.panelRef()?.nativeElement.focus();
  }
}
