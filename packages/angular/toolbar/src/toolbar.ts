import { createRovingTabindex, TOOLBAR_ITEM_SELECTOR, toolbarOwnedKeys } from '@slotted/core/focus';
import type { RovingTabindexHandle } from '@slotted/core/focus';
import { createCollapse } from '@slotted/core/overflow';
import type { CollapseHandle } from '@slotted/core/overflow';
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
  inject,
  input,
  output,
  signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

import { injectToolbarDefaults } from './toolbar-defaults';
import type {
  ToolbarOrientation,
  ToolbarOverflowMode,
  ToolbarSize,
  ToolbarVariant,
} from './toolbar-defaults';

export type {
  ToolbarDefaults,
  ToolbarOrientation,
  ToolbarOverflowMode,
  ToolbarSize,
  ToolbarVariant,
} from './toolbar-defaults';

/**
 * The accessible name of the control that holds what did not fit. A string is
 * used verbatim; a function is given the number of units behind the control,
 * because three dots say nothing about how much is behind them.
 */
export type ToolbarOverflowLabel = string | ((hidden: number) => string);

/**
 * One unit that gave way, in the order the bar held it.
 *
 * `separatorBefore` is derived rather than declared: the bar is the participant
 * that hid the units, so it is the only one that knows which of its own rules
 * are now dividing two things that are both in the surface.
 */
export interface ToolbarCollapsedUnit {
  readonly id: string;
  readonly separatorBefore: boolean;
}

/** The attribute that says a unit has somewhere to go. */
export const TOOLBAR_UNIT_ATTRIBUTE = 'data-unit';

/**
 * Everything the bar lays out, and nothing that is or holds the trigger: the
 * control the units give way *to* would otherwise be counted twice, and the
 * Angular trigger sits inside a `display: contents` host of its own.
 */
function unitsOf(container: HTMLElement) {
  return [...container.children].filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement &&
      child.getAttribute('data-part') !== 'overflow' &&
      child.querySelector('[data-part="overflow"]') === null,
  );
}

/**
 * Whether one of the bar's own rules sits between two units that both gave way.
 * It is read from the DOM because a separator is a sibling of the units it
 * divides and nothing in the component tree relates them.
 */
function ruleBetween(from: Element, to: Element) {
  for (
    let node = from.nextElementSibling;
    node !== null && node !== to;
    node = node.nextElementSibling
  ) {
    if (node.getAttribute('data-part') === 'separator') return true;
  }
  return false;
}

/**
 * A set of controls that share one tab stop.
 *
 * **The keyboard is the whole point of the role.** `Tab` enters the bar once and
 * lands on the control that last had focus, the arrows of the flow axis move
 * between the controls and wrap — from row to row when the bar wrapped, because
 * the item list is linear — and `Home` and `End` reach the ends. The cross axis
 * duplicates the pair, which the APG permits and which is what gives focus a way
 * out of an item that keeps the flow arrows for itself.
 *
 * **The items are the consumer's own controls.** Anything focusable inside the
 * bar is an item, found through `TOOLBAR_ITEM_SELECTOR`, so this library's
 * `button`, `link`, `checkbox`, `switch` and `text-field` — and a menu trigger,
 * and a consumer's own control — drop in unwrapped.
 *
 * **The bar paints itself and nothing inside it.** A bar out of action is
 * `<fieldset disabled>` around it: the platform disables every control inside,
 * and a natively disabled control cannot be focused, so the arrows skip exactly
 * those.
 */
@Component({
  selector: '[slToolbar]',
  standalone: true,
  exportAs: 'slToolbar',
  template: '<ng-content />',
  styleUrl: '../../../styles/src/toolbar/toolbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'toolbar',
    'data-ui-toolbar': '',
    'data-part': 'root',
    'data-part-root': '',
    role: 'toolbar',
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-overflow]': 'resolvedOverflow()',
    '[attr.data-collapsed]': 'collapsedCount()',
    '[attr.aria-orientation]': 'ariaOrientation()',
  },
})
export class SlToolbar {
  readonly orientation = input<ToolbarOrientation | undefined>(undefined);
  readonly size = input<ToolbarSize | undefined>(undefined);
  readonly variant = input<ToolbarVariant | undefined>(undefined);
  readonly overflow = input<ToolbarOverflowMode | undefined>(undefined);
  /** Whether the arrows wrap past the ends of the bar. */
  readonly loop = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });

  /**
   * Reports how many units gave way, once per change. The collapsed set is a
   * measurement rather than a value, so there is no two-way binding over it: a
   * consumer who owned it could assert that a bar fits when the layout says it
   * does not.
   */
  readonly overflowChange = output<number>();

  private readonly defaults = injectToolbarDefaults();
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;

  private readonly counterparts = signal(new Map<string, TemplateRef<unknown>>());
  private readonly trigger = signal<HTMLElement | null>(null);
  private readonly ready = signal(false);
  private ring: RovingTabindexHandle | null = null;

  /** The units that gave way, in the order the bar held them. */
  readonly collapsedUnits = signal<readonly ToolbarCollapsedUnit[]>([]);

  readonly resolvedOrientation = computed(() => this.orientation() ?? this.defaults.orientation);
  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedOverflow = computed(() => this.overflow() ?? this.defaults.overflow);
  readonly resolvedLoop = computed(() => this.loop() ?? this.defaults.loop);

  protected readonly ariaOrientation = computed(() =>
    this.resolvedOrientation() === 'vertical' ? 'vertical' : null,
  );

  protected readonly collapsedCount = computed(() =>
    this.resolvedOverflow() === 'menu' ? String(this.collapsedUnits().length) : null,
  );

  /** Records what a unit becomes in the surface. */
  registerUnit(id: string, template: TemplateRef<unknown>) {
    this.counterparts.update((held) => new Map(held).set(id, template));
  }

  releaseUnit(id: string) {
    this.counterparts.update((held) => {
      const next = new Map(held);
      next.delete(id);
      return next;
    });
  }

  counterpart(id: string) {
    return this.counterparts().get(id) ?? null;
  }

  /** The control that opens what did not fit. The bar measures it. */
  registerTrigger(element: HTMLElement | null) {
    this.trigger.set(element);
  }

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const ring: RovingTabindexHandle = createRovingTabindex(this.element, {
        crossAxis: true,
        includeAriaDisabled: true,
        itemSelector: TOOLBAR_ITEM_SELECTOR,
        loop: () => this.resolvedLoop(),
        orientation: () => this.resolvedOrientation(),
        ownedKeys: (item) => toolbarOwnedKeys(item, this.resolvedOrientation()),
      });

      this.ring = ring;

      /**
       * A control arriving or leaving has to reach the tab stop, and neither
       * binding can be told by the other's change detection. The DOM is the one
       * thing they agree on — and the same event invalidates the measurement,
       * because a bar that grows a button collapses one.
       */
      const observer = new MutationObserver(() => {
        ring.refresh();
        this.collapse?.refresh();
      });
      observer.observe(this.element, { childList: true, subtree: true });

      this.ready.set(true);

      destroyRef.onDestroy(() => {
        observer.disconnect();
        ring.destroy();
        this.ring = null;
      });
    });

    /**
     * The collapse runs only under `overflow="menu"`, and only once the bar
     * holds a trigger: with nothing to give way *to*, every unit is pinned and
     * the bar scrolls instead — the same degradation a bar of pinned units
     * gets.
     */
    effect((onCleanup) => {
      const trigger = this.trigger();
      const orientation = this.resolvedOrientation();
      if (!this.ready() || this.resolvedOverflow() !== 'menu') return;

      const handle: CollapseHandle = createCollapse(this.element, {
        collapsible: (unit) => unit.hasAttribute(TOOLBAR_UNIT_ATTRIBUTE),
        divides: (unit) => unit.getAttribute('data-part') === 'separator',
        /* A spacer grows into whatever is left, so its room is nought — and it
           is still one of the boxes the gaps run between. */
        fixedSize: (unit) => (unit.getAttribute('data-part') === 'spacer' ? 0 : undefined),
        onChange: (units) => {
          const named = units.filter((unit) => unit.hasAttribute(TOOLBAR_UNIT_ATTRIBUTE));
          this.collapsedUnits.set(
            named.map((unit, index) => {
              const previous = named[index - 1];
              return {
                id: unit.getAttribute(TOOLBAR_UNIT_ATTRIBUTE) ?? '',
                separatorBefore: previous !== undefined && ruleBetween(previous, unit),
              };
            }),
          );
          /* A unit that left the bar leaves the ring with it, and one that came
             back rejoins it. */
          this.ring?.refresh();
          this.overflowChange.emit(named.length);
        },
        orientation: () => orientation,
        trigger: () => trigger,
        units: () => unitsOf(this.element),
      });

      this.collapse = handle;
      onCleanup(() => {
        handle.destroy();
        this.collapse = null;
        this.collapsedUnits.set([]);
      });
    });
  }

  private collapse: CollapseHandle | null = null;
}

/**
 * A run of related controls, announced as a group.
 *
 * The distance inside it is half the bar's gap and the distance around it is a
 * gap and a half, so the boundary between two groups reads wider than the
 * boundary between two controls. Its accessible name is the consumer's own
 * `aria-label`.
 *
 * The arrows do not stop at its edge: a group is a label around a run, not a
 * second keyboard.
 */
@Directive({
  selector: '[slToolbarGroup]',
  standalone: true,
  exportAs: 'slToolbarGroup',
  host: {
    'data-part': 'group',
    'data-part-group': '',
    role: 'group',
    '[attr.data-unit]': 'unit.id()',
  },
})
export class SlToolbarGroup {
  /**
   * What the whole run becomes when the bar has no room for it, under
   * `overflow="menu"`. A group that declares none is pinned.
   */
  readonly counterpart = input<TemplateRef<unknown> | undefined>(undefined, {
    alias: 'slToolbarGroupCounterpart',
  });

  protected readonly unit = declareUnit(() => this.counterpart());
}

/**
 * One unit the bar may give up, and what it becomes when it does.
 *
 * A unit is a direct child of the root, which is deliberately not the same
 * thing as an item: the keyboard finds items by being focusable, at any depth,
 * and the collapse acts on the boxes the bar lays out. A `slButtonGroup` inside
 * one of these is one unit and four items.
 *
 * It is only needed under `overflow="menu"`, and only around a control the bar
 * is allowed to hide. A control placed in a bar unwrapped is a unit too — a
 * pinned one, because it declares nothing to become.
 */
@Directive({
  selector: '[slToolbarItem]',
  standalone: true,
  exportAs: 'slToolbarItem',
  host: { 'data-part': 'item', 'data-part-item': '', '[attr.data-unit]': 'unit.id()' },
})
export class SlToolbarItem {
  /**
   * What the control becomes in the surface. An item that declares none cannot
   * be hidden, which is how a primary action stays visible: it has nowhere to
   * go, rather than a rank above the others.
   */
  readonly counterpart = input<TemplateRef<unknown> | undefined>(undefined, {
    alias: 'slToolbarItemCounterpart',
  });

  protected readonly unit = declareUnit(() => this.counterpart());
}

/**
 * Records what a unit becomes in the surface, and says so in the DOM.
 *
 * The attribute is what the measurement reads: a unit carrying it has somewhere
 * to go, and one without it is pinned. Pinning is therefore the absence of a
 * counterpart rather than a second input — one fact, in the place a reader is
 * already looking, and no way for the two to disagree.
 */
let unitCount = 0;

function declareUnit(counterpart: () => TemplateRef<unknown> | undefined) {
  const toolbar = inject(SlToolbar, { optional: true });
  const destroyRef = inject(DestroyRef);
  const identity = `slotted-toolbar-unit-${(unitCount += 1)}`;

  const id = computed(() => (counterpart() === undefined ? null : identity));

  effect(() => {
    const template = counterpart();
    if (toolbar === null) return;
    if (template === undefined) toolbar.releaseUnit(identity);
    else toolbar.registerUnit(identity, template);
  });

  destroyRef.onDestroy(() => toolbar?.releaseUnit(identity));

  return { id };
}

/**
 * A hairline between two runs.
 *
 * It is a part of this family rather than a `divider`, because its geometry
 * belongs to the bar: it is measured against the controls beside it, and it
 * turns with the bar. `aria-orientation` states the axis of the rule itself,
 * which is perpendicular to the one the controls run along.
 */
@Directive({
  selector: '[slToolbarSeparator]',
  standalone: true,
  exportAs: 'slToolbarSeparator',
  host: {
    'data-part': 'separator',
    'data-part-separator': '',
    role: 'separator',
    '[attr.aria-orientation]': 'ariaOrientation()',
  },
})
export class SlToolbarSeparator {
  private readonly toolbar = inject(SlToolbar);

  protected readonly ariaOrientation = computed(() =>
    this.toolbar.resolvedOrientation() === 'vertical' ? 'horizontal' : 'vertical',
  );
}

/**
 * The free space between two runs, so what follows sits at the end of the bar.
 *
 * It replaces a `justify` axis: an axis decides the placement of every control
 * at once, and what a bar needs is one boundary — the editing controls at the
 * start, the destructive one at the end.
 */
@Directive({
  selector: '[slToolbarSpacer]',
  standalone: true,
  exportAs: 'slToolbarSpacer',
  host: { 'data-part': 'spacer', 'data-part-spacer': '', 'aria-hidden': 'true' },
})
export class SlToolbarSpacer {}
