import { writeSelectorKey } from '@slotted/core/selector-key';
import { createPointerIntent } from '@slotted/core/pointer-intent';
import type { PointerIntentHandle } from '@slotted/core/pointer-intent';
import { computed, DestroyRef, Directive, effect, ElementRef, inject, input } from '@angular/core';

import { SlMenu } from './menu';
import { MENUBAR_SURFACE } from './menu-context';
import { SlMenuItem } from './menu-items';

/**
 * The control that opens a menu.
 *
 * It is put on the consumer's own control — `@slotted/angular` composes with a
 * directive where React composes with a `render` prop, because that is what
 * each ecosystem writes. The three places it can sit decide what it becomes: a
 * plain control on its own, one of a bar's `menuitem`s inside `sl-menubar`, and
 * an item of the surface above when the control also carries `slMenuItem`.
 */
@Directive({
  selector: '[slMenuTriggerFor]',
  standalone: true,
  exportAs: 'slMenuTrigger',
  host: {
    '[attr.aria-haspopup]': '"menu"',
    '[attr.aria-expanded]': 'menu().isOpen()',
    '[attr.aria-controls]': 'menu().isOpen() ? menu().contentId : null',
    '[attr.id]': 'menu().triggerId',
    '[attr.type]': 'isButton ? "button" : null',
    '[attr.data-open]': 'menu().isOpen() ? "" : null',
    '[attr.data-disabled]': 'menu().resolvedDisabled() ? "" : null',
    '[attr.aria-disabled]': 'menu().resolvedDisabled() ? true : null',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeyDown($event)',
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'onPointerLeave($event)',
  },
})
export class SlMenuTrigger {
  /** The menu this control opens. */
  readonly menu = input.required<SlMenu>({ alias: 'slMenuTriggerFor' });

  private readonly element: HTMLElement = inject(ElementRef).nativeElement;
  private readonly bar = inject(MENUBAR_SURFACE, { optional: true });
  /** The surface above, when this control is an item of one. */
  private readonly item = inject(SlMenuItem, { optional: true, self: true });
  private readonly parent = inject(SlMenu, { optional: true });

  protected readonly isButton = this.element.tagName === 'BUTTON';
  protected readonly onBar = this.parent === null && this.bar !== null;

  private timer: ReturnType<typeof setTimeout> | undefined;
  private intent: PointerIntentHandle | null = null;

  private readonly isSubmenu = computed(() => this.parent !== null);

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.item?.opensSubmenu.set(true);
    /* The trigger binds no `data-part` and no `role`. Two directives binding one
       attribute on one element race, and the order they run in is the
       compiler's: a `null` erased the part `slMenuItem` writes on a submenu's
       trigger, and the attribute's first value overwrote the `menu-trigger` part
       the split button binds. On a plain control both stay the control's own, so
       `slButton` stays the root of its family; on a submenu's item they are
       `slMenuItem`'s; only a bar's trigger takes them from here, written once
       because a bar's trigger is the bar's own element. */
    if (this.onBar) {
      writeSelectorKey(this.element, 'part', 'trigger');
      this.element.setAttribute('role', 'menuitem');
    }

    /* The menu is told which control anchors it, and a bar is told which
       trigger answers to which menu, both as soon as the input resolves. */
    effect(() => {
      const menu = this.menu();
      menu.trigger.set(this.element);
      if (!this.onBar || this.bar === null) return;
      this.bar.register(menu.name(), this.element);
    });

    destroyRef.onDestroy(() => {
      this.cancelPending();
      if (this.onBar && this.bar !== null) this.bar.register(this.menu().name(), null);
    });
  }

  private cancelPending() {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
    this.intent?.destroy();
    this.intent = null;
  }

  private openWith(entry: 'first' | 'last', reason: 'pointer' | 'keyboard', source: Event) {
    const menu = this.menu();
    menu.entry.current = entry;
    menu.toggle(true, reason, source);
  }

  protected onClick(event: Event) {
    const menu = this.menu();
    if (menu.resolvedDisabled()) return;
    /* A submenu already open stays open under a press: the press is how a
       reader on a touch screen reaches it, not how they close it. */
    if (menu.isOpen() && this.isSubmenu()) return;
    menu.entry.current = 'first';
    menu.toggle(!menu.isOpen(), 'pointer', event);
  }

  protected onKeyDown(source: Event) {
    const event = source as KeyboardEvent;
    const menu = this.menu();
    if (menu.resolvedDisabled()) return;

    const direction = getComputedStyle(this.element).direction === 'rtl' ? 'rtl' : 'ltr';
    const inlineEnd = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const vertical = this.bar?.orientation() === 'vertical';

    /* On a bar the block axis opens the menu and the inline axis moves along
       the bar; on a vertical bar the two exchange places, which is the swap the
       pattern's fifth note describes. A submenu's item opens on the inline end
       in both, because that is where the submenu is. */
    const opensDown = !this.isSubmenu() && (!this.onBar || !vertical) && event.key === 'ArrowDown';
    const opensUp = !this.isSubmenu() && (!this.onBar || !vertical) && event.key === 'ArrowUp';
    const opensInline = event.key === inlineEnd && (this.isSubmenu() || (this.onBar && vertical));

    if (opensDown || opensInline) {
      event.preventDefault();
      event.stopPropagation();
      this.openWith('first', 'keyboard', event);
      return;
    }
    if (opensUp) {
      event.preventDefault();
      this.openWith('last', 'keyboard', event);
      return;
    }
    if (this.isSubmenu() && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      event.stopPropagation();
      this.openWith('first', 'keyboard', event);
    }
  }

  /**
   * Hover opens a submenu, and opens a bar's menu only once the bar already has
   * one open: moving the pointer along a closed bar opens nothing, and along an
   * open one switches menus.
   */
  protected onPointerEnter(event: Event) {
    const menu = this.menu();
    if (menu.resolvedDisabled()) return;
    this.cancelPending();

    if (this.isSubmenu()) {
      if (!menu.resolvedOpenOnHover() || menu.isOpen()) return;
      this.timer = setTimeout(
        () => this.openWith('first', 'pointer', event),
        menu.resolvedSubmenuOpenDelay(),
      );
      return;
    }

    if (this.onBar && this.bar !== null && this.bar.value() !== undefined) {
      if (this.bar.value() === menu.name()) return;
      this.element.focus({ preventScroll: true });
      this.openWith('first', 'pointer', event);
    }
  }

  /**
   * The grace area: the submenu stays open while the pointer's own path still
   * points into it, so the diagonal from this item to the surface may cross
   * three items it has no interest in.
   */
  protected onPointerLeave(event: Event) {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    const menu = this.menu();
    if (!this.isSubmenu() || !menu.isOpen()) return;

    const surface = menu.surface();
    if (surface === null) return;

    this.intent?.destroy();
    this.intent = createPointerIntent({
      target: () => surface.getBoundingClientRect(),
      origin: () => this.element.getBoundingClientRect(),
      timeout: menu.resolvedSubmenuCloseDelay(),
      onSettled: () => {
        if (this.element.matches(':hover') || surface.matches(':hover')) return;
        menu.toggle(false, 'pointer', event);
      },
    });
  }
}
