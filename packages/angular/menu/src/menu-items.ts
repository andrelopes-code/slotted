import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { keysMessages } from '@slotted/core/i18n';
import type { KbdPlatform, KeysTranslator } from '@slotted/core/keys';
import { canonicalKey, parseShortcut, resolvePlatform, resolveShortcut } from '@slotted/core/keys';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  model,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { SlMenu } from './menu';
import type { MenuTone, MenuValueReason } from './menu-defaults';

/** What ARIA calls each modifier, which is not what a reader sees. */
const ARIA_MODIFIERS: Record<string, string> = {
  alt: 'Alt',
  ctrl: 'Control',
  meta: 'Meta',
  shift: 'Shift',
};

/**
 * The shortcut as `aria-keyshortcuts` states it, or nothing.
 *
 * A sequence has no syntax in the attribute, whose separator means *or* rather
 * than *then*, so a sequence is printed and left unannounced instead of being
 * announced as something it is not.
 */
export function announceShortcut(keys: string, platform: KbdPlatform): string | undefined {
  const steps = parseShortcut(keys);
  if (steps.length !== 1) return undefined;

  return steps[0]
    ?.map((token) => {
      const canonical = canonicalKey(token);
      if (canonical === 'mod') return platform === 'mac' ? 'Meta' : 'Control';
      if (canonical !== undefined && canonical in ARIA_MODIFIERS) {
        return ARIA_MODIFIERS[canonical] as string;
      }
      const word = canonical ?? token;
      return word.length === 1 ? word.toUpperCase() : `${word[0]?.toUpperCase()}${word.slice(1)}`;
    })
    .join('+');
}

/** The legends a reader sees, in the order the platform writes them, in the language of `t`. */
export function shortcutLegends(keys: string, platform: KbdPlatform, t: KeysTranslator): string {
  const shortcut = resolveShortcut(keys, { platform, t });
  return shortcut.steps
    .map((step) => step.map((key) => key.legend).join(shortcut.separator))
    .join(` ${shortcut.thenLabel} `);
}

/** What an item reports when it runs. */
export interface MenuSelectEvent {
  readonly reason: MenuValueReason;
  readonly source: Event | undefined;
  readonly defaultPrevented: boolean;
  preventDefault: () => void;
}

/**
 * One command, one option, or one choice among others.
 *
 * A native `button` carrying `role="menuitem"`: the platform gives the press,
 * the `Enter` and `Space` handling and the pointer semantics, and the role
 * replaces `button` so a reader hears an item. Which of the three roles it
 * takes is decided by the attribute the consumer wrote, read once through
 * `HostAttributeToken`, because one element cannot carry two components.
 *
 * A disabled item keeps its place in the ring and takes `aria-disabled`: the
 * pattern asks that disabled items stay focusable, and the native attribute
 * would remove them.
 */
@Component({
  selector:
    'button[slMenuItem], a[slMenuItem], button[slMenuCheckboxItem], button[slMenuRadioItem]',
  standalone: true,
  exportAs: 'slMenuItem',
  imports: [SlGlyph, SlIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'item',
    'data-part-item': '',
    tabindex: '-1',
    '[attr.role]': 'role',
    '[attr.type]': 'isLink ? null : "button"',
    '[attr.aria-checked]': 'role === "menuitem" ? null : isChecked()',
    '[attr.aria-disabled]': 'disabled() ? true : null',
    '[attr.aria-describedby]': 'describedBy() ?? null',
    '[attr.aria-labelledby]': 'describedBy() === null ? null : labelId',
    '[attr.aria-keyshortcuts]': 'announced()',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-checked]': 'isChecked() ? "" : null',
    '[attr.data-text-value]': 'textValue() ?? null',
    '[attr.data-tone]': 'tone() ?? null',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeyDown($event)',
    '(pointermove)': 'onPointerMove()',
  },
  template: `
    @if (role !== 'menuitem') {
      <span data-part="indicator" data-part-indicator=""
        ><span slIcon><svg slGlyph [name]="role === 'menuitemradio' ? 'dot' : 'check'"></svg></span
      ></span>
    }
    <ng-content select="[slMenuItemIcon]" />
    <span data-part="label" data-part-label="" [id]="labelId"><ng-content /></span>
    <ng-content select="[slMenuItemDescription]" />
    <ng-content select="[slMenuItemMeta]" />
    @if (legend(); as printed) {
      <span data-part="shortcut" data-part-shortcut="" aria-hidden="true">{{ printed }}</span>
    }
    @if (opensSubmenu()) {
      <span slIcon directional><svg slGlyph name="chevron-right"></svg></span>
    }
  `,
})
export class SlMenuItem {
  readonly disabled = input(false, { transform: booleanAttribute });
  /** What typeahead matches on, when the visible label is not the word. */
  readonly textValue = input<string | undefined>(undefined);
  readonly tone = input<MenuTone | undefined>(undefined);
  /**
   * A shortcut in this library's own notation — `Mod+K`. It is printed with the
   * platform's legends and announced with `aria-keyshortcuts`; the family does
   * not listen for it, because a menu that bound keys would fire commands while
   * it was closed.
   */
  readonly shortcut = input<string | undefined>(undefined);
  readonly closeOnSelect = input(undefined, {
    transform: (given: boolean | string | undefined) =>
      given === undefined ? undefined : booleanAttribute(given),
  });

  /** The value this item stands for inside a radio group. */
  readonly value = input<string | undefined>(undefined);
  readonly checked = model<boolean>(false);
  readonly checkedChangeRequest = output<ChangeRequest<boolean>>();
  readonly select = output<MenuSelectEvent>();

  /** The line under the label, which describes the item rather than naming it. */
  readonly describedBy = signal<string | null>(null);
  /**
   * What names the item while a line describes it: the label alone, or the
   * description would be read twice, once in the name and once after it.
   */
  protected readonly labelId = `sl-menu-label-${Math.random().toString(36).slice(2, 8)}`;

  private readonly menu = inject(SlMenu);
  private readonly group = inject(SlMenuRadioGroup, { optional: true });
  private readonly element: HTMLElement = inject(ElementRef).nativeElement;
  private readonly platform = resolvePlatform('auto');
  /** The words a shortcut's keys are written in, from the `keys` catalog of the language in force. */
  private readonly keysT = injectMessages(keysMessages);

  private readonly isCheckbox =
    inject(new HostAttributeToken('slMenuCheckboxItem'), {
      optional: true,
    }) !== null;
  private readonly isRadio =
    inject(new HostAttributeToken('slMenuRadioItem'), { optional: true }) !== null;
  protected readonly isLink = this.element.tagName === 'A';

  /**
   * Set by `slMenuTriggerFor` on the same element: an item that opens a
   * submenu ends in a chevron that points along the reading direction.
   */
  readonly opensSubmenu = signal(false);

  protected readonly role = this.isCheckbox
    ? 'menuitemcheckbox'
    : this.isRadio
      ? 'menuitemradio'
      : 'menuitem';

  protected readonly isChecked = computed(() =>
    this.isRadio ? this.group?.value() === this.value() : this.checked(),
  );

  protected readonly legend = computed(() => {
    const keys = this.shortcut();
    return keys === undefined ? undefined : shortcutLegends(keys, this.platform, this.keysT);
  });

  protected readonly announced = computed(() => {
    const keys = this.shortcut();
    return keys === undefined ? null : (announceShortcut(keys, this.platform) ?? null);
  });

  /**
   * The host is a `button` or an `a`, so the template compiler types the event
   * as the one thing both have in common and the narrowing happens here.
   */
  protected onClick(event: Event) {
    /* A click a keyboard produced carries no pointer coordinates, which is how
       `Enter` on a button is told from a press without listening for both. */
    const detail = (event as MouseEvent).detail;
    this.run(detail === 0 ? 'keyboard' : 'pointer', event);
  }

  protected onKeyDown(source: Event) {
    const event = source as KeyboardEvent;
    /* The pattern's optional rule, taken: `Space` on a checkbox or radio item
       changes the state without closing the menu. */
    if (event.key !== ' ' || this.role === 'menuitem') return;
    event.preventDefault();
    if (this.disabled()) return;
    this.commit('keyboard', event);
  }

  /**
   * The pointer moving over an item focuses it, which keeps exactly one item
   * highlighted whichever device is driving — and is what lets the stylesheet
   * paint the highlight on `:focus` rather than splitting it in two.
   */
  protected onPointerMove() {
    if (this.element.ownerDocument.activeElement === this.element) return;
    this.element.focus({ preventScroll: true });
  }

  private commit(reason: MenuValueReason, source: Event) {
    if (this.isRadio) {
      const value = this.value();
      if (value !== undefined) this.group?.choose(value, reason, source);
      return;
    }
    if (!this.isCheckbox) return;

    const next = !this.checked();
    const state = createControllable<boolean>({
      initial: this.checked(),
      onRequest: (request) => this.checkedChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.checked.set(next);
  }

  private run(reason: MenuValueReason, source: Event) {
    if (this.disabled()) return;

    this.commit(reason, source);

    let prevented = false;
    this.select.emit({
      reason,
      source,
      get defaultPrevented() {
        return prevented;
      },
      preventDefault: () => {
        prevented = true;
      },
    });
    if (prevented) return;

    /* A checkbox or a radio item keeps the menu open by default: a reader
       turning three things on would otherwise open it three times. */
    const closes =
      this.closeOnSelect() ?? (this.role === 'menuitem' && this.menu.resolvedCloseOnSelect());
    if (closes) this.menu.closeAll('select', source);
  }
}

/** The mark in the item's first column: the consumer's own element. */
@Directive({
  selector: '[slMenuItemIcon]',
  standalone: true,
  host: { 'data-part': 'icon', 'data-part-icon': '' },
})
export class SlMenuItemIcon {}

/**
 * The second line, under the label.
 *
 * It describes the item rather than naming it: the item points at it with
 * `aria-describedby`, so a reader hears "Delete document" and then the warning,
 * instead of one name with a sentence stuck to it.
 */
@Directive({
  selector: '[slMenuItemDescription]',
  standalone: true,
  host: { 'data-part': 'description', 'data-part-description': '', '[attr.id]': 'id' },
})
export class SlMenuItemDescription {
  protected readonly id = `sl-menu-description-${Math.random().toString(36).slice(2, 8)}`;
  private readonly item = inject(SlMenuItem, { optional: true });

  constructor() {
    this.item?.describedBy.set(this.id);
  }
}

/**
 * What the item holds or counts — a number, a status, the value a submenu is
 * set to — in a column of its own before the shortcut or the chevron. It reads
 * as part of the item's name; typeahead matches the label alone.
 */
@Directive({
  selector: '[slMenuItemMeta]',
  standalone: true,
  host: { 'data-part': 'meta', 'data-part-meta': '' },
})
export class SlMenuItemMeta {}

/**
 * Who the menu belongs to: an avatar, a name, a line under it, above the
 * commands. Not an item — the arrows and typeahead never reach it, because a
 * `menu` owns only items, groups and separators — so the surface names it as
 * its description and a reader hears it once, as the menu opens. The name is a
 * `data-part="label"` element and the line under it `slMenuItemDescription`;
 * any other child is the media, set beside both.
 */
@Directive({
  selector: '[slMenuHeader]',
  standalone: true,
  host: { 'data-part': 'header', 'data-part-header': '', '[attr.id]': 'id' },
})
export class SlMenuHeader {
  protected readonly id = `sl-menu-header-${Math.random().toString(36).slice(2, 8)}`;
  private readonly menu = inject(SlMenu);

  constructor() {
    this.menu.headerId.set(this.id);
    inject(DestroyRef).onDestroy(() => {
      if (this.menu.headerId() === this.id) this.menu.headerId.set(null);
    });
  }
}

/**
 * A set of items with a name. The label is inside the group and named by it,
 * because a heading outside one belongs to nothing a reader can hear.
 */
@Component({
  selector: 'sl-menu-group',
  standalone: true,
  exportAs: 'slMenuGroup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'group',
    'data-part-group': '',
    role: 'group',
    '[attr.aria-labelledby]': 'label() === undefined ? null : labelId',
  },
  template: `
    @if (label(); as words) {
      <div data-part="group-label" data-part-group-label="" [id]="labelId">{{ words }}</div>
    }
    <ng-content />
  `,
})
export class SlMenuGroup {
  readonly label = input<string | undefined>(undefined);
  protected readonly labelId = `sl-menu-group-${Math.random().toString(36).slice(2, 8)}`;
}

/** One value, chosen among the items inside it. */
@Component({
  selector: 'sl-menu-radio-group',
  standalone: true,
  exportAs: 'slMenuRadioGroup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'group', 'data-part-group': '', role: 'group' },
  template: '<ng-content />',
})
export class SlMenuRadioGroup {
  readonly value = model<string | undefined>(undefined);
  readonly valueChangeRequest = output<ChangeRequest<string>>();

  choose(next: string, reason: MenuValueReason, source: Event) {
    if (next === this.value()) return;
    const state = createControllable<string>({
      initial: this.value() ?? '',
      onRequest: (request) => this.valueChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.value.set(next);
  }
}

/** Not focusable and not interactive, which is what the pattern asks of it. */
@Directive({
  selector: 'hr[slMenuSeparator]',
  standalone: true,
  host: {
    'data-part': 'separator',
    'data-part-separator': '',
    role: 'separator',
    'aria-orientation': 'horizontal',
  },
})
export class SlMenuSeparator {}

/** What a menu whose items were all filtered away says instead of nothing. */
@Directive({
  selector: '[slMenuEmpty]',
  standalone: true,
  host: { 'data-part': 'empty', 'data-part-empty': '' },
})
export class SlMenuEmpty {}
