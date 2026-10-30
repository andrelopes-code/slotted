import { writeSelectorKey } from '@slotted/core/selector-key';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import {
  navigationMenuMessages,
  type NavigationMenuMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import {
  createHoverIntent,
  focusTarget,
  measureViewport,
  motionBetween,
  writeGeometry,
} from '@slotted/core/navigation-menu';
import type { NavigationMenuMotion } from '@slotted/core/navigation-menu';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { injectMessages } from '@slotted/angular/i18n';
import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  Directive,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  InjectionToken,
  input,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
} from '@angular/core';

import { injectNavigationMenuDefaults } from './navigation-menu-defaults';
import type {
  NavigationMenuOrientation,
  NavigationMenuSize,
  NavigationMenuValueReason,
} from './navigation-menu-defaults';

export type {
  NavigationMenuColumns,
  NavigationMenuDefaults,
  NavigationMenuOrientation,
  NavigationMenuSize,
  NavigationMenuValueReason,
} from './navigation-menu-defaults';

function toggle(element: HTMLElement, name: string, on: boolean) {
  if (on) element.setAttribute(name, '');
  else element.removeAttribute(name);
}

/**
 * What a section is to the parts inside it: the item of this family, or the
 * item of another family that carries a section — `top-navigation`'s — which
 * provides the same token.
 */
export interface NavigationMenuSection {
  readonly contentId: string;
  value(): string;
  open(): boolean;
  disabled(): boolean;
  hasCurrent(): boolean;
  reportCurrent(link: object, current: boolean): void;
}

export const NAVIGATION_MENU_SECTION = new InjectionToken<NavigationMenuSection>(
  'slotted navigation-menu section',
);

/** Provided by a panel, so a root inside one knows it is a second level. */
export const NAVIGATION_MENU_PANEL = new InjectionToken<boolean>('slotted navigation-menu panel');

/** The gap the surface keeps from the window's edges when it is moved to fit. */
const GUTTER = 8;

const SECTION = ':scope > [data-part="list"] > [data-part="item"]';

function optionalBoolean(state: boolean | string | undefined) {
  return state === undefined ? undefined : booleanAttribute(state);
}

function optionalNumber(state: number | string | undefined) {
  return state === undefined ? undefined : numberAttribute(state);
}

export interface NavigationMenuCrossing {
  from: string | null;
  to: string | null;
  enter: NavigationMenuMotion | null;
  exit: NavigationMenuMotion | null;
}

/**
 * The sections of a site or an application, each a button that shows a panel
 * of links under the row — or beside the column — with direct links beside
 * them.
 *
 * The directive goes on the consumer's own element: `<nav slNavigationMenu>`
 * on its own, `<div slNavigationMenu>` inside another one's panel, where it is
 * a second level — vertical, with no surface of its own, switching inside the
 * outer panel. It is a directive rather than a component so that another
 * family can carry it on its own part — `top-navigation`'s nav does, as a host
 * directive — and it appends the one surface after the consumer's list
 * itself. The stylesheet comes with the list and the trigger, the two parts
 * every menu has.
 *
 * **One value.** `value` is the open section, two-way; every way it moves
 * asks through `valueChangeRequest` with its reason.
 *
 * **The panel stays in its item.** Each panel follows its trigger in the
 * DOM, which is the disclosure example's structure and what lets Tab reach
 * it. The root writes the open panel's measured size and place on itself
 * (`@slotted/core/navigation-menu`); the stylesheet lays the panel over the
 * surface and moves both on one interpolation.
 */
@Directive({
  selector: '[slNavigationMenu]',
  standalone: true,
  exportAs: 'slNavigationMenu',
  host: {
    'data-ui': 'navigation-menu',
    'data-ui-navigation-menu': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.data-nested]': "nested ? '' : null",
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.data-size]': 'resolvedSize()',
    '(focusout)': 'onFocusOut($event)',
    '(keydown)': 'onKeyDown($event)',
    '(pointerenter)': 'intent.stay()',
    '(pointerleave)': 'onPointerLeave($event)',
  },
})
export class SlNavigationMenu {
  /** The open section's value, or null. Two-way, so a template may bind it directly. */
  readonly value = model<string | null>(null);

  readonly size = input<NavigationMenuSize | undefined>(undefined);
  /** A row or a column. Unstated, a second level is a column and a first level a row. */
  readonly orientation = input<NavigationMenuOrientation | undefined>(undefined);
  /** Draws the mark on the surface's edge that points at the open trigger. */
  readonly arrow = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  /** Milliseconds a pointer rests on a trigger before its section opens. */
  readonly openDelay = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  /** Milliseconds a pointer leaving the root waits before the section closes. */
  readonly closeDelay = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  /** A link inside a panel closes the panel when it is followed. A link's own input wins. */
  readonly closeOnSelect = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  /** Words laid over the catalog of the language in force. A static `aria-label` still wins. */
  readonly messages = input<PartialMessages<NavigationMenuMessages> | undefined>(undefined);

  /** One output for one transition, carrying the reason and the event. */
  readonly valueChangeRequest = output<ChangeRequest<string | null>>();

  private readonly defaults = injectNavigationMenuDefaults();
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  readonly outer = inject(SlNavigationMenu, { optional: true, skipSelf: true });
  readonly nested =
    this.outer !== null && inject(NAVIGATION_MENU_PANEL, { optional: true }) === true;
  readonly host: HTMLElement = inject(ElementRef).nativeElement;

  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedOrientation = computed<NavigationMenuOrientation>(
    () => this.orientation() ?? (this.nested ? 'vertical' : 'horizontal'),
  );
  readonly resolvedArrow = computed(() => this.arrow() ?? this.defaults.arrow);
  readonly resolvedOpenDelay = computed(() => this.openDelay() ?? this.defaults.openDelay);
  readonly resolvedCloseDelay = computed(() => this.closeDelay() ?? this.defaults.closeDelay);
  readonly resolvedCloseOnSelect = computed(
    () => this.closeOnSelect() ?? this.defaults.closeOnSelect,
  );
  readonly t = injectMessages(navigationMenuMessages, this.messages);

  protected readonly ariaLabel = computed(() =>
    this.nested ? null : (this.writtenLabel ?? this.t('navigation')),
  );

  /** The crossing between the section that left and the one that arrived. */
  readonly motion = signal<NavigationMenuCrossing>({
    from: null,
    to: null,
    enter: null,
    exit: null,
  });
  readonly positioned = signal(false);
  /** Whether the open section stands in this root's list, where the surface can reach it. */
  readonly surfaced = signal(false);
  /** Each section's panel id, by value: a section another family moved out of the list keeps one. */
  private readonly panels = new Map<string, string>();
  private readonly tick = signal(0);
  private opened = false;

  /** The pointer: a delay to open, a switch without one, a delay to close. */
  protected readonly intent = createHoverIntent({
    openDelay: () => this.resolvedOpenDelay(),
    closeDelay: () => this.resolvedCloseDelay(),
    isOpen: () => this.value() !== null,
    open: (next) => this.request(next, 'pointer'),
    close: () => this.request(null, 'pointer'),
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => this.intent.destroy());

    let previous = this.value();
    effect(() => {
      const current = this.value();
      untracked(() => {
        if (current === previous) return;
        const order = [...this.host.querySelectorAll<HTMLElement>(SECTION)].map(
          (item) => item.getAttribute('data-value') ?? '',
        );
        this.motion.set({
          from: previous,
          to: current,
          ...motionBetween(order, previous, current),
        });
        previous = current;
      });
    });

    /* The surface, after the consumer's list. A second level has none. */
    if (!this.nested) {
      const document = this.host.ownerDocument;
      const viewport = document.createElement('div');
      writeSelectorKey(viewport, 'part', 'viewport');
      const arrow = document.createElement('span');
      writeSelectorKey(arrow, 'part', 'arrow');
      arrow.setAttribute('aria-hidden', 'true');
      afterNextRender(() => this.host.appendChild(viewport));
      effect(() => {
        toggle(viewport, 'data-open', this.value() !== null && this.surfaced());
        toggle(viewport, 'data-positioned', this.positioned());
        if (this.resolvedArrow()) viewport.appendChild(arrow);
        else arrow.remove();
      });
      destroyRef.onDestroy(() => viewport.remove());
    }

    afterRenderEffect(() => {
      this.value();
      this.tick();
      this.resolvedOrientation();
      untracked(() => this.measure());
    });

    /* Escape and a press outside the root close the open section. */
    effect((onCleanup) => {
      const open = this.value();
      if (open === null || this.nested) return;
      const away = untracked(() => this.openPanel());
      const layer = createDismissableLayer(this.host, {
        ...(away !== null && !this.host.contains(away) ? { branches: [away] } : {}),
        escape: true,
        focusOutside: false,
        modal: false,
        outsidePress: true,
        scrollLock: false,
        onDismiss: (dismissal) => {
          const reason: NavigationMenuValueReason =
            dismissal.reason === 'escape' ? 'escape' : 'outsidePress';
          const trigger = this.host.querySelector<HTMLElement>(
            `${SECTION}[data-value="${CSS.escape(open)}"] > [data-part="trigger"]`,
          );
          this.request(null, reason, dismissal.source);
          if (reason === 'escape') trigger?.focus();
        },
      });
      onCleanup(() => layer.destroy());
    });

    /* A panel that grows, a window that narrows, fonts that arrive: measure again. */
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => this.remeasure());
      observer.observe(this.host);
      for (const content of this.host.querySelectorAll(`${SECTION} > [data-part="content"]`)) {
        observer.observe(content);
      }
      const view = this.host.ownerDocument.defaultView;
      const onResize = () => this.remeasure();
      view?.addEventListener('resize', onResize);
      destroyRef.onDestroy(() => {
        observer.disconnect();
        view?.removeEventListener('resize', onResize);
      });
    });
  }

  /** A section says where its panel is, wherever another family moves it. */
  register(value: string, contentId: string): () => void {
    this.panels.set(value, contentId);
    return () => {
      if (this.panels.get(value) === contentId) this.panels.delete(value);
    };
  }

  /** The open section's panel, wherever it stands in the document. */
  openPanel(): HTMLElement | null {
    const open = this.value();
    const id = open === null ? undefined : this.panels.get(open);
    return id === undefined ? null : this.host.ownerDocument.getElementById(id);
  }

  /** Asks the open section to move. */
  request(next: string | null, reason: NavigationMenuValueReason, source?: Event) {
    const state = createControllable<string | null>({
      initial: this.value(),
      onRequest: (change) => this.valueChangeRequest.emit(change),
    });
    if (state.request(next, reason, source)) this.value.set(next);
  }

  /** A panel link was followed: every level closes, with the reason `select`. */
  select(source?: Event) {
    if (this.nested && this.outer !== null) this.outer.select(source);
    else this.request(null, 'select', source);
  }

  /** The pointer entered a trigger. */
  hover(value: string, pointerType: string) {
    this.intent.enter(value, pointerType);
  }

  /** Measures the open panel again on the next render. */
  remeasure() {
    this.tick.update((value) => value + 1);
  }

  /** Opens one section, with the reason `programmatic`. */
  open(value: string) {
    this.request(value, 'programmatic');
  }

  /** Closes the open section, with the reason `programmatic`. */
  close() {
    this.request(null, 'programmatic');
  }

  /** Focuses one section's trigger, or the first top-level control. */
  focus(value?: string) {
    const selector =
      value === undefined
        ? `${SECTION} > :is([data-part="trigger"], [data-part="link"])`
        : `${SECTION}[data-value="${CSS.escape(value)}"] > :is([data-part="trigger"], [data-part="link"])`;
    this.host.querySelector<HTMLElement>(selector)?.focus();
  }

  /** The surface, measured from the open panel and placed under (or beside) its trigger. */
  private measure() {
    const current = this.value();
    if (current === null) {
      this.opened = false;
      return;
    }
    const item = this.host.querySelector<HTMLElement>(
      `${SECTION}[data-value="${CSS.escape(current)}"]`,
    );
    const trigger = item?.querySelector<HTMLElement>(':scope > [data-part="trigger"]');
    const content = item?.querySelector<HTMLElement>(':scope > [data-part="content"]');
    /* A section moved out of the list — folded into another family's panel —
       opens where it stands, and the surface stays away. */
    this.surfaced.set(Boolean(trigger && content));
    if (!trigger || !content || content.hidden) {
      if (!trigger || !content) this.opened = false;
      return;
    }
    const geometry = measureViewport(
      this.host,
      trigger,
      content,
      this.resolvedOrientation(),
      GUTTER,
    );
    if (this.nested) {
      const list = this.host.querySelector<HTMLElement>(':scope > [data-part="list"]');
      geometry.blockSize = Math.max(geometry.blockSize, list?.offsetHeight ?? 0);
    }
    /* A first open writes its numbers while nothing transitions, then lets
       the stylesheet's transition back in for the next change of section. */
    const first = !this.opened;
    if (first) this.host.style.setProperty('transition', 'none');
    writeGeometry(this.host, geometry);
    if (first) {
      void this.host.offsetWidth;
      this.host.style.removeProperty('transition');
    }
    this.opened = true;
    this.positioned.set(true);
    if (this.nested) this.outer?.remeasure();
  }

  protected onPointerLeave(event: PointerEvent) {
    if (!this.nested && event.pointerType !== 'touch') this.intent.leave();
  }

  protected onFocusOut(event: FocusEvent) {
    if (this.nested) return;
    const next = event.relatedTarget as Node | null;
    if (next !== null && (this.host.contains(next) || this.openPanel()?.contains(next))) return;
    if (this.value() !== null) this.request(null, 'blur', event);
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    const target = event.target as HTMLElement;
    const level = target.closest('[data-ui="navigation-menu"]');
    const owner = target.closest('[data-part="content"]')?.closest('[data-ui="navigation-menu"]');
    if (level !== this.host && owner !== this.host) return;
    const next = focusTarget(this.host, target, event.key, {
      orientation: this.resolvedOrientation(),
      dir: getComputedStyle(this.host).direction === 'rtl' ? 'rtl' : 'ltr',
    });
    if (next === null) return;
    event.preventDefault();
    next.focus();
  }
}
