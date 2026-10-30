import { writeSelectorKey } from '@slotted/core/selector-key';
import {
  afterNextRender,
  afterRenderEffect,
  ApplicationRef,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  type ComponentRef,
  computed,
  contentChildren,
  createComponent,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  EnvironmentInjector,
  forwardRef,
  HostAttributeToken,
  inject,
  Injector,
  input,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  breadcrumbMessages,
  type BreadcrumbMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { createCollapse, type CollapseHandle } from '@slotted/core/overflow';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';

import {
  BREADCRUMB_DEFAULT_ITEMS_AFTER,
  BREADCRUMB_DEFAULT_ITEMS_BEFORE,
  BREADCRUMB_DEFAULT_MAX_ITEMS,
  BREADCRUMB_DEFAULT_OVERFLOW,
  collapsedRange,
  injectBreadcrumbDefaults,
  type BreadcrumbExpandReason,
  type BreadcrumbOverflow,
} from './breadcrumb.constants';

/**
 * The trail of ancestors above the current page.
 *
 * **The landmark and the list are the platform's.** `nav` makes the trail
 * findable and `ol` carries the hierarchy and the set size, which is the whole
 * of the APG's Breadcrumb pattern: it lists no keyboard interaction and two
 * attributes, and both are written here rather than reimplemented.
 *
 * **The collapse expands in place.** An overlay would need a layer, a
 * positioner and a dismissal policy; this needs none of them. The hidden
 * crumbs carry `hidden`, so they leave the accessibility tree with the page,
 * and the button that hides them names the count.
 *
 * **A trail that does not fit folds.** With `overflow="collapse"` the list
 * measures itself and folds the middle crumbs its width cannot hold into the
 * same ellipsis, nearest the root first; what folded is read from the layout
 * and reported in `data-collapsed`, not owned by anyone.
 *
 * **It is a component on the consumer's own `nav`.** A directive carries no
 * `styleUrl`, and the element was never the family's to choose.
 */
@Component({
  selector: 'nav[slBreadcrumb]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrls: ['../../../styles/src/breadcrumb/breadcrumb.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slBreadcrumb',
  host: {
    'data-ui': 'breadcrumb',
    'data-ui-breadcrumb': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.aria-label]': 'accessibleLabel()',
    '[attr.data-expanded]': 'expanded() ? "" : null',
    '[attr.data-collapsed]': 'collapsedCount() > 0 ? collapsedCount() : null',
  },
})
export class SlBreadcrumb {
  /**
   * Present means controlled, for the life of the component, which is why the
   * unset value is `undefined` rather than `false`: a family that read `false`
   * as a consumer's answer would never own its own state.
   */
  readonly expandedValue = input(undefined, {
    alias: 'expanded',
    transform: (value: boolean | string | undefined) =>
      value === undefined ? undefined : booleanAttribute(value),
  });
  /** What an uncontrolled trail starts from, read once. */
  readonly defaultExpanded = input(false, { transform: booleanAttribute });
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * landmark's name (`label`) and the ellipsis. A static `aria-label` still wins.
   */
  readonly messages = input<PartialMessages<BreadcrumbMessages> | undefined>(undefined);
  readonly maxItems = input(undefined, { transform: optionalNumber });
  readonly itemsBeforeCollapse = input(undefined, { transform: optionalNumber });
  readonly itemsAfterCollapse = input(undefined, { transform: optionalNumber });
  readonly separator = input<TemplateRef<unknown> | undefined>(undefined);
  /** What the trail does with crumbs its width cannot hold. */
  readonly overflow = input<BreadcrumbOverflow | undefined>(undefined);

  /** How many crumbs are folded into the ellipsis, written by the list. */
  readonly collapsedCount = signal(0);

  /**
   * Emitted before the trail expands, carrying the value it replaces, the
   * reason and the event it came from. It is not the second half of
   * `[(expanded)]`: a two-way binding has one slot and can carry none of those.
   */
  readonly expandedChange = output<ChangeRequest<boolean>>();

  private readonly own = signal(false);
  readonly expanded = computed(() => this.expandedValue() ?? this.own());

  private readonly defaults = injectBreadcrumbDefaults();

  /** A static `aria-label` the consumer wrote survives the host binding. */
  private readonly ownLabel = inject(new HostAttributeToken('aria-label'), { optional: true });

  /** The family's words in the language in force, with this trail's `messages` laid over them. */
  readonly t = injectMessages(breadcrumbMessages, this.messages);
  readonly accessibleLabel = computed(() => this.ownLabel ?? this.t('label'));
  readonly maxItemsValue = computed(
    () => this.maxItems() ?? this.defaults.maxItems ?? BREADCRUMB_DEFAULT_MAX_ITEMS,
  );
  readonly beforeValue = computed(
    () =>
      this.itemsBeforeCollapse() ??
      this.defaults.itemsBeforeCollapse ??
      BREADCRUMB_DEFAULT_ITEMS_BEFORE,
  );
  readonly afterValue = computed(
    () =>
      this.itemsAfterCollapse() ??
      this.defaults.itemsAfterCollapse ??
      BREADCRUMB_DEFAULT_ITEMS_AFTER,
  );
  readonly separatorValue = computed(() => this.separator() ?? this.defaults.separator);
  readonly overflowValue = computed(
    () => this.overflow() ?? this.defaults.overflow ?? BREADCRUMB_DEFAULT_OVERFLOW,
  );

  /**
   * Where focus goes once the ellipsis stops existing, registered by the list —
   * the only part that can see which crumb the ellipsis replaced. React reaches
   * the same crumb through an id it generates; Angular reaches it through the
   * query it already has, and neither writes anything the other does not.
   */
  private focusAfterExpand: (() => void) | undefined;

  registerFocusTarget(focus: (() => void) | undefined) {
    this.focusAfterExpand = focus;
  }

  private readonly injector = inject(Injector);

  /**
   * The ellipsis stops existing the moment it is pressed, and focus on a
   * removed element is lost to the body — so it is given to the first crumb the
   * expansion revealed. The move waits a microtask because that crumb is still
   * hidden while this runs.
   */
  expand(reason: BreadcrumbExpandReason, source?: Event) {
    if (this.expanded()) return;
    const state = createControllable<boolean>({
      controlled: this.expandedValue(),
      initial: this.expanded(),
      onRequest: (request) => this.expandedChange.emit(request),
    });
    if (state.request(true, reason, source)) this.own.set(true);
    /**
     * After the render, not after a microtask: the crumb focus moves to is
     * still hidden while this runs, and a microtask fires before Angular has
     * written the DOM. Focus then stayed on a removed button and fell to the
     * body, which the spec caught and nothing else would have.
     */
    afterNextRender(() => this.focusAfterExpand?.(), { injector: this.injector });
  }
}

/**
 * The control that reveals what the collapse hides, in an item of its own.
 *
 * The list creates it rather than any crumb drawing it, because it has to be a
 * sibling of the crumbs: a crumb that drew it inside itself hid it together
 * with itself, since the first crumb the collapse hides is the one it stands
 * in front of. Its accessible name carries the count, because three dots say
 * nothing about how much is behind them.
 */
@Component({
  selector: 'li[slBreadcrumbEllipsis]',
  standalone: true,
  imports: [NgTemplateOutlet, SlGlyph, SlIcon],
  template: `
    <button
      [attr.aria-label]="label()"
      aria-expanded="false"
      data-part="ellipsis"
      data-part-ellipsis=""
      type="button"
      (click)="trail.expand('pointer', $event)"
      (keydown)="onKeydown($event)"
    >
      <span slIcon><svg slGlyph name="ellipsis"></svg></span>
    </button>
    <span aria-hidden="true" data-part="separator" data-part-separator="">
      <ng-container *ngTemplateOutlet="trail.separatorValue() ?? null"></ng-container>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'item', 'data-part-item': '' },
})
class SlBreadcrumbEllipsis {
  readonly trail = inject(SlBreadcrumb);
  /* Declared below this class, and read only when an instance is created. */
  private readonly list = inject(SlBreadcrumbList);

  readonly label = computed(() => this.trail.t('showHidden', { count: this.list.hiddenCount() }));

  onKeydown(event: KeyboardEvent) {
    /* `Enter` and `Space` both activate a button and the browser turns each
       into a click; this is what tells the two apart in the request. */
    if (event.key === 'Enter' || event.key === ' ') this.trail.expand('keyboard', event);
  }
}

/**
 * The ordered list, and the one part that knows how many crumbs there are.
 *
 * It queries its items rather than projecting them blindly, because two facts
 * about a crumb can only be known from the outside: whether it is the last —
 * the last draws no separator — and whether the count collapse is hiding it.
 * It also owns the ellipsis, which it places in front of the first crumb that
 * can fold, and the width collapse.
 *
 * That is where the two bindings differ and the DOM does not: React maps its
 * children, Angular writes the same facts back onto queried items and inserts
 * the ellipsis's item itself.
 */
@Directive({
  selector: 'ol[slBreadcrumbList]',
  standalone: true,
  exportAs: 'slBreadcrumbList',
  host: { 'data-part': 'list', 'data-part-list': '' },
})
export class SlBreadcrumbList {
  private readonly trail = inject(SlBreadcrumb);
  /* The crumb is declared below this class, and the dev-server transform puts
     the query predicate in a static initializer — a direct reference would read
     the binding before it exists. `forwardRef` defers the read to the query. */
  private readonly items = contentChildren<SlBreadcrumbItem>(forwardRef(() => SlBreadcrumbItem));
  private readonly host: HTMLOListElement = inject(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly environment = inject(EnvironmentInjector);
  private readonly application = inject(ApplicationRef);

  private ellipsis: ComponentRef<SlBreadcrumbEllipsis> | null = null;
  private collapse: CollapseHandle | null = null;
  private readonly folded = signal(0);

  /**
   * The range is computed whether or not the trail is expanded, because two
   * different things read it. The collapse reads it only while folded; the
   * focus target reads it afterwards, and it has to still be there — the id
   * used to disappear with the ellipsis, which left focus on a removed button
   * and therefore on the body.
   */
  private readonly range = computed(() => {
    const count = this.items().length;
    const maxItems = this.trail.maxItemsValue();
    return maxItems <= 0 || count <= maxItems
      ? undefined
      : collapsedRange(count, this.trail.beforeValue(), this.trail.afterValue());
  });
  private readonly counted = computed(() => (this.trail.expanded() ? undefined : this.range()));
  /** Whether there is a middle at all: crumbs outside the ones that never fold. */
  private readonly middle = computed(
    () =>
      this.items().length >
      Math.max(0, this.trail.beforeValue()) + Math.max(0, this.trail.afterValue()),
  );
  /**
   * The width collapse runs only while the count has hidden nothing: a trail
   * the count already folded shows only the crumbs that never fold. One writer
   * per `hidden` attribute keeps the two from undoing each other — the item's
   * host binding writes it for the count, `createCollapse` for the width.
   */
  private readonly measuring = computed(
    () =>
      this.trail.overflowValue() === 'collapse' &&
      !this.trail.expanded() &&
      this.range() === undefined &&
      this.middle(),
  );

  readonly hiddenCount = computed(() => {
    const counted = this.counted();
    return counted === undefined ? this.folded() : counted.end - counted.start;
  });

  constructor() {
    effect(() => {
      const items = this.items();
      const counted = this.counted();
      for (const [index, item] of items.entries()) {
        item.last.set(index === items.length - 1);
        item.collapsed.set(counted !== undefined && index >= counted.start && index < counted.end);
      }
      /* The first crumb an expansion reveals, whichever collapse hid it. */
      const revealed = this.middle() ? items[Math.max(0, this.trail.beforeValue())] : undefined;
      this.trail.registerFocusTarget(revealed === undefined ? undefined : () => revealed.focus());
      this.trail.collapsedCount.set(this.hiddenCount());
    });

    afterRenderEffect(() => {
      const items = this.items();
      const counted = this.counted() !== undefined;
      const measuring = this.measuring();
      const anchor =
        counted || measuring ? items[Math.max(0, this.trail.beforeValue())] : undefined;
      untracked(() => this.place(anchor?.element, counted, measuring));
    });

    inject(DestroyRef).onDestroy(() => {
      this.collapse?.destroy();
      this.ellipsis?.destroy();
    });
  }

  /**
   * Puts the ellipsis's item in front of the first crumb that can fold, or
   * takes it away, and starts or stops the width measurement.
   */
  private place(anchor: HTMLElement | undefined, counted: boolean, measuring: boolean) {
    if (!measuring) {
      this.collapse?.destroy();
      this.collapse = null;
      this.folded.set(0);
    }
    if (anchor === undefined) {
      if (this.ellipsis !== null) {
        this.application.detachView(this.ellipsis.hostView);
        this.ellipsis.destroy();
        this.ellipsis = null;
      }
      return;
    }

    const item = this.ensureEllipsis();
    if (item.nextElementSibling !== anchor) this.host.insertBefore(item, anchor);

    if (counted) {
      item.removeAttribute('hidden');
      return;
    }
    if (this.collapse === null) {
      /* Until the width has been measured the ellipsis stands for nothing. */
      item.setAttribute('hidden', '');
      const units = () =>
        [...this.host.children].filter(
          (unit): unit is HTMLElement => unit instanceof HTMLElement && unit !== item,
        );
      const before = Math.max(0, this.trail.beforeValue());
      const after = Math.max(0, this.trail.afterValue());
      this.collapse = createCollapse(this.host, {
        /* Only the middle folds: the first crumbs and the last ones never do. */
        collapsible: (unit) => {
          const index = units().indexOf(unit);
          return index >= before && index < units().length - after;
        },
        onChange: (hidden) => this.folded.set(hidden.length),
        /* Nearest the root first, so the folded run stays beside the ellipsis. */
        rank: (unit) => units().indexOf(unit),
        trigger: () => item,
        units,
      });
    } else {
      this.collapse.refresh();
    }
  }

  private ensureEllipsis(): HTMLElement {
    if (this.ellipsis === null) {
      this.ellipsis = createComponent(SlBreadcrumbEllipsis, {
        elementInjector: this.injector,
        environmentInjector: this.environment,
        hostElement: this.host.ownerDocument.createElement('li'),
      });
      this.application.attachView(this.ellipsis.hostView);
    }
    return this.ellipsis.location.nativeElement as HTMLElement;
  }
}

/**
 * One ancestor, or the current page. It carries the separator after it, so a
 * consumer writes none and never leaves a trailing one behind.
 */
@Component({
  selector: 'li[slBreadcrumbItem]',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <ng-content></ng-content>
    @if (!last()) {
      <span aria-hidden="true" data-part="separator" data-part-separator="">
        <ng-container *ngTemplateOutlet="trail.separatorValue() ?? null"></ng-container>
      </span>
    }
  `,
  styleUrls: ['../../../styles/src/breadcrumb/breadcrumb.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slBreadcrumbItem',
  host: {
    'data-part': 'item',
    'data-part-item': '',
    '[attr.hidden]': 'collapsed() ? "" : null',
  },
})
export class SlBreadcrumbItem {
  readonly trail = inject(SlBreadcrumb);

  readonly element: HTMLElement = inject(ElementRef).nativeElement;

  /** Written by the list, which is the only part that can see the whole trail. */
  readonly last = signal(false);
  readonly collapsed = signal(false);

  /** The crumb's own control, whatever the consumer made it. */
  focus() {
    this.element.querySelector<HTMLElement>('a, button, [tabindex]')?.focus();
  }
}

/**
 * An ancestor that can be reached. The directive sits on the consumer's own
 * anchor, so the role, `Enter`, the context menu and every modified click are
 * the platform's — and `routerLink` composes on the same element, because the
 * element was never the family's to begin with.
 */
@Directive({
  selector: 'a[slBreadcrumbLink]',
  standalone: true,
  exportAs: 'slBreadcrumbLink',
  host: { 'data-part': 'link', 'data-part-link': '' },
})
export class SlBreadcrumbLink {
  private readonly element: HTMLAnchorElement = inject(ElementRef).nativeElement;

  focus() {
    this.element.focus();
  }
}

/**
 * The page the reader is on. It is text rather than a link, because a link to
 * the page you are already on goes nowhere, and it carries `aria-current="page"`
 * — the value the ARIA specification names for a link within a set of pages.
 */
@Directive({
  selector: '[slBreadcrumbPage]',
  standalone: true,
  exportAs: 'slBreadcrumbPage',
  host: {
    'data-part': 'page',
    'data-part-page': '',
    'aria-current': 'page',
  },
})
export class SlBreadcrumbPage {}

/**
 * A crumb that opens a menu of its siblings — the organisation, the project,
 * the environment. It is a component on the consumer's own `button`, because an
 * `a` without `href` takes no focus, and it draws the chevron after the label.
 * The menu composes on the same element:
 *
 * ```html
 * <button slBreadcrumbTrigger current [slMenuTriggerFor]="environments">Production</button>
 * ```
 *
 * `current` keeps `aria-current="page"` on the switcher of the page the reader
 * is on, which a switcher does not stop being.
 */
@Component({
  selector: 'button[slBreadcrumbTrigger]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `<ng-content></ng-content><span slIcon><svg slGlyph name="chevron-down"></svg></span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slBreadcrumbTrigger',
  host: {
    'data-part': 'trigger',
    'data-part-trigger': '',
    '[attr.type]': 'ownType ?? "button"',
    '[attr.aria-current]': 'current() ? "page" : ownCurrent',
  },
})
export class SlBreadcrumbTrigger {
  readonly current = input(false, { transform: booleanAttribute });

  protected readonly ownType = inject(new HostAttributeToken('type'), { optional: true });
  protected readonly ownCurrent = inject(new HostAttributeToken('aria-current'), {
    optional: true,
  });
  private readonly element: HTMLElement = inject(ElementRef).nativeElement;

  constructor() {
    /**
     * `slMenuTriggerFor` on the same element binds `data-part` to `null` when
     * its trigger is a plain control, which erased this part and the whole
     * crumb's styling with it. The erasing expression is a constant, so the
     * part written back after the first render is never erased again —
     * `docs/build-briefing.md` records the rule.
     */
    afterNextRender(() => writeSelectorKey(this.element, 'part', 'trigger'));
  }
}

/**
 * Absence has to survive the transform: `numberAttribute` maps an unset input
 * to `NaN`, and a family that read that would stop deferring to the provider.
 */
function optionalNumber(value: number | string | undefined) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = numberAttribute(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
