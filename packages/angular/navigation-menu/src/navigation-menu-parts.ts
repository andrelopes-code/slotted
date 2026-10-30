import { createPresence } from '@slotted/core/presence';
import type { PresenceStatus } from '@slotted/core/presence';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
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
  ViewEncapsulation,
} from '@angular/core';

import {
  NAVIGATION_MENU_PANEL,
  NAVIGATION_MENU_SECTION,
  SlNavigationMenu,
} from './navigation-menu';
import type { NavigationMenuSection } from './navigation-menu';
import { SlNavigationMenuIdFactory } from './navigation-menu-defaults';
import type { NavigationMenuColumns } from './navigation-menu-defaults';

/** A click synthesised by the keyboard reports no detail; a real one reports the count. */
function activationReason(event: MouseEvent) {
  return event.detail === 0 ? ('keyboard' as const) : ('pointer' as const);
}

/**
 * The sections and the top-level links, in a row or a column. A component
 * for one reason: it brings the family's stylesheet, which the root — a
 * directive another family may carry — cannot.
 */
@Component({
  selector: 'ul[slNavigationMenuList]',
  standalone: true,
  template: '<ng-content />',
  styleUrl: '../../../styles/src/navigation-menu/navigation-menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'list', 'data-part-list': '' },
})
export class SlNavigationMenuList {}

/**
 * One section — a trigger followed by its panel — or one top-level link. It
 * carries `data-open` while its panel is shown, and knows whether a link
 * inside the panel is the current page.
 */
@Directive({
  selector: 'li[slNavigationMenuItem]',
  standalone: true,
  exportAs: 'slNavigationMenuItem',
  providers: [
    { provide: NAVIGATION_MENU_SECTION, useExisting: forwardRef(() => SlNavigationMenuItem) },
  ],
  host: {
    'data-part': 'item',
    'data-part-item': '',
    '[attr.data-value]': 'value()',
    '[attr.data-open]': "open() ? '' : null",
    '[attr.data-disabled]': "disabled() ? '' : null",
  },
})
export class SlNavigationMenuItem implements NavigationMenuSection {
  /** The item's identity: what the root's `value` names it by. */
  readonly value = input.required<string>();
  /** The section or the top-level link refuses interaction. */
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly navigation = inject(SlNavigationMenu);
  readonly contentId = `${inject(SlNavigationMenuIdFactory).next()}-content`;
  readonly open = computed(() => this.navigation.value() === this.value());

  private readonly currents = signal<ReadonlySet<object>>(new Set());
  /** Whether a link inside this item's panel is the current page. */
  readonly hasCurrent = computed(() => this.currents().size > 0);

  constructor() {
    const destroyRef = inject(DestroyRef);
    let release: (() => void) | null = null;
    effect(() => {
      release?.();
      release = this.navigation.register(this.value(), this.contentId);
    });
    destroyRef.onDestroy(() => release?.());

    /* A second level holding the current page marks the outer section too. */
    const outer = inject(NAVIGATION_MENU_SECTION, { optional: true, skipSelf: true });
    if (outer !== null) {
      effect(() => outer.reportCurrent(this, this.hasCurrent()));
      destroyRef.onDestroy(() => outer.reportCurrent(this, false));
    }
  }

  /** A link inside the panel says whether it is the current page. */
  reportCurrent(link: object, current: boolean) {
    this.currents.update((set) => {
      if (set.has(link) === current) return set;
      const next = new Set(set);
      if (current) next.add(link);
      else next.delete(link);
      return next;
    });
  }
}

/**
 * What makes a button a section's trigger: `aria-expanded` and
 * `aria-controls` toward its panel, `data-open` and `data-current`, a press
 * and a resting pointer. A host directive, so another family's trigger —
 * `top-navigation`'s — is wired by the same lines.
 */
@Directive({
  selector: '[slNavigationMenuTriggerWiring]',
  standalone: true,
  host: {
    'data-part': 'trigger',
    'data-part-trigger': '',
    type: 'button',
    '[attr.aria-controls]': 'section.contentId',
    '[attr.aria-expanded]': 'section.open()',
    '[attr.data-open]': "section.open() ? '' : null",
    '[attr.data-current]': "section.hasCurrent() ? '' : null",
    '[attr.disabled]': "section.disabled() ? '' : null",
    '(click)': 'onClick($event)',
    '(pointerenter)': 'onPointerEnter($event)',
  },
})
export class SlNavigationMenuTriggerWiring {
  protected readonly section = inject(NAVIGATION_MENU_SECTION);
  private readonly navigation = inject(SlNavigationMenu);

  protected onClick(event: MouseEvent) {
    if (event.defaultPrevented || this.section.disabled()) return;
    this.navigation.request(
      this.section.open() ? null : this.section.value(),
      activationReason(event),
      event,
    );
  }

  protected onPointerEnter(event: PointerEvent) {
    if (event.defaultPrevented || this.section.disabled()) return;
    /* A trigger another family moved out of the row — into an overflow panel —
       opens on a press, never on a resting pointer. */
    if (!this.navigation.host.contains(event.currentTarget as Node)) return;
    this.navigation.hover(this.section.value(), event.pointerType);
  }
}

/**
 * The section's button: always a native `button`, because it owns
 * `aria-expanded` and `aria-controls` and the family wires both. The chevron
 * is the family's own mark.
 */
@Component({
  selector: 'button[slNavigationMenuTrigger]',
  standalone: true,
  exportAs: 'slNavigationMenuTrigger',
  imports: [SlGlyph, SlIcon],
  template: `<ng-content />
    <span data-part="indicator" data-part-indicator="" aria-hidden="true"
      ><span slIcon [directional]="vertical()"
        ><svg slGlyph [name]="vertical() ? 'chevron-right' : 'chevron-down'"></svg></span
    ></span>`,
  styleUrl: '../../../styles/src/navigation-menu/navigation-menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [SlNavigationMenuTriggerWiring],
})
export class SlNavigationMenuTrigger {
  private readonly navigation = inject(SlNavigationMenu);
  protected readonly vertical = computed(
    () => this.navigation.resolvedOrientation() === 'vertical',
  );
}

/**
 * The section's panel, after its trigger in the same item. It stays in the
 * document while it leaves — `@slotted/core/presence` holds it for the exit —
 * and is `hidden` otherwise, so the tab sequence, a static render and a search
 * engine read every destination. It tells a root rendered inside it that it is
 * a second level.
 */
@Directive({
  selector: '[slNavigationMenuContent]',
  standalone: true,
  exportAs: 'slNavigationMenuContent',
  providers: [{ provide: NAVIGATION_MENU_PANEL, useValue: true }],
  host: {
    'data-part': 'content',
    'data-part-content': '',
    '[attr.id]': 'item.contentId',
    '[attr.data-columns]': 'columns()',
    '[attr.data-open]': "item.open() ? '' : null",
    '[attr.data-motion]': 'crossing()',
    '[hidden]': '!item.open() && status() === "unmounted"',
  },
})
export class SlNavigationMenuContent {
  /** How many columns of links or groups the panel lays out. */
  readonly columns = input<NavigationMenuColumns, NavigationMenuColumns | string>(1, {
    transform: (value) => Number(value) as NavigationMenuColumns,
  });

  protected readonly item = inject(NAVIGATION_MENU_SECTION);
  private readonly navigation = inject(SlNavigationMenu);
  protected readonly status = signal<PresenceStatus>('unmounted');

  protected readonly crossing = computed(() => {
    const motion = this.navigation.motion();
    const value = this.item.value();
    if (this.item.open()) return motion.to === value ? motion.enter : null;
    return this.status() === 'exiting' && motion.from === value ? motion.exit : null;
  });

  constructor() {
    const presence = createPresence({
      present: false,
      onStatusChange: (status) => this.status.set(status),
    });
    presence.setNode(inject(ElementRef).nativeElement);
    effect(() => presence.sync(this.item.open()));
    inject(DestroyRef).onDestroy(() => presence.destroy());
  }
}

/**
 * A destination, at the top level or inside a panel. `current` — or the
 * `aria-current` a router writes — marks the page the reader is on and tells
 * the section's trigger. Inside a panel, following it closes every level.
 */
@Directive({
  selector: 'a[slNavigationMenuLink]',
  standalone: true,
  exportAs: 'slNavigationMenuLink',
  host: {
    'data-part': 'link',
    'data-part-link': '',
    '[attr.aria-current]': "resolvedCurrent() ? 'page' : null",
    '[attr.data-current]': "resolvedCurrent() ? '' : null",
    '[attr.aria-disabled]': "disabled() ? 'true' : null",
    '[attr.data-disabled]': "disabled() ? '' : null",
    '(click)': 'onClick($event)',
  },
})
export class SlNavigationMenuLink {
  /** This link is the page the reader is on. Unstated, a router's `aria-current` is read. */
  readonly current = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  /** The destination is unavailable: the click is refused and the `href` kept. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Following this link closes the panel. Wins over the root's `closeOnSelect`. */
  readonly closeOnSelect = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });

  private readonly navigation = inject(SlNavigationMenu);
  private readonly item = inject(NAVIGATION_MENU_SECTION, { optional: true });
  private readonly inPanel = inject(NAVIGATION_MENU_PANEL, { optional: true }) === true;
  private readonly writtenCurrent = inject(new HostAttributeToken('aria-current'), {
    optional: true,
  });

  readonly resolvedCurrent = computed(() => {
    const stated = this.current();
    if (stated !== undefined) return stated;
    return this.writtenCurrent !== null && this.writtenCurrent !== 'false';
  });

  constructor() {
    const item = this.item;
    if (this.inPanel && item !== null) {
      effect(() => item.reportCurrent(this, this.resolvedCurrent()));
      inject(DestroyRef).onDestroy(() => item.reportCurrent(this, false));
    }
  }

  protected onClick(event: MouseEvent) {
    if (this.disabled()) {
      event.preventDefault();
      return;
    }
    if (event.defaultPrevented || !this.inPanel) return;
    if (this.closeOnSelect() ?? this.navigation.resolvedCloseOnSelect()) {
      this.navigation.select(event);
    }
  }
}

/** A grid of links inside a panel or a group. */
@Directive({
  selector: 'ul[slNavigationMenuLinks]',
  standalone: true,
  host: { 'data-part': 'links', 'data-part-links': '' },
})
export class SlNavigationMenuLinks {}

/** A column of a panel with a title that names the links under it. */
@Directive({
  selector: '[slNavigationMenuGroup]',
  standalone: true,
  host: {
    'data-part': 'group',
    'data-part-group': '',
    role: 'group',
    '[attr.aria-labelledby]': 'labelledBy ?? labelId',
  },
})
export class SlNavigationMenuGroup {
  readonly labelId = `${inject(SlNavigationMenuIdFactory).next()}-group-label`;
  protected readonly labelledBy = inject(new HostAttributeToken('aria-labelledby'), {
    optional: true,
  });
}

/** The group's title. */
@Directive({
  selector: '[slNavigationMenuGroupLabel]',
  standalone: true,
  host: { 'data-part': 'group-label', 'data-part-group-label': '', '[attr.id]': 'id' },
})
export class SlNavigationMenuGroupLabel {
  protected readonly id =
    inject(new HostAttributeToken('id'), { optional: true }) ??
    inject(SlNavigationMenuGroup, { optional: true })?.labelId ??
    null;
}

/** The panel's last row, under a rule: the consumer's call to action. */
@Directive({
  selector: '[slNavigationMenuFooter]',
  standalone: true,
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlNavigationMenuFooter {}

/** A rich link's mark, aligned to the text of its label. */
@Directive({
  selector: '[slNavigationMenuIcon]',
  standalone: true,
  host: { 'data-part': 'icon', 'data-part-icon': '', 'aria-hidden': 'true' },
})
export class SlNavigationMenuIcon {}

/** A rich link's title. */
@Directive({
  selector: '[slNavigationMenuLabel]',
  standalone: true,
  host: { 'data-part': 'label', 'data-part-label': '' },
})
export class SlNavigationMenuLabel {}

/** A rich link's description: two lines to the eye, whole in the DOM. */
@Directive({
  selector: '[slNavigationMenuDescription]',
  standalone: true,
  host: { 'data-part': 'description', 'data-part-description': '' },
})
export class SlNavigationMenuDescription {}
