import { writeSelectorKey } from '@slotted/core/selector-key';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import type { DismissableLayerHandle } from '@slotted/core/dismissable-layer';
import { createPortalRoot } from '@slotted/core/portal';
import type { PortalRootHandle } from '@slotted/core/portal';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceStatus } from '@slotted/core/presence';
import { truncateMiddle } from '@slotted/core/text';
import { SlSkeleton } from '@slotted/angular/skeleton';
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
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { Signal } from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { SlSideNavigation } from './side-navigation';
import { SlSideNavigationIdFactory } from './side-navigation-defaults';
import type { SideNavigationFlyoutReason } from './side-navigation-defaults';

/** A click synthesised by the keyboard reports no detail; a real one reports the count. */
function activationReason(event: MouseEvent) {
  return event.detail === 0 ? ('keyboard' as const) : ('pointer' as const);
}

/* ── Section, its title, and a list ─────────────────────────────────────── */

/** A titled run of destinations. Several may stand under one root. */
@Directive({
  selector: '[slSideNavigationSection]',
  standalone: true,
  host: { 'data-part': 'section', 'data-part-section': '' },
})
export class SlSideNavigationSection {}

/** The section's title. In compact mode it becomes a rule. */
@Directive({
  selector: '[slSideNavigationSectionLabel]',
  standalone: true,
  host: { 'data-part': 'section-label', 'data-part-section-label': '' },
})
export class SlSideNavigationSectionLabel {}

/** The items of one level: the top level, or a section's. */
@Directive({
  selector: 'ul[slSideNavigationList]',
  standalone: true,
  host: { 'data-part': 'list', 'data-part-list': '' },
})
export class SlSideNavigationList {}

/* ── The item ───────────────────────────────────────────────────────────── */

/**
 * A row: a link, a trigger, or both, with optional actions and a group.
 *
 * It carries the states the stylesheet reads. `data-current` is on it while
 * its own link is the destination, and while a descendant is and the group is
 * closed or the column is a rail — the reader sees where they are when the
 * destination itself is out of sight.
 */
@Directive({
  selector: 'li[slSideNavigationItem]',
  standalone: true,
  exportAs: 'slSideNavigationItem',
  host: {
    'data-part': 'item',
    'data-part-item': '',
    '[attr.data-value]': 'value()',
    '[attr.data-current]': "marked() ? '' : null",
    '[attr.data-expanded]': "expanded() ? '' : null",
    '[attr.data-open]': "flyoutOpen() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() ? '' : null",
  },
})
export class SlSideNavigationItem {
  /** The item's identity: what `value`, `expanded` and `flyout` name it by. */
  readonly value = input.required<string>();
  /** The row and everything in it refuse interaction. */
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly navigation = inject(SlSideNavigation);
  /** The item above, or nothing at the top level. */
  readonly parent = inject(SlSideNavigationItem, { optional: true, skipSelf: true });
  private readonly generated = inject(SlSideNavigationIdFactory).next();

  readonly ids = {
    groupId: `${this.generated}-group`,
    labelId: `${this.generated}-label`,
    triggerId: `${this.generated}-trigger`,
  };

  readonly hasLink = signal(false);
  readonly hasGroup = signal(false);
  /** Whether the label was measured as clipped, which is what opens the tooltip. */
  readonly clipped = signal(false);
  /** The label's whole text, for the tooltip and for `aria-label` under a middle cut. */
  readonly labelText = signal('');
  readonly descriptionText = signal('');
  readonly triggerNode = signal<HTMLElement | null>(null);
  private readonly descendants = signal<readonly string[]>([]);

  readonly expanded = computed(() => this.navigation.isExpanded(this.value()));
  readonly flyoutOpen = computed(
    () => this.navigation.compact() && this.navigation.flyout() === this.value(),
  );
  /** Whether the current destination is this item's own link. */
  readonly current = computed(() => this.hasLink() && this.navigation.value() === this.value());
  /** Whether the current destination is somewhere under this item. */
  readonly holdsCurrent = computed(() => this.descendants().length > 0);
  readonly resolvedDisabled: Signal<boolean> = computed(
    () => this.disabled() || (this.parent?.resolvedDisabled() ?? false),
  );
  protected readonly marked = computed(
    () =>
      this.current() || (this.holdsCurrent() && (!this.expanded() || this.navigation.compact())),
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    let release: (() => void) | null = null;
    effect(() => {
      release?.();
      release = this.navigation.registerItem(this.value(), this.parent?.value() ?? null);
    });
    destroyRef.onDestroy(() => release?.());

    /* Where the reader is, said upward: own link, or anything under it. */
    const parent = this.parent;
    if (parent !== null) {
      effect(() => parent.reportCurrent(this.value(), this.current() || this.holdsCurrent()));
      destroyRef.onDestroy(() => parent.reportCurrent(this.value(), false));
    }
  }

  /** A descendant says whether it holds the current destination. */
  reportCurrent(descendant: string, isCurrent: boolean) {
    this.descendants.update((known) => {
      const has = known.includes(descendant);
      if (isCurrent === has) return known;
      return isCurrent ? [...known, descendant] : known.filter((item) => item !== descendant);
    });
  }
}

/* ── The row's hint ─────────────────────────────────────────────────────── */

/**
 * What a link and a trigger share: the tooltip a row opens when it cannot
 * show its own words. `SlTooltip` is a host directive holding the state and
 * the delays; the row dispatches the pointer and the focus to it only while a
 * hint is due, because the family — not the consumer's template — decides
 * when a row is a trigger. The layer is stamped under `@if`, so an idle row
 * mounts nothing.
 */
@Directive()
abstract class SideNavigationRow {
  readonly item = inject(SlSideNavigationItem);
  readonly navigation = inject(SlSideNavigation);
  protected readonly tooltip = inject(SlTooltip);
  protected readonly native: HTMLElement = inject(ElementRef).nativeElement;

  abstract readonly hint: () => boolean;

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
    <div slTooltipContent>
      {{ item.labelText() }}
      @if (item.descriptionText()) {
        <br />
        {{ item.descriptionText() }}
      }
    </div>
  </ng-template>
}`;

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

/* ── The link ───────────────────────────────────────────────────────────── */

/**
 * The destination, or a command. On an `a` with an `href` it is a destination
 * and takes `aria-current`; on a `button` it is a command in the column with
 * the same row. `routerLink` and `routerLinkActive` live on the same element,
 * and an `aria-current` the router wrote is read and kept.
 */
@Component({
  selector: 'a[slSideNavigationLink], button[slSideNavigationLink]',
  standalone: true,
  exportAs: 'slSideNavigationLink',
  imports: [SlTooltipLayer, SlTooltipContent],
  template: HINT_TEMPLATE,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [SlTooltip],
  providers: [
    provideTooltipDefaults({ describes: 'description', openOn: 'hover', side: 'inline-end' }),
  ],
  host: {
    ...HINT_HOST,
    'data-part': 'link',
    'data-part-link': '',
    '[attr.aria-current]': "resolvedCurrent() ? 'page' : null",
    '[attr.aria-disabled]': "item.resolvedDisabled() ? 'true' : null",
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.data-current]': "resolvedCurrent() ? '' : null",
    '(click)': 'onClick($event)',
  },
})
export class SlSideNavigationLink extends SideNavigationRow {
  /**
   * Whether this is the current destination, stated on the row itself. It
   * wins over the root's `value`; unstated, an `aria-current` the router wrote
   * on the element is read instead.
   */
  readonly current = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });

  private readonly isDestination = this.native.tagName === 'A';
  private readonly writtenCurrent = inject(new HostAttributeToken('aria-current'), {
    optional: true,
  });

  readonly resolvedCurrent = computed(() => {
    const stated = this.current();
    if (stated !== undefined) return stated;
    if (this.writtenCurrent !== null) return this.writtenCurrent !== 'false';
    return this.isDestination && this.navigation.value() === this.item.value();
  });

  readonly hint = computed(() => this.navigation.compact() || this.item.clipped());

  protected readonly ariaLabel = computed(() =>
    this.navigation.resolvedTruncate() === 'middle' && this.item.clipped()
      ? this.item.labelText()
      : null,
  );

  constructor() {
    super();
    this.item.hasLink.set(true);
    inject(DestroyRef).onDestroy(() => this.item.hasLink.set(false));
  }

  protected onClick(event: Event) {
    if (this.item.resolvedDisabled()) {
      event.preventDefault();
      return;
    }
    if (event.defaultPrevented) return;
    const reason = activationReason(event as MouseEvent);
    if (this.isDestination) this.navigation.select(this.item.value(), reason, event);
    if (this.navigation.compact() && this.navigation.flyout() !== null) {
      this.navigation.setFlyout(null, 'select', event);
    }
  }
}

/* ── The trigger ────────────────────────────────────────────────────────── */

/**
 * The disclosure button of the group. Alone, it is the whole row and carries
 * the label; beside a link it is a mark-only button named by the row's label
 * through `aria-labelledby`. In the rail, a trigger without a link opens the
 * flyout instead of the inline group.
 */
@Component({
  selector: 'button[slSideNavigationTrigger]',
  standalone: true,
  exportAs: 'slSideNavigationTrigger',
  imports: [SlGlyph, SlIcon, SlTooltipLayer, SlTooltipContent],
  template: `<ng-content />
    <span data-part="indicator" data-part-indicator="" aria-hidden="true"
      ><span slIcon directional><svg slGlyph name="chevron-right"></svg></span
    ></span>
    @if (hint()) {
      <ng-template slTooltipLayer>
        <div slTooltipContent>{{ item.labelText() }}</div>
      </ng-template>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [SlTooltip],
  providers: [
    provideTooltipDefaults({ describes: 'description', openOn: 'hover', side: 'inline-end' }),
  ],
  host: {
    ...HINT_HOST,
    'data-part': 'trigger',
    'data-part-trigger': '',
    type: 'button',
    '[attr.id]': 'item.ids.triggerId',
    '[attr.aria-controls]': 'item.ids.groupId',
    '[attr.aria-expanded]': 'item.flyoutOpen() || item.expanded()',
    '[attr.aria-labelledby]': 'item.hasLink() ? item.ids.labelId : null',
    '[disabled]': 'item.resolvedDisabled()',
    '(click)': 'onClick($event)',
  },
})
export class SlSideNavigationTrigger extends SideNavigationRow {
  readonly hint = computed(
    () => !this.item.hasLink() && (this.navigation.compact() || this.item.clipped()),
  );

  constructor() {
    super();
    this.item.triggerNode.set(this.native);
    inject(DestroyRef).onDestroy(() => this.item.triggerNode.set(null));
  }

  protected onClick(event: Event) {
    if (event.defaultPrevented) return;
    const reason = activationReason(event as MouseEvent);
    if (this.navigation.compact() && !this.item.hasLink()) {
      this.navigation.setFlyout(this.item.flyoutOpen() ? null : this.item.value(), reason, event);
      return;
    }
    this.navigation.toggleExpanded(this.item.value(), !this.item.expanded(), reason, event);
  }
}

/* ── The parts of a row ─────────────────────────────────────────────────── */

/** The box the mark stands in. What is left of a row in the rail. */
@Directive({
  selector: '[slSideNavigationIcon]',
  standalone: true,
  host: { 'data-part': 'icon', 'data-part-icon': '', 'aria-hidden': 'true' },
})
export class SlSideNavigationIcon {}

/**
 * The row's text. It registers its words with the item, for the tooltip and
 * for the accessible name under a middle cut, and measures itself whenever
 * the column was resized: a label that overflows its box marks the row
 * clipped, which is what opens the tooltip on a row that fits nothing.
 */
@Directive({
  selector: '[slSideNavigationLabel]',
  standalone: true,
  host: { 'data-part': 'label', 'data-part-label': '', '[attr.id]': 'item.ids.labelId' },
})
export class SlSideNavigationLabel {
  protected readonly item = inject(SlSideNavigationItem);
  private readonly navigation = inject(SlSideNavigation);
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;
  /** The words as the consumer wrote them, kept while a middle cut is shown. */
  private whole: string | null = null;

  constructor() {
    afterNextRender(() => {
      this.whole = this.native.textContent ?? '';
      this.item.labelText.set(this.whole);
      this.measure();
    });
    effect(() => {
      this.navigation.measureTick();
      this.navigation.compact();
      this.navigation.resolvedTruncate();
      if (this.whole !== null) this.measure();
    });
  }

  private measure() {
    const whole = this.whole ?? '';
    const truncate = this.navigation.resolvedTruncate();
    if (truncate === 'none' || this.navigation.compact()) {
      if (this.native.textContent !== whole) this.native.textContent = whole;
      this.item.clipped.set(this.navigation.compact());
      return;
    }
    if (truncate === 'middle') {
      const style = getComputedStyle(this.native);
      const canvas = this.native.ownerDocument.createElement('canvas').getContext('2d');
      const room = this.native.clientWidth;
      if (canvas === null || room === 0) return;
      /* The parts rather than the shorthand: Firefox reports the shorthand empty. */
      canvas.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const cut = truncateMiddle(whole, (candidate) => canvas.measureText(candidate).width <= room);
      if (this.native.textContent !== cut) this.native.textContent = cut;
      this.item.clipped.set(cut !== whole);
      return;
    }
    if (this.native.textContent !== whole) this.native.textContent = whole;
    this.item.clipped.set(this.native.scrollWidth > this.native.clientWidth + 1);
  }
}

/** The second line under the title. */
@Directive({
  selector: '[slSideNavigationDescription]',
  standalone: true,
  host: { 'data-part': 'description', 'data-part-description': '' },
})
export class SlSideNavigationDescription {
  private readonly item = inject(SlSideNavigationItem);
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;

  constructor() {
    afterNextRender(() => this.item.descriptionText.set(this.native.textContent ?? ''));
  }
}

/** A quantity beside a destination, drawn as tabular figures. Never cut. */
@Directive({
  selector: '[slSideNavigationCount]',
  standalone: true,
  host: { 'data-part': 'count', 'data-part-count': '' },
})
export class SlSideNavigationCount {}

/** The suffix with a tone: a badge, a key. */
@Directive({
  selector: '[slSideNavigationEnd]',
  standalone: true,
  host: { 'data-part': 'end', 'data-part-end': '' },
})
export class SlSideNavigationEnd {}

/** Controls beside the row, outside its `a` or `button`. */
@Directive({
  selector: '[slSideNavigationActions]',
  standalone: true,
  host: { 'data-part': 'actions', 'data-part-actions': '' },
})
export class SlSideNavigationActions {}

/** A rule between items that keeps the list a list. */
@Directive({
  selector: 'li[slSideNavigationDivider]',
  standalone: true,
  host: { 'data-part': 'divider', 'data-part-divider': '', role: 'separator' },
})
export class SlSideNavigationDivider {}

/** A row still arriving: an item's geometry with `skeleton` boxes in it. */
@Component({
  selector: 'li[slSideNavigationSkeleton]',
  standalone: true,
  imports: [SlSkeleton],
  template: `<span data-part="icon" data-part-icon=""
      ><span slSkeleton shape="square" size="xs"></span
    ></span>
    <span data-part="label" data-part-label=""
      ><span slSkeleton shape="text" [inlineSize]="labelSize()"></span
    ></span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'skeleton', 'data-part-skeleton': '', 'aria-hidden': 'true' },
})
export class SlSideNavigationSkeleton {
  /** How wide the label's bar is drawn, as any CSS length. */
  readonly labelSize = input('60%');
}

/* ── The group, inline or in the flyout ─────────────────────────────────── */

/**
 * An item's children. Inline, it is the second track of the item's grid and
 * opens with it. In the rail the same `ul` is moved into a layer beside the
 * trigger — composed from `portal`, `positioner`, `presence` and
 * `dismissable-layer`, the four modules every overlay in the library takes —
 * and moved back when the layer has left, which is what the CDK's
 * `DomPortalOutlet` does with a template's nodes.
 */
@Directive({
  selector: 'ul[slSideNavigationGroup]',
  standalone: true,
  exportAs: 'slSideNavigationGroup',
  host: {
    'data-part': 'group',
    'data-part-group': '',
    '[attr.id]': 'item.ids.groupId',
    '[attr.aria-labelledby]': 'item.ids.labelId',
  },
})
export class SlSideNavigationGroup {
  protected readonly item = inject(SlSideNavigationItem);
  private readonly navigation = inject(SlSideNavigation);
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;

  private layer: HTMLElement | null = null;
  private home: { parent: Node; next: Node | null } | null = null;
  private portal: PortalRootHandle | null = null;
  private positioner: PositionerHandle | null = null;
  private dismissable: DismissableLayerHandle | null = null;
  private readonly status = signal<PresenceStatus>('unmounted');
  private readonly presence = createPresence({
    present: false,
    onStatusChange: (next) => this.status.set(next),
  });

  constructor() {
    this.item.hasGroup.set(true);
    effect(() => this.presence.sync(this.item.flyoutOpen()));
    effect(() => (this.status() === 'unmounted' ? this.teardown() : this.build()));
    effect(() => this.stack());
    inject(DestroyRef).onDestroy(() => {
      this.item.hasGroup.set(false);
      this.presence.destroy();
      this.teardown();
    });
  }

  private build() {
    if (this.layer !== null) return;
    const anchor = this.item.triggerNode();
    const document = this.native.ownerDocument;
    const layer = document.createElement('div');
    writeSelectorKey(layer, 'ui', 'side-navigation');
    writeSelectorKey(layer, 'part', 'flyout');
    layer.setAttribute('data-size', this.navigation.resolvedSize());
    layer.setAttribute('data-truncate', this.navigation.resolvedTruncate());
    if (this.navigation.resolvedGuides()) layer.setAttribute('data-guides', '');
    layer.addEventListener('focusout', this.onFocusOut);

    this.home = { parent: this.native.parentNode as Node, next: this.native.nextSibling };
    layer.appendChild(this.native);

    const portal = createPortalRoot({ origin: anchor });
    (portal.container ?? this.home.parent).appendChild(layer);

    this.portal = portal;
    this.layer = layer;
    this.presence.setNode(layer);
    this.navigation.flyoutNode.set(layer);

    if (anchor !== null) {
      this.positioner = createPositioner(anchor, layer, {
        align: 'start',
        flip: true,
        shift: true,
        side: 'inline-end',
        sideOffset: 0,
        strategy: 'fixed',
      });
      void this.positioner.update().then(() => {
        if (this.layer === layer && this.item.flyoutOpen()) layer.setAttribute('data-open', '');
      });
    }
  }

  /** The layer joins the single stack only while it is open; the trigger is a branch. */
  private stack() {
    const open = this.item.flyoutOpen();
    const layer = this.layer;
    this.dismissable?.destroy();
    this.dismissable = null;
    if (layer === null || !open) {
      layer?.removeAttribute('data-open');
      return;
    }
    const anchor = this.item.triggerNode();
    this.dismissable = createDismissableLayer(layer, {
      escape: true,
      focusOutside: false,
      modal: false,
      outsidePress: true,
      scrollLock: false,
      ...(anchor ? { branches: [anchor] } : {}),
      onDismiss: (request) => {
        const reason: SideNavigationFlyoutReason =
          request.reason === 'escape' ? 'escape' : 'outsidePress';
        this.navigation.setFlyout(null, reason, request.source);
        if (reason === 'escape') anchor?.focus();
      },
    });
  }

  private readonly onFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    const layer = this.layer;
    if (next === null || layer === null || !this.item.flyoutOpen()) return;
    if (layer.contains(next) || this.item.triggerNode()?.contains(next)) return;
    this.navigation.setFlyout(null, 'blur', event);
  };

  private teardown() {
    const layer = this.layer;
    if (layer === null) return;
    this.dismissable?.destroy();
    this.dismissable = null;
    this.positioner?.destroy();
    this.positioner = null;
    layer.removeEventListener('focusout', this.onFocusOut);
    if (this.home !== null) this.home.parent.insertBefore(this.native, this.home.next);
    this.home = null;
    this.presence.setNode(null);
    layer.remove();
    this.portal?.release();
    this.portal = null;
    this.layer = null;
    if (this.navigation.flyoutNode() === layer) this.navigation.flyoutNode.set(null);
  }
}
