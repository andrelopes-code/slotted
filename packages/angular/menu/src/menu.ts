import { revealWithin } from '@slotted/core/collection';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import type { DismissableLayerHandle } from '@slotted/core/dismissable-layer';
import { createArrowNavigation, tabbables } from '@slotted/core/focus';
import type { ArrowNavigationHandle } from '@slotted/core/focus';
import { createPortalRoot } from '@slotted/core/portal';
import type { PortalRootHandle } from '@slotted/core/portal';
import { createPositioner, submenuOffsets } from '@slotted/core/positioner';
import type { PositionerAnchor, PositionerHandle } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle } from '@slotted/core/presence';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { createTypeahead, isPrintable } from '@slotted/core/typeahead';
import type { TypeaheadHandle } from '@slotted/core/typeahead';
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
  model,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
  ViewContainerRef,
  ViewEncapsulation,
  type EmbeddedViewRef,
  type TemplateRef,
} from '@angular/core';

import { injectMenuDefaults } from './menu-defaults';
import type {
  MenuAlign,
  MenuMount,
  MenuOpenReason,
  MenuSide,
  MenuSize,
  MenuStrategy,
  MenuWidth,
} from './menu-defaults';
import { MENUBAR_SURFACE } from './menu-context';

export type { MenubarSurface } from './menu-context';
export { MENUBAR_SURFACE } from './menu-context';

/** Every item of a surface, in the order the document holds them. */
export const MENU_ITEM_SELECTOR = "[data-part='item']";

const textOf = (item: HTMLElement) =>
  item.dataset['textValue'] ??
  item.querySelector("[data-part='label']")?.textContent?.trim() ??
  item.textContent?.trim() ??
  '';

const enabled = (item: HTMLElement) => item.dataset['disabled'] === undefined;

/**
 * Focus without the browser's own scroll, which reveals an item by scrolling
 * the page as well as the surface and centres it in the window, carrying the
 * layer off its trigger. The surface scrolls inside the room the positioner
 * gives it, so the item is brought into the surface and nothing further.
 */
const reveal = (item: HTMLElement) => {
  item.focus({ preventScroll: true });
  const surface = item.closest<HTMLElement>("[data-part='content']");
  if (surface !== null) revealWithin(item, surface);
};

/**
 * A list of commands on a layer.
 *
 * The component renders **nothing where it is written**: its content lives in a
 * template, and the layer is built into the portal when the menu opens. Angular
 * Material's menu is built the same way and for the same reason — a surface
 * that has to escape its parent's clipping cannot be rendered where it was
 * declared.
 *
 * Where it sits decides what it is. On its own it hangs from the control that
 * carries `slMenuTrigger`. Inside another menu it is a submenu, and its trigger
 * becomes an item of the surface above. Inside `sl-menubar` it is one of the
 * bar's menus, and the bar holds which one is open — a bar has at most one, and
 * a boolean on each could represent two.
 */
@Component({
  selector: 'sl-menu',
  standalone: true,
  exportAs: 'slMenu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['../../../styles/src/menu/menu.css', '../../../styles/src/highlight/highlight.css'],
  host: { style: 'display: none' },
  template: `
    <ng-template #layer>
      <div
        data-ui="menu"
        data-ui-menu=""
        data-part="root"
        data-part-root=""
        [attr.data-align]="resolvedAlign()"
        [attr.data-size]="resolvedSize()"
        [attr.data-width]="resolvedWidth()"
        [attr.data-open]="isOpen() ? '' : null"
        [attr.inert]="isOpen() ? null : ''"
      >
        <div
          #surface
          data-part="content"
          data-part-content=""
          role="menu"
          tabindex="-1"
          [id]="contentId"
          [attr.aria-labelledby]="ariaLabel() === undefined ? triggerId : null"
          [attr.aria-label]="ariaLabel() ?? null"
          [attr.aria-describedby]="describedBy()"
          [attr.aria-busy]="loading() ? true : null"
          [attr.data-loading]="loading() ? '' : null"
          (keydown)="onKeyDown($event)"
        >
          <ng-content />
        </div>
      </div>
    </ng-template>
  `,
})
export class SlMenu {
  /** The name this menu answers to on a bar. */
  readonly value = input<string | undefined>(undefined);
  /** The accessible name, for a menu opened from a control with no words. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  /** The ids of what describes the menu, written on the element that carries `role="menu"`. */
  readonly ariaDescribedBy = input<string | undefined>(undefined, { alias: 'aria-describedby' });
  /** Written by `slMenuHeader`: the block the surface is described by. */
  readonly headerId = signal<string | null>(null);
  /** The consumer's description and the header's, joined. */
  protected readonly describedBy = computed(
    () => [this.ariaDescribedBy(), this.headerId()].filter(Boolean).join(' ') || null,
  );

  readonly open = model<boolean>(false);
  /** One output for one transition, carrying the reason and the event. */
  readonly openChangeRequest = output<ChangeRequest<boolean>>();

  readonly align = input<MenuAlign | undefined>(undefined);
  readonly side = input<MenuSide | undefined>(undefined);
  readonly size = input<MenuSize | undefined>(undefined);
  readonly width = input<MenuWidth | undefined>(undefined);
  readonly mount = input<MenuMount | undefined>(undefined);
  readonly strategy = input<MenuStrategy | undefined>(undefined);
  readonly sideOffset = input<number | undefined, number | string | undefined>(undefined, {
    transform: (given) => (given === undefined ? undefined : numberAttribute(given)),
  });
  readonly alignOffset = input<number | undefined, number | string | undefined>(undefined, {
    transform: (given) => (given === undefined ? undefined : numberAttribute(given)),
  });
  readonly collisionPadding = input<number | undefined, number | string | undefined>(undefined, {
    transform: (given) => (given === undefined ? undefined : numberAttribute(given)),
  });
  readonly submenuOpenDelay = input<number | undefined, number | string | undefined>(undefined, {
    transform: (given) => (given === undefined ? undefined : numberAttribute(given)),
  });
  readonly submenuCloseDelay = input<number | undefined, number | string | undefined>(undefined, {
    transform: (given) => (given === undefined ? undefined : numberAttribute(given)),
  });
  readonly typeaheadTimeout = input<number | undefined, number | string | undefined>(undefined, {
    transform: (given) => (given === undefined ? undefined : numberAttribute(given)),
  });

  private static readonly flag = (given: boolean | string | undefined) =>
    given === undefined ? undefined : booleanAttribute(given);

  readonly disabled = input(undefined, { transform: SlMenu.flag });
  readonly loop = input(undefined, { transform: SlMenu.flag });
  readonly typeahead = input(undefined, { transform: SlMenu.flag });
  readonly openOnHover = input(undefined, { transform: SlMenu.flag });
  readonly closeOnSelect = input(undefined, { transform: SlMenu.flag });
  readonly closeOnEscape = input(undefined, { transform: SlMenu.flag });
  readonly closeOnOutsidePress = input(undefined, { transform: SlMenu.flag });
  readonly flip = input(undefined, { transform: SlMenu.flag });
  readonly shift = input(undefined, { transform: SlMenu.flag });
  readonly hideWhenDetached = input(undefined, { transform: SlMenu.flag });
  readonly portal = input(undefined, { transform: SlMenu.flag });
  /**
   * The surface is waiting for its items. It keeps its measure, says so with
   * `aria-busy`, and shows whatever the consumer put in `slMenuEmpty`.
   */
  readonly loading = input(false, { transform: booleanAttribute });

  private readonly defaults = injectMenuDefaults();
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly template = viewChild.required<TemplateRef<unknown>>('layer');

  /** The surface above this one, when this menu is a submenu of it. */
  readonly parent = inject(SlMenu, { optional: true, skipSelf: true });
  /** The bar in scope. A submenu of a bar's menu still sees it. */
  readonly bar = inject(MENUBAR_SURFACE, { optional: true });
  /** Whether this menu is one of the bar's own rather than nested in one. */
  readonly onBar = this.parent === null && this.bar !== null;

  private readonly identifier = Math.random().toString(36).slice(2, 8);
  readonly contentId = `sl-menu-${this.identifier}`;
  readonly triggerId = `sl-menu-trigger-${this.identifier}`;

  /** The control that opens this menu, given by `slMenuTrigger`. */
  readonly trigger = signal<HTMLElement | null>(null);
  /**
   * What the layer is positioned against when it is not the trigger: a row the
   * menu hangs from, or the point a context menu was opened at, which
   * `slContextMenuTriggerFor` writes here. Positioning only — the trigger stays
   * the portal origin, the branch of the layer and the element focus returns
   * to. Written by a directive, as `trigger` is, rather than bound in a
   * template.
   */
  readonly anchor = signal<PositionerAnchor | null>(null);
  /**
   * Where focus lands when the surface closes, for a trigger that is gone by
   * then or one that never held focus — a context menu's target. `null` means
   * the trigger.
   */
  readonly finalFocus = signal<HTMLElement | null>(null);
  /** Where focus lands when the surface opens. */
  readonly entry: { current: 'first' | 'last' | 'trigger' } = { current: 'first' };

  private view: EmbeddedViewRef<unknown> | null = null;
  private layerNode: HTMLElement | null = null;
  private surfaceNode: HTMLElement | null = null;
  private portalRoot: PortalRootHandle | null = null;
  private positioner: PositionerHandle | null = null;
  private layer: DismissableLayerHandle | null = null;
  private navigation: ArrowNavigationHandle | null = null;
  private presence: PresenceHandle | null = null;
  private typeaheadHandle: TypeaheadHandle | null = null;

  readonly name = computed(() => this.value() ?? this.contentId);
  readonly resolvedAlign = computed(
    () => this.align() ?? (this.parent === null ? this.defaults.align : 'start'),
  );
  readonly resolvedSide = computed(() => {
    if (this.side() !== undefined) return this.side() as MenuSide;
    if (this.parent !== null) return 'inline-end';
    if (this.onBar && this.bar?.orientation() === 'vertical') return 'inline-end';
    return this.defaults.side;
  });
  readonly resolvedSize = computed(
    () => this.size() ?? (this.onBar ? this.bar?.size() : undefined) ?? this.defaults.size,
  );
  /* A submenu hangs from an item, and an item's width is not a measure. */
  readonly resolvedWidth = computed<MenuWidth>(() =>
    this.parent === null ? (this.width() ?? this.defaults.width) : 'content',
  );
  readonly resolvedDisabled = computed(
    () =>
      (this.disabled() ?? this.defaults.disabled) ||
      (this.onBar && (this.bar?.disabled() ?? false)),
  );
  readonly resolvedLoop = computed(() => this.loop() ?? this.defaults.loop);
  readonly resolvedTypeahead = computed(() => this.typeahead() ?? this.defaults.typeahead);
  readonly resolvedOpenOnHover = computed(() => this.openOnHover() ?? this.defaults.openOnHover);
  readonly resolvedCloseOnSelect = computed(
    () => this.closeOnSelect() ?? this.defaults.closeOnSelect,
  );
  readonly resolvedSubmenuOpenDelay = computed(
    () => this.submenuOpenDelay() ?? this.defaults.submenuOpenDelay,
  );
  readonly resolvedSubmenuCloseDelay = computed(
    () => this.submenuCloseDelay() ?? this.defaults.submenuCloseDelay,
  );

  /**
   * A menu on a bar reads its own state from the bar, so the two models compose
   * rather than compete: the bar holds the identity of the open menu, and this
   * menu is open when that identity is its own.
   */
  readonly isOpen = computed(() => {
    const held = this.onBar ? this.bar?.value() === this.name() : this.open();
    return held && !this.resolvedDisabled();
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      const open = this.isOpen();
      untracked(() => (open ? this.show() : this.hide()));
    });

    /* A context menu opened again at a new point moves rather than closing and
       reopening: the anchor changed while the surface is open, so it is
       measured again. */
    effect(() => {
      this.anchor();
      untracked(() => {
        if (this.isOpen()) this.position();
      });
    });

    afterNextRender(() => {
      if (this.resolvedMount() === 'eager' && !this.isOpen()) this.build();
    });

    destroyRef.onDestroy(() => this.teardown());
  }

  /** The painted surface, once it exists. The grace area is measured off it. */
  surface(): HTMLElement | null {
    return this.surfaceNode;
  }

  /** Asks to open or close, and reports the reason before anything moves. */
  toggle(next: boolean, reason: MenuOpenReason, source?: Event) {
    if (next === this.isOpen()) return;

    let cancelled = false;
    const state = createControllable<boolean>({
      initial: this.isOpen(),
      onRequest: (request) => {
        this.openChangeRequest.emit(request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled) return;

    if (this.onBar && this.bar !== null) {
      if (next) this.bar.open(this.name(), reason, source);
      else this.bar.close(reason, source);
    } else if (moved) {
      this.open.set(next);
    }

    /* Focus goes back to whatever opened the surface, unless the reader pressed
       somewhere else — taking it back then would fight them. */
    if (!next && reason !== 'outsidePress' && reason !== 'programmatic') {
      (this.finalFocus() ?? this.trigger())?.focus({ preventScroll: true });
    }
  }

  /** Closes this surface and every surface above it. */
  closeAll(reason: MenuOpenReason, source?: Event) {
    this.toggle(false, reason, source);
    this.parent?.closeAll(reason, source);
    if (!this.onBar) this.bar?.close(reason, source);
  }

  /** Moves focus onto an item of this surface. */
  focusItem(index: number) {
    const list = this.items();
    const item = list[index < 0 ? list.length + index : index];
    if (item !== undefined) reveal(item);
  }

  items(): HTMLElement[] {
    return [...(this.surfaceNode?.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR) ?? [])];
  }

  readonly resolvedMount = computed(() => this.mount() ?? this.defaults.mount);

  private show() {
    this.build();
    this.position();
    this.bind();
    this.enter();
  }

  /**
   * The layer, built once. `active` drops it again when the menu closes,
   * `lazy` keeps it from the first open and `eager` builds it up front — the
   * same axis `tooltip`, `popover` and `collapsible` declare. A layer kept
   * while closed carries `inert`, so its items are in neither the tab order
   * nor the accessibility tree.
   */
  private build() {
    if (this.view !== null) {
      this.presence?.sync(this.isOpen());
      return;
    }

    this.portalRoot = createPortalRoot({
      origin: this.trigger(),
      disabled: this.portal() === false,
    });

    this.view = this.viewContainer.createEmbeddedView(this.template());
    this.view.detectChanges();

    this.layerNode = this.view.rootNodes.find(
      (node: unknown): node is HTMLElement => node instanceof HTMLElement,
    ) as HTMLElement | null;
    this.surfaceNode = this.layerNode?.querySelector<HTMLElement>("[data-part='content']") ?? null;
    if (this.layerNode === null || this.surfaceNode === null) return;

    this.portalRoot.container?.append(this.layerNode);

    this.presence = createPresence({ present: this.isOpen() });
    this.presence.setNode(this.layerNode);
  }

  private position() {
    if (this.layerNode === null) return;
    const trigger = this.trigger();
    const anchor = this.anchor() ?? trigger;
    if (anchor === null) return;

    /* A submenu is anchored to its item and placed from the parent's edge: the
       parent surface's inset is added along the side, and the submenu's own
       inset above its first item is taken off along the alignment, so the
       first item lines up with the item that opened it (M2). */
    const submenu =
      this.parent !== null && this.surfaceNode !== null && trigger !== null
        ? submenuOffsets({
            parentSurface: this.parent.surface(),
            item: trigger,
            surface: this.surfaceNode,
          })
        : { sideOffset: 0, alignOffset: 0 };

    this.positioner?.destroy();
    this.positioner = createPositioner(anchor, this.layerNode, {
      align: this.resolvedAlign(),
      alignOffset: (this.alignOffset() ?? this.defaults.alignOffset) + submenu.alignOffset,
      boundaryPadding: this.collisionPadding() ?? this.defaults.collisionPadding,
      flip: this.flip() ?? this.defaults.flip,
      hideWhenDetached: this.hideWhenDetached() ?? this.defaults.hideWhenDetached,
      shift: this.shift() ?? this.defaults.shift,
      side: this.resolvedSide(),
      sideOffset: (this.sideOffset() ?? this.defaults.sideOffset) + submenu.sideOffset,
      strategy: this.strategy() ?? this.defaults.strategy,
    });
    void this.positioner.update();
  }

  private bind() {
    if (this.layerNode === null || this.surfaceNode === null) return;

    const branches = [this.trigger(), this.parent?.surface() ?? null].filter(
      (branch): branch is HTMLElement => branch !== null,
    );

    this.layer = createDismissableLayer(this.layerNode, {
      branches,
      escape: this.closeOnEscape() ?? this.defaults.closeOnEscape,
      focusOutside: false,
      modal: false,
      outsidePress: this.closeOnOutsidePress() ?? this.defaults.closeOnOutsidePress,
      scrollLock: false,
      onDismiss: (request) => {
        const reason: MenuOpenReason = request.reason === 'escape' ? 'escape' : 'outsidePress';
        this.toggle(false, reason, request.source as Event | undefined);
        if (reason === 'outsidePress') this.parent?.closeAll(reason, request.source as Event);
      },
    });

    this.navigation = createArrowNavigation(this.surfaceNode, {
      focus: reveal,
      includeAriaDisabled: true,
      itemSelector: MENU_ITEM_SELECTOR,
      loop: () => this.resolvedLoop(),
      orientation: () => 'vertical',
    });

    if (this.resolvedTypeahead()) {
      this.typeaheadHandle = createTypeahead({
        timeout: this.typeaheadTimeout() ?? this.defaults.typeaheadTimeout,
      });
    }
  }

  /** Focus enters the surface as it opens, and the pattern says which item. */
  private enter() {
    const bar = this.onBar ? this.bar : null;
    const entry = bar === null ? this.entry.current : bar.entry.current;
    this.entry.current = 'first';
    if (bar !== null) bar.entry.current = 'first';
    if (entry === 'trigger') return;

    const list = this.items();
    const ordered = entry === 'first' ? list : [...list].reverse();
    const item = ordered.find(enabled) ?? ordered[0];
    if (item !== undefined) reveal(item);
  }

  private hide() {
    this.unbind();
    if (this.resolvedMount() === 'active') this.teardown();
  }

  /** The listeners a closed surface has no use for. */
  private unbind() {
    this.navigation?.destroy();
    this.layer?.destroy();
    this.positioner?.destroy();
    this.typeaheadHandle?.destroy();
    this.navigation = null;
    this.layer = null;
    this.positioner = null;
    this.typeaheadHandle = null;
  }

  private teardown() {
    this.navigation?.destroy();
    this.layer?.destroy();
    this.positioner?.destroy();
    this.presence?.destroy();
    this.typeaheadHandle?.destroy();
    this.portalRoot?.release();
    this.layerNode?.remove();
    this.view?.destroy();

    this.navigation = null;
    this.layer = null;
    this.positioner = null;
    this.presence = null;
    this.typeaheadHandle = null;
    this.portalRoot = null;
    this.layerNode = null;
    this.surfaceNode = null;
    this.view = null;
  }

  protected onKeyDown(event: KeyboardEvent) {
    const direction =
      this.surfaceNode !== null && getComputedStyle(this.surfaceNode).direction === 'rtl'
        ? 'rtl'
        : 'ltr';
    const inlineStart = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    const inlineEnd = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';

    if (event.key === 'Tab') {
      event.preventDefault();
      const root = this.rootTrigger();
      this.closeAll('dismiss', event);
      this.moveOut(root, event.shiftKey ? -1 : 1);
      return;
    }

    if (event.key === inlineStart) {
      if (this.parent !== null) {
        event.preventDefault();
        this.toggle(false, 'keyboard', event);
        return;
      }
      if (this.bar !== null) {
        event.preventDefault();
        this.bar.step(-1, { open: true });
        return;
      }
    }

    /* An item that opens a submenu answers the inline end itself and stops the
       key there, so reaching this point means the item has none. */
    if (event.key === inlineEnd && this.bar !== null) {
      event.preventDefault();
      this.closeAll('keyboard', event);
      this.bar.step(1, { open: true });
      return;
    }

    const handle = this.typeaheadHandle;
    if (handle === null) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (!isPrintable(event.key, handle.query.length > 0)) return;

    event.preventDefault();
    const list = this.items();
    const from = list.findIndex((item) => item === event.target);
    const index = handle.match(event.key, list.map(textOf), from);
    if (index !== -1) this.focusItem(index);
  }

  /** The control that opened the outermost surface of this stack. */
  private rootTrigger(): HTMLElement | null {
    return this.parent === null ? this.trigger() : this.parent.rootTriggerOf();
  }

  rootTriggerOf(): HTMLElement | null {
    return this.rootTrigger();
  }

  /**
   * Where `Tab` goes once every menu has closed: on down the page from the
   * control that opened the outermost surface. The pattern binds the key and
   * says no more, and a layer portalled to the end of the document has no next
   * element a reader would recognise.
   */
  private moveOut(trigger: HTMLElement | null, step: 1 | -1) {
    if (trigger === null) return;
    const order = tabbables(trigger.ownerDocument.body);
    const index = order.indexOf(trigger);
    if (index === -1) {
      trigger.focus({ preventScroll: true });
      return;
    }
    (order[index + step] ?? trigger).focus({ preventScroll: true });
  }
}
