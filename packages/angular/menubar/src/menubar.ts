import { createRovingTabindex } from '@slotted/core/focus';
import type { RovingTabindexHandle } from '@slotted/core/focus';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { createTypeahead, isPrintable } from '@slotted/core/typeahead';
import type { TypeaheadHandle } from '@slotted/core/typeahead';
import { MENUBAR_SURFACE } from '@slotted/angular/menu';
import type { MenubarSurface, MenuOpenReason, MenuSize } from '@slotted/angular/menu';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  forwardRef,
  inject,
  input,
  model,
  output,
  ViewEncapsulation,
} from '@angular/core';

import { injectMenubarDefaults } from './menubar-defaults';
import type { MenubarOrientation } from './menubar-defaults';

export type { MenubarDefaults, MenubarOrientation } from './menubar-defaults';

const TRIGGER_SELECTOR = "[data-part='trigger']";

/**
 * A row of triggers with one tab stop, each opening a `menu`.
 *
 * The bar holds which menu is open and nothing else: every part inside it
 * belongs to the `menu` family and is imported from `@slotted/angular/menu`.
 * The CDK's menubar and Radix's each restate the whole menu API a second time,
 * which is two copies of one machine and one place for a later capability to go
 * missing.
 */
@Component({
  selector: 'sl-menubar',
  standalone: true,
  exportAs: 'slMenubar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: '../../../styles/src/menubar/menubar.css',
  template: '<ng-content />',
  host: {
    'data-ui': 'menubar',
    'data-ui-menubar': '',
    'data-part': 'root',
    'data-part-root': '',
    role: 'menubar',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-size]': 'size()',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.aria-disabled]': 'disabled() ? true : null',
    '[attr.aria-orientation]': 'ariaOrientation()',
    '(keydown)': 'onKeyDown($event)',
  },
  providers: [{ provide: MENUBAR_SURFACE, useExisting: forwardRef(() => SlMenubar) }],
})
export class SlMenubar implements MenubarSurface {
  /**
   * The menu now open, named by its own `value`. A bar has at most one, so its
   * state is that name rather than a boolean on each menu — the one model that
   * cannot represent two open menus at once.
   */
  readonly value = model<string | undefined>(undefined);
  /** One output for one transition, carrying the reason and the event. */
  readonly valueChangeRequest = output<ChangeRequest<string>>();

  /**
   * The inputs a consumer writes are stated as they are written and read as
   * what they resolve to: `orientation()`, `size()` and `disabled()` answer the
   * bar's actual decision, which is what a menu on the bar reads through
   * `MENUBAR_SURFACE`. The inputs stay public: a template binding to a
   * protected input fails a consumer's strict template check.
   */
  readonly orientationInput = input<MenubarOrientation | undefined>(undefined, {
    alias: 'orientation',
  });
  readonly sizeInput = input<MenuSize | undefined>(undefined, { alias: 'size' });
  readonly disabledInput = input(undefined, {
    alias: 'disabled',
    transform: (given: boolean | string | undefined) =>
      given === undefined ? undefined : booleanAttribute(given),
  });
  readonly loop = input(undefined, {
    transform: (given: boolean | string | undefined) =>
      given === undefined ? undefined : booleanAttribute(given),
  });
  readonly typeahead = input(undefined, {
    transform: (given: boolean | string | undefined) =>
      given === undefined ? undefined : booleanAttribute(given),
  });

  private readonly defaults = injectMenubarDefaults();
  private readonly element: HTMLElement = inject(ElementRef).nativeElement;
  private readonly registry = new Map<string, HTMLElement>();
  private typeaheadHandle: TypeaheadHandle | null = null;

  /** Where focus goes when the bar opens one of its menus. */
  readonly entry: { current: 'first' | 'last' | 'trigger' } = { current: 'first' };

  readonly orientation = computed(() => this.orientationInput() ?? this.defaults.orientation);
  readonly size = computed(() => this.sizeInput() ?? this.defaults.size);
  readonly disabled = computed(() => this.disabledInput() ?? this.defaults.disabled);
  readonly resolvedLoop = computed(() => this.loop() ?? this.defaults.loop);
  readonly resolvedTypeahead = computed(() => this.typeahead() ?? this.defaults.typeahead);

  protected readonly ariaOrientation = computed(() =>
    this.orientation() === 'vertical' ? 'vertical' : null,
  );

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      /**
       * One tab stop for the whole bar, and the trigger the reader last left.
       * Moving along a bar that already has a menu open switches menus, which
       * is what makes it a bar rather than a row of buttons.
       */
      const tabindex: RovingTabindexHandle = createRovingTabindex(this.element, {
        includeAriaDisabled: true,
        itemSelector: TRIGGER_SELECTOR,
        loop: () => this.resolvedLoop(),
        orientation: () => this.orientation(),
        onMove: (_index, trigger) => {
          if (this.value() === undefined) return;
          this.entry.current = 'trigger';
          this.move(this.nameOf(trigger), 'keyboard');
        },
      });

      /* A menu arriving or leaving has to reach the tab stop, and the DOM is
         the one thing the two bindings agree on. */
      const observer = new MutationObserver(() => tabindex.refresh());
      observer.observe(this.element, { childList: true, subtree: true });

      if (this.resolvedTypeahead()) this.typeaheadHandle = createTypeahead();

      destroyRef.onDestroy(() => {
        observer.disconnect();
        tabindex.destroy();
        this.typeaheadHandle?.destroy();
      });
    });
  }

  /** Opens the menu that answers to this name. */
  open(value: string, reason: MenuOpenReason, source?: Event) {
    this.move(value, reason, source);
  }

  close(reason: MenuOpenReason, source?: Event) {
    this.move(undefined, reason, source);
  }

  register(value: string, trigger: HTMLElement | null) {
    if (trigger === null) this.registry.delete(value);
    else this.registry.set(value, trigger);
  }

  /**
   * The pattern's three-step rule for the inline axis: close what is open, move
   * to the neighbouring trigger, and open its menu. Focus stays on the trigger
   * — the recommended half of the pattern's choice — so the next arrow keeps
   * moving along the bar rather than walking into a list nobody asked for.
   */
  step(direction: 1 | -1, options?: { open?: boolean }) {
    const list = this.triggers();
    if (list.length === 0) return;

    const active = this.element.ownerDocument.activeElement;
    const held = this.value();
    const from = list.findIndex((trigger) => trigger === active || this.nameOf(trigger) === held);
    const index = from === -1 ? 0 : from + direction;
    const wrapped = this.resolvedLoop()
      ? (index + list.length) % list.length
      : Math.min(Math.max(index, 0), list.length - 1);

    const next = list[wrapped];
    if (next === undefined) return;
    next.focus({ preventScroll: true });
    if (options?.open === true) {
      this.entry.current = 'trigger';
      this.move(this.nameOf(next), 'keyboard');
    }
  }

  private triggers(): HTMLElement[] {
    return [...this.element.querySelectorAll<HTMLElement>(TRIGGER_SELECTOR)];
  }

  private nameOf(trigger: HTMLElement | undefined): string | undefined {
    if (trigger === undefined) return undefined;
    for (const [name, candidate] of this.registry) if (candidate === trigger) return name;
    return undefined;
  }

  private move(next: string | undefined, reason: MenuOpenReason, source?: Event) {
    if (next === this.value()) return;

    let cancelled = false;
    const state = createControllable<string>({
      initial: this.value() ?? '',
      onRequest: (request) => {
        this.valueChangeRequest.emit(request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next ?? '', reason, source);
    if (cancelled) return;
    if (moved) this.value.set(next);
  }

  /** The pattern asks for typeahead on a menubar as well as inside a menu. */
  protected onKeyDown(event: KeyboardEvent) {
    const handle = this.typeaheadHandle;
    if (handle === null) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (!isPrintable(event.key, handle.query.length > 0)) return;

    const list = this.triggers();
    const from = list.findIndex((trigger) => trigger === event.target);
    const index = handle.match(
      event.key,
      list.map((trigger) => trigger.textContent?.trim() ?? ''),
      from,
    );
    if (index === -1) return;

    event.preventDefault();
    const trigger = list[index];
    trigger?.focus({ preventScroll: true });
    if (this.value() === undefined) return;
    this.entry.current = 'trigger';
    this.move(this.nameOf(trigger), 'keyboard');
  }
}
