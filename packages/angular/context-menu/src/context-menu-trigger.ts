import { hostSelectorKey } from '@slotted/core/selector-key';
import type { PositionerAnchor } from '@slotted/core/positioner';
import {
  afterNextRender,
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
  numberAttribute,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { SlMenu } from '@slotted/angular/menu';

import { injectContextMenuDefaults } from './context-menu-defaults';

/** A rectangle with no size at the point the reader pressed. */
function pointAnchor(x: number, y: number): PositionerAnchor {
  const rect = new DOMRect(x, y, 0, 0);
  return { getBoundingClientRect: () => rect };
}

/** Past this many pixels a held finger is a scroll, not a press. */
const MOVEMENT_THRESHOLD = 10;

/**
 * The window after a keyboard opening in which a `contextmenu` event is the
 * one Windows fires for the key rather than a second press.
 */
const KEYBOARD_ECHO = 300;

/**
 * The target of a context menu: the region a secondary click, a long press or
 * `Shift+F10` opens an `sl-menu` on.
 *
 * It is written on the consumer's own element — a row, a card, a canvas — and
 * it is the family's one part: the menu it opens is `sl-menu`, imported as it
 * is, the way `sl-menubar` holds its menus. The state is the menu's `[(open)]`
 * and this component only asks it to move, so there is no second owner.
 *
 * A component rather than a directive, as `slMenuItem` and `slLink` are,
 * because a component is what can carry `styleUrl`: this is where the family's
 * authored stylesheet enters an Angular application.
 *
 * It writes no `aria-haspopup`, which is not permitted on a generic element,
 * and no `tabindex`, which would add a tab stop to every wrapped region. A
 * target the consumer made focusable can be opened from the keyboard.
 */
@Component({
  selector: '[slContextMenuTriggerFor]',
  standalone: true,
  exportAs: 'slContextMenuTrigger',
  template: '<ng-content />',
  styleUrl: '../../../styles/src/context-menu/context-menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[attr.data-ui]': 'ui',
    '[attr.data-part]': 'part',
    '[attr.id]': 'id',
    '[attr.data-open]': 'menu().isOpen() ? "" : null',
    '[attr.data-pressed]': 'pressed() ? "" : null',
    '[attr.data-disabled]': 'menu().resolvedDisabled() ? "" : null',
    '(contextmenu)': 'onContextMenu($event)',
    '(keydown)': 'onKeyDown($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'cancelPress()',
    '(pointercancel)': 'cancelPress()',
  },
})
export class SlContextMenuTrigger {
  /** The menu this target opens. */
  readonly menu = input.required<SlMenu>({ alias: 'slContextMenuTriggerFor' });

  readonly longPress = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (given) => (given === undefined ? undefined : booleanAttribute(given)),
  });
  readonly longPressDelay = input<number | undefined, number | string | undefined>(undefined, {
    transform: (given) => (given === undefined ? undefined : numberAttribute(given)),
  });

  private readonly element: HTMLElement = inject(ElementRef).nativeElement;
  private readonly defaults = injectContextMenuDefaults();

  /**
   * Two directives on one element write host attributes into the same slot,
   * and a host that already carries a part — a `slTableRow` — keeps it: the
   * rule `menu-trigger.ts` records, read from the other side.
   */
  private readonly writtenUi = inject(new HostAttributeToken('data-ui'), { optional: true });
  private readonly writtenPart = inject(new HostAttributeToken('data-part'), { optional: true });
  private readonly writtenId = inject(new HostAttributeToken('id'), { optional: true });

  protected readonly ui = hostSelectorKey(this.element, 'ui', this.writtenUi ?? 'context-menu');
  protected readonly part = hostSelectorKey(this.element, 'part', this.writtenPart ?? 'root');
  /** The menu names its surface after this element unless given `aria-label`. */
  protected get id(): string {
    return this.writtenId ?? this.menu().triggerId;
  }

  protected readonly pressed = signal(false);
  private press: { timer: ReturnType<typeof setTimeout>; x: number; y: number } | null = null;
  private openedByKeyboardAt = 0;

  protected readonly resolvedLongPress = computed(
    () => this.longPress() ?? this.defaults.longPress,
  );
  protected readonly resolvedLongPressDelay = computed(
    () => this.longPressDelay() ?? this.defaults.longPressDelay,
  );

  constructor() {
    const destroyRef = inject(DestroyRef);

    /* The menu is told which element is its trigger — the portal origin, the
       branch of the layer and the focus destination of last resort — as soon
       as the input resolves. */
    effect(() => {
      this.menu().trigger.set(this.element);
    });

    /**
     * The browser would draw its own menu over a secondary click on an item
     * of the family's. While the surface shows, `contextmenu` inside it is
     * prevented.
     */
    const guard = (event: Event) => {
      const menu = this.menu();
      const surface = menu.surface();
      if (!menu.isOpen() || surface === null) return;
      const layer = surface.parentElement ?? surface;
      if (event.target instanceof Node && layer.contains(event.target)) event.preventDefault();
    };
    afterNextRender(() => {
      this.element.ownerDocument.addEventListener('contextmenu', guard, true);
    });

    destroyRef.onDestroy(() => {
      this.cancelPress();
      this.element.ownerDocument.removeEventListener('contextmenu', guard, true);
    });
  }

  /**
   * Opens, or moves. The way back is captured now: the element that held focus
   * when the reader pressed, and the target itself when nothing did. While the
   * surface is already open the anchor moves and no request is emitted.
   */
  private openAt(anchor: PositionerAnchor | null, reason: 'pointer' | 'keyboard', source: Event) {
    const menu = this.menu();
    if (!menu.isOpen()) {
      const active = this.element.ownerDocument.activeElement;
      menu.finalFocus.set(
        active instanceof HTMLElement && active !== active.ownerDocument.body
          ? active
          : this.element,
      );
    }
    menu.anchor.set(anchor);
    menu.entry.current = 'first';
    menu.toggle(true, reason, source);
  }

  protected onContextMenu(source: Event) {
    const event = source as MouseEvent;
    if (this.menu().resolvedDisabled()) return;
    event.preventDefault();
    this.cancelPress();
    /* Windows fires `contextmenu` for the key the family already answered. */
    if (Date.now() - this.openedByKeyboardAt < KEYBOARD_ECHO) return;
    this.openAt(pointAnchor(event.clientX, event.clientY), 'pointer', event);
  }

  protected onKeyDown(source: Event) {
    const event = source as KeyboardEvent;
    if (this.menu().resolvedDisabled()) return;
    if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return;
    event.preventDefault();
    this.openedByKeyboardAt = Date.now();
    this.openAt(null, 'keyboard', event);
  }

  /**
   * A primary press on the target while the menu shows closes it: the target
   * is a branch of the layer, so the layer would not, and from the reader's
   * side the target is elsewhere. On touch and pen the same press may also be
   * the start of a long one.
   */
  protected onPointerDown(source: Event) {
    const event = source as PointerEvent;
    const menu = this.menu();
    if (menu.resolvedDisabled()) return;
    if (event.button === 0 && menu.isOpen()) menu.toggle(false, 'outsidePress', event);
    if (!this.resolvedLongPress() || event.pointerType === 'mouse' || event.button !== 0) return;

    this.cancelPress();
    const { clientX: x, clientY: y } = event;
    this.press = {
      x,
      y,
      timer: setTimeout(() => {
        this.press = null;
        this.pressed.set(false);
        this.openAt(pointAnchor(x, y), 'pointer', event);
      }, this.resolvedLongPressDelay()),
    };
    this.pressed.set(true);
  }

  protected onPointerMove(source: Event) {
    const event = source as PointerEvent;
    if (this.press === null) return;
    if (
      Math.hypot(event.clientX - this.press.x, event.clientY - this.press.y) > MOVEMENT_THRESHOLD
    ) {
      this.cancelPress();
    }
  }

  protected cancelPress() {
    if (this.press === null) return;
    clearTimeout(this.press.timer);
    this.press = null;
    this.pressed.set(false);
  }
}
