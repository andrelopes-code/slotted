import { writeSelectorKey } from '@slotted/core/selector-key';
import {
  provideTooltipDefaults,
  SlTooltip,
  SlTooltipContent,
  SlTooltipLayer,
} from '@slotted/angular/tooltip';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  forwardRef,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import type { Signal } from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  NAVIGATION_MENU_SECTION,
  SlNavigationMenu,
  SlNavigationMenuIdFactory,
  SlNavigationMenuTriggerWiring,
} from '@slotted/angular/navigation-menu';
import type { NavigationMenuSection } from '@slotted/angular/navigation-menu';

import { SlTopNavigation } from './top-navigation';
import type { TopNavigationPriority } from './top-navigation-defaults';

/** A click synthesised by the keyboard reports no detail; a real one reports the count. */
function activationReason(event: MouseEvent) {
  return event.detail === 0 ? ('keyboard' as const) : ('pointer' as const);
}

/**
 * What a part that moves into the panel needs: where it came from, so it can
 * go back when the panel has left. The move is the DOM's own `insertBefore`,
 * the way the CDK's `DomPortalOutlet` moves a template's nodes; the element
 * stays the same instance and every directive on it stays alive.
 */
class Home {
  private home: { parent: Node; next: Node | null } | null = null;

  constructor(private readonly native: HTMLElement) {}

  moveTo(parent: Node, before: Node | null) {
    if (this.home === null) {
      this.home = { parent: this.native.parentNode as Node, next: this.native.nextSibling };
    }
    if (this.native.parentNode === parent && this.native.nextSibling === before) return;
    parent.insertBefore(this.native, before);
  }

  moveBack() {
    if (this.home === null) return;
    const { parent, next } = this.home;
    this.home = null;
    /* On teardown the sibling may already be gone from the parent; the end of it is then the place. */
    parent.insertBefore(this.native, next !== null && next.parentNode === parent ? next : null);
  }
}

/* ── The hint on a control with no words ────────────────────────────────── */

/**
 * What every icon-only control shares: the tooltip that repeats its name.
 * `SlTooltip` is a host directive holding the state and the delays; the
 * control dispatches the pointer and the focus to it while a hint is due.
 */
@Directive()
abstract class TopNavigationControl {
  readonly navigation = inject(SlTopNavigation);
  protected readonly tooltip = inject(SlTooltip);
  protected readonly native: HTMLElement = inject(ElementRef).nativeElement;
  /** The name the consumer wrote, kept over the family's own. */
  protected readonly writtenLabel = inject(new HostAttributeToken('aria-label'), {
    optional: true,
  });

  /** The words the control is named by, and the tooltip repeats. */
  abstract readonly text: Signal<string>;
  /** Whether the hint is due at all: not while the words are visible. */
  readonly hint: Signal<boolean> = signal(true);

  constructor() {
    this.tooltip.triggerNode.set(this.native);
    inject(DestroyRef).onDestroy(() => this.tooltip.triggerNode.set(null));
  }

  protected readonly describedBy = computed(() =>
    this.hint() && this.tooltip.isOpen() ? this.tooltip.contentId : null,
  );

  protected onPointerEnter(event: PointerEvent) {
    if (!this.hint() || event.pointerType === 'touch') return;
    this.tooltip.openAfterDelay(event);
  }

  protected onPointerLeave(event: PointerEvent) {
    if (!this.hint()) return;
    this.tooltip.closeAfterDelay(event);
  }

  protected onPointerDown(event: PointerEvent) {
    if (!this.hint()) return;
    if (event.pointerType === 'touch') this.tooltip.pressAndHold(event);
    else if (this.tooltip.isOpen()) this.tooltip.toggle(false, 'pointer', event);
  }

  protected onPointerUp() {
    this.tooltip.cancelPending();
  }

  protected onFocus(event: FocusEvent) {
    if (!this.hint() || !this.native.matches(':focus-visible')) return;
    this.tooltip.toggle(true, 'keyboard', event);
  }

  protected onBlur(event: FocusEvent) {
    if (this.tooltip.isOpen()) this.tooltip.toggle(false, 'blur', event);
  }
}

const HINT_TEMPLATE = `<ng-content />
@if (hint()) {
  <ng-template slTooltipLayer>
    <div slTooltipContent>{{ text() }}</div>
  </ng-template>
}`;

/**
 * The same, with the family's own mark before the content: a Glyph element in
 * an icon box, which the control sizes. None of these marks points along the
 * reading direction, so none of them is `directional`.
 */
function markedHintTemplate(glyph: string) {
  return `<span slIcon><svg slGlyph name="${glyph}"></svg></span>${HINT_TEMPLATE}`;
}

const HINT_HOST = {
  '[attr.aria-describedby]': 'describedBy()',
  '(pointerenter)': 'onPointerEnter($event)',
  '(pointerleave)': 'onPointerLeave($event)',
  '(pointerdown)': 'onPointerDown($event)',
  '(pointerup)': 'onPointerUp()',
  '(pointercancel)': 'onPointerUp()',
  '(focus)': 'onFocus($event)',
  '(blur)': 'onBlur($event)',
};

const HINT_PROVIDERS = [provideTooltipDefaults({ openOn: 'hover', side: 'bottom' })];

/* ── Brand ──────────────────────────────────────────────────────────────── */

/** The start cluster: the shell's toggle when there is one, then the mark and the name. */
@Directive({
  selector: '[slTopNavigationBrand]',
  standalone: true,
  host: { 'data-part': 'brand', 'data-part-brand': '' },
})
export class SlTopNavigationBrand {}

/**
 * The mark and the name, linked to the start of the application on an `a`,
 * or only the mark on a `span`. Below the high step the name leaves the eye
 * and the element keeps its accessible name, because the name is still in it.
 */
@Directive({
  selector: '[slTopNavigationHome]',
  standalone: true,
  host: { 'data-part': 'home', 'data-part-home': '' },
})
export class SlTopNavigationHome {}

/** The box the logo stands in: square, the height of the bar's controls. */
@Directive({
  selector: '[slTopNavigationMark]',
  standalone: true,
  host: { 'data-part': 'mark', 'data-part-mark': '', 'aria-hidden': 'true' },
})
export class SlTopNavigationMark {}

/** The product's name, one line. */
@Directive({
  selector: '[slTopNavigationName]',
  standalone: true,
  host: { 'data-part': 'name', 'data-part-name': '' },
})
export class SlTopNavigationName {}

/* ── Context ────────────────────────────────────────────────────────────── */

/**
 * What the application is at this moment, as the consumer's own content.
 * Below the medium step it is moved to the top of the panel while the panel
 * is present, and back to its place when the panel has left.
 */
@Directive({
  selector: '[slTopNavigationContext]',
  standalone: true,
  host: { 'data-part': 'context', 'data-part-context': '' },
})
export class SlTopNavigationContext {
  private readonly navigation = inject(SlTopNavigation);
  private readonly home = new Home(inject(ElementRef).nativeElement);

  constructor() {
    this.navigation.hasContext.set(true);
    effect(() => {
      const panel = this.navigation.panelNode();
      if (this.navigation.narrow() && this.navigation.panelPresent() && panel !== null) {
        this.home.moveTo(panel, panel.firstChild);
      } else {
        this.home.moveBack();
      }
    });
    inject(DestroyRef).onDestroy(() => {
      this.navigation.hasContext.set(false);
      this.home.moveBack();
    });
  }
}

/* ── Navigation ─────────────────────────────────────────────────────────── */

/**
 * The navigation landmark. It builds the panel right after itself in DOM
 * order — so Tab from `more`, the last control in the list, lands in the
 * panel, the way the disclosure pattern assumes — and hands the panel and
 * its list to the root, which the folded parts move into. The panel stays in
 * the DOM closed, out of sight and out of the tab order by the stylesheet's
 * `visibility`.
 */
@Directive({
  selector: 'nav[slTopNavigationNav]',
  standalone: true,
  exportAs: 'slTopNavigationNav',
  /**
   * The nav is also a `navigation-menu` root: the open section, its request
   * and the menu's own delays are bound here, on the element that holds the
   * sections. Its `data-part` and its name are the bar's, written after the
   * menu's by the host's own bindings.
   */
  hostDirectives: [
    {
      directive: SlNavigationMenu,
      inputs: ['value', 'arrow', 'openDelay', 'closeDelay', 'closeOnSelect'],
      outputs: ['valueChange', 'valueChangeRequest'],
    },
  ],
  host: {
    'data-part': 'nav',
    'data-part-nav': '',
    /* The menu's root key goes with the menu's part. */
    '[attr.data-part-root]': 'null',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class SlTopNavigationNav {
  private readonly navigation = inject(SlTopNavigation);
  private readonly menu = inject(SlNavigationMenu);
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), { optional: true });

  protected readonly ariaLabel = computed(
    () => this.writtenLabel ?? this.navigation.t('navigation'),
  );

  constructor() {
    const document = this.native.ownerDocument;
    const panel = document.createElement('div');
    writeSelectorKey(panel, 'part', 'panel');
    panel.id = this.navigation.ids.panelId;
    const list = document.createElement('ul');
    writeSelectorKey(list, 'part', 'panel-list');
    panel.appendChild(list);

    afterNextRender(() => {
      this.native.insertAdjacentElement('afterend', panel);
      this.navigation.panelNode.set(panel);
      this.navigation.panelListNode.set(list);
    });

    effect(() => {
      if (this.navigation.moreOpen()) panel.setAttribute('data-open', '');
      else panel.removeAttribute('data-open');
    });

    /* A destination followed inside the overflow panel closes the panel too. */
    const followed = this.menu.valueChangeRequest.subscribe((request) => {
      if (request.reason === 'select' && !request.cancelled && this.navigation.moreOpen()) {
        this.navigation.setMoreOpen(false, 'select', request.source as Event | undefined);
      }
    });
    inject(DestroyRef).onDestroy(() => followed.unsubscribe());

    inject(DestroyRef).onDestroy(() => {
      if (this.navigation.panelNode() === panel) {
        this.navigation.panelNode.set(null);
        this.navigation.panelListNode.set(null);
      }
      panel.remove();
    });
  }
}

/**
 * The disclosure button of the panel: `data-overflow` holds the count of
 * what folded, and the stylesheet shows the button by it — and by the
 * container queries before the count exists. It carries `data-current` while
 * the current destination is folded, the way a closed parent does.
 */
@Component({
  selector: 'button[slTopNavigationMore]',
  standalone: true,
  exportAs: 'slTopNavigationMore',
  imports: [SlGlyph, SlIcon, SlTooltipLayer, SlTooltipContent],
  template: markedHintTemplate('ellipsis'),
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [SlTooltip],
  providers: HINT_PROVIDERS,
  host: {
    ...HINT_HOST,
    'data-part': 'more',
    'data-part-more': '',
    type: 'button',
    '[attr.id]': 'navigation.ids.moreId',
    '[attr.aria-controls]': 'navigation.ids.panelId',
    '[attr.aria-expanded]': 'navigation.moreOpen()',
    '[attr.aria-label]': 'text()',
    '[attr.data-overflow]': 'navigation.panelHolds() ? navigation.collapsed().length : null',
    '[attr.data-current]': "navigation.currentFolded() ? '' : null",
    '[attr.data-open]': "navigation.moreOpen() ? '' : null",
    '(click)': 'onClick($event)',
  },
})
export class SlTopNavigationMore extends TopNavigationControl {
  readonly text = computed(() => {
    const folded = this.navigation.collapsed().length;
    return folded > 0
      ? this.navigation.t('moreCount', { count: folded })
      : this.navigation.t('more');
  });

  constructor() {
    super();
    this.navigation.moreNode.set(this.native);
    inject(DestroyRef).onDestroy(() => this.navigation.moreNode.set(null));
  }

  protected onClick(event: Event) {
    if (event.defaultPrevented) return;
    this.navigation.setMoreOpen(
      !this.navigation.moreOpen(),
      activationReason(event as MouseEvent),
      event,
    );
  }
}

/** The destinations, and `more` at their end. */
@Component({
  selector: 'ul[slTopNavigationList]',
  standalone: true,
  exportAs: 'slTopNavigationList',
  imports: [SlTopNavigationMore],
  template: `<ng-content />
    <li data-part="item" data-part-item="">
      <button slTopNavigationMore type="button"></button>
    </li>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'list', 'data-part-list': '' },
})
export class SlTopNavigationList {}

/* ── The item ───────────────────────────────────────────────────────────── */

/**
 * One destination or one section. It says what it is to the root — its
 * value, its priority, whether it is current — and, while the width has
 * folded it and the panel is present, moves itself into the panel's list in
 * the list's own order: the same `li`, with whatever the consumer put in it.
 */
@Directive({
  selector: 'li[slTopNavigationItem]',
  standalone: true,
  exportAs: 'slTopNavigationItem',
  /** A section of the bar is a section of the navigation menu the nav is. */
  providers: [
    { provide: NAVIGATION_MENU_SECTION, useExisting: forwardRef(() => SlTopNavigationItem) },
  ],
  host: {
    'data-part': 'item',
    'data-part-item': '',
    '[attr.data-open]': "open() ? '' : null",
    '[attr.data-value]': 'value()',
    '[attr.data-priority]': 'resolvedPriority()',
    '[attr.data-collapsed]': "collapsed() ? '' : null",
    '[attr.data-current]': "current() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() ? '' : null",
  },
})
export class SlTopNavigationItem implements NavigationMenuSection {
  /** The item's identity: what `value` names it by. */
  readonly value = input.required<string>();
  /** Which step of the width folds this item. Unstated, `medium`. */
  readonly priority = input<TopNavigationPriority | undefined>(undefined);
  /** The row and everything in it refuse interaction. */
  readonly disabled = input<boolean, boolean | string>(false, { transform: booleanAttribute });

  readonly navigation = inject(SlTopNavigation);
  readonly native: HTMLElement = inject(ElementRef).nativeElement;
  private readonly home = new Home(this.native);

  /** Whether the link stated it is current, which wins over the root's value. */
  readonly explicitCurrent = signal(false);

  readonly resolvedPriority = computed(() => this.priority() ?? 'medium');
  readonly resolvedDisabled = computed(() => this.disabled());
  readonly collapsed = computed(() => this.navigation.folded().has(this.resolvedPriority()));
  readonly current = computed(
    () => this.explicitCurrent() || this.navigation.value() === this.value(),
  );

  /* ── As a section of the navigation menu ─────────────────────────────── */

  private readonly menu = inject(SlNavigationMenu);
  readonly contentId = `${inject(SlNavigationMenuIdFactory).next()}-content`;
  readonly open = computed(() => this.menu.value() === this.value());
  private readonly currents = signal<ReadonlySet<object>>(new Set());
  readonly hasCurrent = computed(() => this.currents().size > 0);

  reportCurrent(link: object, current: boolean) {
    this.currents.update((set) => {
      if (set.has(link) === current) return set;
      const next = new Set(set);
      if (current) next.add(link);
      else next.delete(link);
      return next;
    });
  }

  constructor() {
    let section: (() => void) | null = null;
    effect(() => {
      section?.();
      section = this.menu.register(this.value(), this.contentId);
    });
    inject(DestroyRef).onDestroy(() => section?.());

    let release: (() => void) | null = null;
    effect(() => {
      release?.();
      release = this.navigation.registerItem(
        this.value(),
        this.resolvedPriority(),
        this.explicitCurrent(),
      );
    });

    effect(() => {
      const list = this.navigation.panelListNode();
      if (this.collapsed() && this.navigation.panelPresent() && list !== null) {
        const mine = untracked(() => this.navigation.orderOf(this.value()));
        const after = [...list.children].find(
          (sibling) =>
            untracked(() => this.navigation.orderOf(sibling.getAttribute('data-value') ?? '')) >
            mine,
        );
        this.home.moveTo(list, after ?? null);
      } else {
        this.home.moveBack();
      }
    });

    inject(DestroyRef).onDestroy(() => {
      release?.();
      this.home.moveBack();
    });
  }
}

/**
 * The destination. `current` stated on the row wins over the root's `value`;
 * unstated, an `aria-current` the router wrote on the element is read
 * instead. Pressed inside the panel, it asks the panel to close with `select`.
 */
@Directive({
  selector: 'a[slTopNavigationLink]',
  standalone: true,
  exportAs: 'slTopNavigationLink',
  host: {
    'data-part': 'link',
    'data-part-link': '',
    '[attr.aria-current]': "resolvedCurrent() ? 'page' : null",
    '[attr.aria-disabled]': "item.resolvedDisabled() ? 'true' : null",
    '[attr.data-current]': "resolvedCurrent() ? '' : null",
    '(click)': 'onClick($event)',
  },
})
export class SlTopNavigationLink {
  /** Whether this is the current destination, stated on the row itself. */
  readonly current = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });

  readonly item = inject(SlTopNavigationItem);
  private readonly navigation = inject(SlTopNavigation);
  private readonly writtenCurrent = inject(new HostAttributeToken('aria-current'), {
    optional: true,
  });

  readonly resolvedCurrent = computed(() => {
    const stated = this.current();
    if (stated !== undefined) return stated;
    if (this.writtenCurrent !== null) return this.writtenCurrent !== 'false';
    return this.item.current();
  });

  constructor() {
    effect(() => {
      const stated = this.current();
      const written = this.writtenCurrent !== null && this.writtenCurrent !== 'false';
      this.item.explicitCurrent.set(stated ?? written);
    });
    inject(DestroyRef).onDestroy(() => this.item.explicitCurrent.set(false));
  }

  protected onClick(event: Event) {
    if (this.item.resolvedDisabled()) {
      event.preventDefault();
      return;
    }
    if (event.defaultPrevented) return;
    const reason = activationReason(event as MouseEvent);
    this.navigation.select(this.item.value(), reason, event);
    if (this.navigation.moreOpen() && this.item.collapsed()) {
      this.navigation.setMoreOpen(false, 'select', event);
    }
  }
}

/**
 * A section that opens: the `navigation-menu` trigger of the panel that
 * follows it in the same item — `aria-expanded`, `aria-controls`, the
 * chevron, a press and a resting pointer — in the bar's row.
 */
@Component({
  selector: 'button[slTopNavigationTrigger]',
  standalone: true,
  exportAs: 'slTopNavigationTrigger',
  imports: [SlGlyph, SlIcon],
  template: `<ng-content /><span data-part="indicator" data-part-indicator="" aria-hidden="true"
      ><span slIcon><svg slGlyph name="chevron-down"></svg></span
    ></span>`,
  styleUrl: '../../../styles/src/navigation-menu/navigation-menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [SlNavigationMenuTriggerWiring],
})
export class SlTopNavigationTrigger {}

/* ── Search ─────────────────────────────────────────────────────────────── */

/** The button that closes the search where it has taken the bar. */
@Component({
  selector: 'button[slTopNavigationSearchClose]',
  standalone: true,
  imports: [SlGlyph, SlIcon, SlTooltipLayer, SlTooltipContent],
  template: markedHintTemplate('x'),
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [SlTooltip],
  providers: HINT_PROVIDERS,
  host: {
    ...HINT_HOST,
    'data-part': 'search-close',
    'data-part-search-close': '',
    type: 'button',
    '[attr.aria-label]': 'text()',
    '(click)': 'onClick($event)',
  },
})
export class SlTopNavigationSearchClose extends TopNavigationControl {
  readonly text = computed(() => this.navigation.t('closeSearch'));

  protected onClick(event: Event) {
    if (event.defaultPrevented) return;
    this.navigation.setSearchOpen(false, activationReason(event as MouseEvent), event);
  }
}

/** The button that opens the search where the width has folded the field. */
@Component({
  selector: 'button[slTopNavigationSearchToggle]',
  standalone: true,
  imports: [SlGlyph, SlIcon, SlTooltipLayer, SlTooltipContent],
  template: markedHintTemplate('search'),
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [SlTooltip],
  providers: HINT_PROVIDERS,
  host: {
    ...HINT_HOST,
    'data-part': 'search-toggle',
    'data-part-search-toggle': '',
    type: 'button',
    '[attr.aria-label]': 'text()',
    '(click)': 'onClick($event)',
  },
})
export class SlTopNavigationSearchToggle extends TopNavigationControl {
  readonly text = computed(() => this.navigation.t('search'));

  constructor() {
    super();
    this.navigation.searchToggleNode.set(this.native);
    inject(DestroyRef).onDestroy(() => this.navigation.searchToggleNode.set(null));
  }

  protected onClick(event: Event) {
    if (event.defaultPrevented) return;
    this.navigation.setSearchOpen(true, activationReason(event as MouseEvent), event);
  }
}

/**
 * The search region, with the consumer's field inside and the close at its
 * end. Below the medium step the region exists only while `searchOpen`, and
 * takes the whole bar: opening moves focus into the field, and Escape, focus
 * leaving the region, or the close hand the bar back and return focus to the
 * toggle.
 */
@Component({
  selector: '[slTopNavigationSearch]',
  standalone: true,
  exportAs: 'slTopNavigationSearch',
  imports: [SlTopNavigationSearchClose],
  template: `<ng-content /><button slTopNavigationSearchClose type="button"></button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'search',
    'data-part-search': '',
    '(keydown)': 'onKeyDown($event)',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class SlTopNavigationSearch {
  private readonly navigation = inject(SlTopNavigation);
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;

  /** Whether the region has taken the bar. */
  readonly active = computed(() => this.navigation.searchTakesBar());

  constructor() {
    this.navigation.hasSearch.set(true);
    this.navigation.searchNode.set(this.native);

    /* The field takes focus the moment it takes the bar; the toggle takes it back when the bar returns. */
    let wasActive = this.active();
    effect(() => {
      const active = this.active();
      const before = wasActive;
      wasActive = active;
      if (active) {
        this.native.querySelector<HTMLElement>('input, [contenteditable]')?.focus();
        return;
      }
      if (!before) return;
      const focused = this.native.ownerDocument.activeElement;
      if (
        focused === null ||
        focused === this.native.ownerDocument.body ||
        this.native.contains(focused)
      ) {
        untracked(() => this.navigation.searchToggleNode())?.focus();
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this.navigation.hasSearch.set(false);
      if (this.navigation.searchNode() === this.native) this.navigation.searchNode.set(null);
    });
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || !this.active() || event.key !== 'Escape') return;
    event.preventDefault();
    this.navigation.setSearchOpen(false, 'escape', event);
  }

  protected onFocusOut(event: FocusEvent) {
    if (event.defaultPrevented || !this.active()) return;
    const next = event.relatedTarget as Node | null;
    if (next === null || this.native.contains(next)) return;
    this.navigation.setSearchOpen(false, 'blur', event);
  }
}

/* ── Actions ────────────────────────────────────────────────────────────── */

/** The end cluster. The search toggle stands first in it whenever the bar has a search. */
@Component({
  selector: '[slTopNavigationActions]',
  standalone: true,
  exportAs: 'slTopNavigationActions',
  imports: [SlTopNavigationSearchToggle],
  template: `@if (navigation.hasSearch()) {
      <button slTopNavigationSearchToggle type="button"></button>
    }
    <ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'actions', 'data-part-actions': '' },
})
export class SlTopNavigationActions {
  protected readonly navigation = inject(SlTopNavigation);
}

/**
 * Help: a destination on an `a`, a trigger on a `button` the consumer puts
 * `slMenuTriggerFor` or a popover trigger on. Its projected content is its
 * label — the family's message when there is none — clipped from the eye in
 * the bar and shown as a row's words in the panel below the high step, where
 * it is moved while the panel is present.
 */
@Component({
  selector: 'a[slTopNavigationHelp], button[slTopNavigationHelp]',
  standalone: true,
  exportAs: 'slTopNavigationHelp',
  imports: [SlGlyph, SlIcon, SlTooltipLayer, SlTooltipContent],
  template: `<span slIcon><svg slGlyph name="circle-question"></svg></span
    ><ng-content>{{ fallback() }}</ng-content>
    @if (hint()) {
      <ng-template slTooltipLayer>
        <div slTooltipContent>{{ text() }}</div>
      </ng-template>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [SlTooltip],
  providers: HINT_PROVIDERS,
  host: {
    ...HINT_HOST,
    'data-part': 'help',
    'data-part-help': '',
  },
})
export class SlTopNavigationHelp extends TopNavigationControl {
  private readonly home = new Home(this.native);
  readonly text = computed(() => this.writtenLabel ?? this.navigation.t('help'));
  /** The words shown when the consumer projected none. */
  protected readonly fallback = computed(() =>
    this.writtenLabel === null ? this.navigation.t('help') : '',
  );
  readonly inPanel = computed(
    () =>
      this.navigation.narrowest() &&
      this.navigation.panelPresent() &&
      this.navigation.panelNode() !== null,
  );
  override readonly hint = computed(() => !this.inPanel());

  constructor() {
    super();
    this.navigation.hasHelp.set(true);
    afterNextRender(() => writeSelectorKey(this.native, 'part', 'help'));
    effect(() => {
      const panel = this.navigation.panelNode();
      if (this.inPanel() && panel !== null) this.home.moveTo(panel, null);
      else this.home.moveBack();
    });
    inject(DestroyRef).onDestroy(() => {
      this.navigation.hasHelp.set(false);
      this.home.moveBack();
    });
  }
}

/** Notifications: the bell, with the count in its corner. It never folds. */
@Component({
  selector: 'button[slTopNavigationNotifications]',
  standalone: true,
  exportAs: 'slTopNavigationNotifications',
  imports: [SlGlyph, SlIcon, SlTooltipLayer, SlTooltipContent],
  template: markedHintTemplate('bell'),
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [SlTooltip],
  providers: HINT_PROVIDERS,
  host: {
    ...HINT_HOST,
    'data-part': 'notifications',
    'data-part-notifications': '',
    type: 'button',
    '[attr.aria-label]': 'text()',
  },
})
export class SlTopNavigationNotifications extends TopNavigationControl {
  readonly text = computed(() => this.writtenLabel ?? this.navigation.t('notifications'));

  constructor() {
    super();
    afterNextRender(() => writeSelectorKey(this.native, 'part', 'notifications'));
  }
}

/**
 * A global control of the product's own — approvals, tasks — in the family's
 * square, with the family's ink, ground and hint. A destination on an `a`, a
 * trigger on a `button`. The consumer projects its own glyph and names the
 * control: `label` when the words change with a count, `aria-label` when
 * they do not. `slTopNavigationCount` inside it stands over its corner the
 * way it stands over the bell.
 */
@Component({
  selector: 'a[slTopNavigationAction], button[slTopNavigationAction]',
  standalone: true,
  exportAs: 'slTopNavigationAction',
  imports: [SlTooltipLayer, SlTooltipContent],
  template: HINT_TEMPLATE,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [SlTooltip],
  providers: HINT_PROVIDERS,
  host: {
    ...HINT_HOST,
    'data-part': 'action',
    'data-part-action': '',
    '[attr.type]': 'type',
    '[attr.aria-label]': 'text() || null',
  },
})
export class SlTopNavigationAction extends TopNavigationControl {
  /** The words the control is named by; over `aria-label`, which is read once. */
  readonly label = input<string | undefined>(undefined);
  protected readonly type = this.native.tagName === 'BUTTON' ? 'button' : null;
  readonly text = computed(() => this.label() ?? this.writtenLabel ?? '');
  /** No words, no hint: a control with no name has nothing to repeat. */
  override readonly hint = computed(() => this.text() !== '');

  constructor() {
    super();
    afterNextRender(() => writeSelectorKey(this.native, 'part', 'action'));
  }
}

/** The number of what is waiting, inside the bell's button and so inside its name. */
@Directive({
  selector: '[slTopNavigationCount]',
  standalone: true,
  host: { 'data-part': 'count', 'data-part-count': '' },
})
export class SlTopNavigationCount {}

/** The account: the consumer's avatar and, when there is room, the name. It never folds. */
@Component({
  selector: 'button[slTopNavigationAccount]',
  standalone: true,
  exportAs: 'slTopNavigationAccount',
  imports: [SlTooltipLayer, SlTooltipContent],
  template: HINT_TEMPLATE,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [SlTooltip],
  providers: HINT_PROVIDERS,
  host: {
    ...HINT_HOST,
    'data-part': 'account',
    'data-part-account': '',
    type: 'button',
    '[attr.aria-label]': 'text()',
  },
})
export class SlTopNavigationAccount extends TopNavigationControl {
  readonly text = computed(() => this.writtenLabel ?? this.navigation.t('account'));

  constructor() {
    super();
    afterNextRender(() => writeSelectorKey(this.native, 'part', 'account'));
  }
}
