import { actionBarMessages } from '@slotted/core/i18n';
import { writeSelectorKey } from '@slotted/core/selector-key';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostAttributeToken,
  inject,
  Injector,
  input,
  ViewEncapsulation,
  viewChild,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlMenu, SlMenuSeparator, SlMenuTrigger } from '@slotted/angular/menu';
import type { MenuAlign, MenuSide, MenuSize } from '@slotted/angular/menu';

import { SlActionBar } from './action-bar';
import type { ActionBarOverflowLabel } from './action-bar';

/**
 * The control that opens what did not fit, and the surface holding it.
 *
 * It is `menu`'s own trigger and surface wearing this family's geometry, so the
 * keyboard, the dismissal and the focus return are `menu`'s and are not written
 * twice. What this family adds is the measurement: the bar decides which actions
 * give way, **by rank**, and the counterparts they declared are rendered here in
 * the order the bar holds them — with a separator wherever one of the bar's own
 * rules sits between two of them.
 *
 * The surface also holds every action ranked `always`, which was never drawn in
 * the bar at all. A reader opening the menu sees one list, so the two sources
 * are read together and in the bar's own order.
 *
 * The counterpart is an `ng-template` rendered through `NgTemplateOutlet` only
 * while its action is in the surface, so a menu item that is never reached
 * builds nothing. That is where the two bindings differ most, and it is idiom
 * rather than asymmetry: React's `ReactNode` is built with the element that
 * declares it, which is React's own answer and its own cost.
 *
 * **A template resolves its dependencies where it was written, not where it is
 * rendered.** The counterpart is authored beside the control it replaces, which
 * is outside the surface, so `slMenuItem` would look for the `SlMenu` above the
 * bar and find none. The outlet is therefore given an injector that provides the
 * surface this component draws.
 *
 * The host is `display: contents`, so the `button` below is a child of the run
 * itself: the part that carries the geometry has to be the box the bar lays out.
 *
 * **The `hidden` attribute on the trigger belongs to the bar.** `createCollapse`
 * writes it, because the same measurement that decides whether the control is
 * needed is the one that has to reveal it to read its width.
 */
@Component({
  selector: 'sl-action-bar-overflow',
  standalone: true,
  exportAs: 'slActionBarOverflow',
  imports: [NgTemplateOutlet, SlGlyph, SlIcon, SlMenu, SlMenuSeparator, SlMenuTrigger],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  template: `
    <button
      #trigger
      data-part="overflow"
      data-part-overflow=""
      type="button"
      [slMenuTriggerFor]="surface"
      [attr.aria-label]="name()"
    >
      <span slIcon><svg slGlyph name="ellipsis"></svg></span>
    </button>
    <sl-menu #surface [align]="align()" [side]="side()" [size]="size()">
      @for (unit of bar.surfaceUnits(); track unit.id) {
        @if (unit.separatorBefore) {
          <hr slMenuSeparator />
        }
        <ng-container *ngTemplateOutlet="bar.counterpart(unit.id)!; injector: surfaceInjector()" />
      }
    </sl-menu>
  `,
})
export class SlActionBarOverflow {
  /** Where the surface sits against the trigger. */
  readonly align = input<MenuAlign | undefined>(undefined);
  readonly side = input<MenuSide | undefined>(undefined);
  /** The surface's own measure, which is `menu`'s axis rather than the bar's. */
  readonly size = input<MenuSize | undefined>(undefined);
  /**
   * The accessible name. Defaults to a count — "3 more actions" — because the
   * mark says nothing about how much is behind it.
   */
  readonly label = input<ActionBarOverflowLabel | undefined>(undefined);

  protected readonly bar = inject(SlActionBar);

  /** The counted default, in the language in force. */
  private readonly t = injectMessages(actionBarMessages);
  /** A name the consumer wrote on the host survives the counted default. */
  private readonly stated = inject(new HostAttributeToken('aria-label'), { optional: true });

  protected readonly name = computed(() => {
    if (this.stated !== null) return this.stated;
    const given = this.label();
    const hidden = this.bar.surfaceUnits().length;
    if (typeof given === 'function') return given(hidden);
    if (given !== undefined) return given;
    return this.t('more', { count: hidden });
  });

  private readonly trigger = viewChild.required<ElementRef<HTMLElement>>('trigger');
  private readonly surface = viewChild(SlMenu);
  private readonly injector = inject(Injector);

  /**
   * `null` until the view exists, which is also while the surface holds nothing
   * and the outlet renders nothing.
   */
  protected readonly surfaceInjector = computed(() => {
    const menu = this.surface();
    if (menu === undefined) return null;
    return Injector.create({
      parent: this.injector,
      providers: [{ provide: SlMenu, useValue: menu }],
    });
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const element = this.trigger().nativeElement;

      /**
       * `slMenuTriggerFor` binds `[attr.data-part]` and resolves it to `null`
       * for a trigger that is neither a bar's item nor a submenu's, and a host
       * binding of `null` removes the attribute the author wrote. The part is
       * therefore written back after the first change detection, where nothing
       * writes over it again: the expression is a constant, so Angular applies
       * it once. `docs/build-briefing.md` records the rule; `toolbar` is where
       * it was learnt.
       */
      writeSelectorKey(element, 'part', 'overflow');

      /* The bar measures the control, so it has to hold it. */
      this.bar.registerTrigger(element);
    });
    destroyRef.onDestroy(() => this.bar.registerTrigger(null));
  }
}
