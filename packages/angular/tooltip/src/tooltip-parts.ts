import { writeSelectorKey } from '@slotted/core/selector-key';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import type { DismissableLayerHandle } from '@slotted/core/dismissable-layer';
import { createPortalRoot } from '@slotted/core/portal';
import type { PortalRootHandle } from '@slotted/core/portal';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceStatus } from '@slotted/core/presence';
import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  TemplateRef,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import type { EmbeddedViewRef } from '@angular/core';

import { SlTooltip } from './tooltip';
import { SLOTTED_PORTAL_CONTAINER } from './tooltip-defaults';

/**
 * The element the hint is about.
 *
 * The directive goes on the consumer's own control, which is what this
 * ecosystem composes with. It writes the ARIA relationship and `data-open` and
 * **no `data-part`**: `data-part` names a part of the family that owns the
 * element, and sixteen stylesheets in this repository key on
 * `[data-part='root']`, so claiming a `slBadge` or a `slCheckbox` used as a
 * trigger would unstyle it and nothing would report it.
 *
 * A control the page disabled with the native attribute fires no pointer events
 * at all, so the one explanation of why it is disabled would be unreachable.
 * The reference page shows the two shapes that work: `aria-disabled` on a
 * control that stays focusable, or a wrapping element carrying the trigger.
 */
@Directive({
  selector: '[slTooltipTrigger]',
  standalone: true,
  exportAs: 'slTooltipTrigger',
  host: {
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.data-open]': "tooltip.isOpen() ? '' : null",
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'onPointerLeave($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerRelease()',
    '(pointercancel)': 'onPointerRelease()',
    '(focus)': 'onFocus($event)',
    '(blur)': 'onBlur($event)',
    '(click)': 'onClick($event)',
  },
})
export class SlTooltipTrigger {
  protected readonly tooltip = inject(SlTooltip);
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;
  private holding = false;

  /**
   * Named by the layer under `label`, described by it otherwise. Under `none`
   * the trigger references nothing: it already says the words.
   */
  private readonly names = computed(
    () =>
      this.tooltip.resolvedDescribes() !== 'none' &&
      (this.tooltip.isOpen() || this.tooltip.resolvedDescribes() === 'label'),
  );
  protected readonly describedBy = computed(() =>
    this.names() && this.tooltip.resolvedDescribes() === 'description'
      ? this.tooltip.contentId
      : null,
  );
  protected readonly labelledBy = computed(() =>
    this.names() && this.tooltip.resolvedDescribes() === 'label' ? this.tooltip.contentId : null,
  );

  constructor() {
    this.tooltip.triggerNode.set(this.native);
    inject(DestroyRef).onDestroy(() => this.tooltip.triggerNode.set(null));
  }

  protected onPointerEnter(event: PointerEvent) {
    if (this.tooltip.resolvedOpenOn() !== 'hover' || event.pointerType === 'touch') return;
    this.tooltip.openAfterDelay(event);
  }

  protected onPointerLeave(event: PointerEvent) {
    this.holding = false;
    if (this.tooltip.resolvedOpenOn() === 'manual') return;
    this.tooltip.closeAfterDelay(event);
  }

  protected onPointerDown(event: PointerEvent) {
    if (event.pointerType === 'touch') {
      this.holding = true;
      this.tooltip.pressAndHold(event);
      return;
    }
    if (this.tooltip.resolvedCloseOnPress() && this.tooltip.isOpen()) {
      this.tooltip.toggle(false, 'pointer', event);
    }
  }

  protected onPointerRelease() {
    if (!this.holding) return;
    this.holding = false;
    this.tooltip.cancelPending();
  }

  /**
   * `:focus-visible` rather than every focus. A pointer press focuses a button
   * too, and a tooltip opened by it would arrive before the delay it was given
   * and stay after the press that was meant to dismiss it.
   */
  protected onFocus(event: FocusEvent) {
    if (this.tooltip.resolvedOpenOn() === 'manual') return;
    if (!this.native.matches(':focus-visible')) return;
    this.tooltip.toggle(true, 'keyboard', event);
  }

  protected onBlur(event: FocusEvent) {
    if (this.tooltip.resolvedOpenOn() === 'manual') return;
    this.tooltip.toggle(false, 'blur', event);
  }

  /**
   * A click synthesised by the keyboard reports no detail; a real one reports
   * the click count. It is how `Enter` and `Space` are told from a press
   * without a key listener existing for either.
   */
  protected onClick(event: MouseEvent) {
    if (!this.tooltip.resolvedCloseOnPress() || !this.tooltip.isOpen()) return;
    this.tooltip.toggle(false, event.detail === 0 ? 'keyboard' : 'pointer', event);
  }
}

/**
 * The positioned layer, built from a template rather than from an element.
 *
 * `mount="active"` means the layer exists only while it is open, and a
 * component cannot remove its own host element — so the consumer writes an
 * `ng-template` and this directive builds the layer around the stamped view.
 * It is the shape `ng-template[slCollapsibleContent]` already uses here, and
 * Angular Material's `matExpansionPanelContent` before it.
 *
 * The element it builds is what `packages/core/src/positioner` writes
 * `position`, `left` and `top` onto, and the one that scales and fades; its
 * padding is the gap the pointer crosses onto a hoverable tooltip.
 */
@Directive({
  selector: 'ng-template[slTooltipLayer]',
  standalone: true,
  exportAs: 'slTooltipLayer',
})
export class SlTooltipLayer {
  private readonly tooltip = inject(SlTooltip);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly comment: Comment = this.viewContainer.element.nativeElement;
  /**
   * Angular's server document is not the page. There the layer stays where the
   * template wrote it, as React's server markup has it, and nothing measures,
   * stacks or moves it into a portal.
   */
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  /** Where the arrow stood in the layer while `arrow` is false. */
  private arrowPlace: Comment | null = null;

  /**
   * A signal rather than a field, and the reason is a defect the first spec run
   * found: the effects that place, stack and paint the layer all read it, and
   * with a plain field none of them re-ran when `build()` filled it in a later
   * flush. The layer existed and carried no attribute the stylesheet reads.
   */
  private readonly layerNode = signal<HTMLElement | null>(null);
  private view: EmbeddedViewRef<unknown> | null = null;
  private portal: PortalRootHandle | null = null;
  private positioner: PositionerHandle | null = null;
  private dismissable: DismissableLayerHandle | null = null;
  private releaseBridge: (() => void) | null = null;

  private readonly status = signal<PresenceStatus>('unmounted');
  private readonly positioned = signal(false);
  private readonly presence = createPresence({
    present: false,
    onStatusChange: (next) => this.status.set(next),
  });

  /**
   * `active` drops the layer after the exit, `lazy` keeps it once it has been
   * open, `eager` never removes it — which is what `describes="label"` forces,
   * because an accessible name has to exist before it is read.
   */
  readonly mounted = computed(() => {
    const mount = this.tooltip.resolvedMount();
    if (mount === 'eager') return true;
    if (mount === 'lazy') return this.tooltip.seen();
    return this.status() !== 'unmounted';
  });

  constructor() {
    /* Injected for its side effect: the factory of
       `provideSlottedPortalContainer` names the document's portal container,
       and runs only when something asks for its token — before the first layer
       asks `createPortalRoot` for a container. */
    inject(SLOTTED_PORTAL_CONTAINER, { optional: true });
    effect(() => this.presence.sync(this.tooltip.isOpen()));
    effect(() => (this.mounted() ? this.build() : this.teardown()));
    effect(() => this.place());
    effect(() => this.stack());
    effect(() => this.paint());

    inject(DestroyRef).onDestroy(() => {
      this.presence.destroy();
      this.teardown();
    });
  }

  /** Measures and places the layer again. The imperative action of this part. */
  reposition() {
    void this.positioner?.update();
  }

  private build() {
    if (this.layerNode() !== null) return;

    const document = this.comment.ownerDocument;
    const layer = document.createElement('div');
    writeSelectorKey(layer, 'ui', 'tooltip');
    writeSelectorKey(layer, 'part', 'root');

    const view = this.viewContainer.createEmbeddedView(this.template);
    view.detectChanges();
    for (const node of view.rootNodes as Node[]) layer.appendChild(node);

    const portal = this.browser
      ? createPortalRoot({
          origin: this.tooltip.triggerNode(),
          disabled: !this.tooltip.resolvedPortal(),
        })
      : null;
    const container = portal?.container ?? this.comment.parentNode;
    if (container === this.comment.parentNode) container?.insertBefore(layer, this.comment);
    else container?.appendChild(layer);

    this.view = view;
    this.portal = portal;
    this.releaseBridge = bindHoverBridge(layer, this.tooltip);
    this.presence.setNode(layer);
    this.layerNode.set(layer);
  }

  private teardown() {
    this.releaseBridge?.();
    this.releaseBridge = null;
    this.positioner?.destroy();
    this.positioner = null;
    this.dismissable?.destroy();
    this.dismissable = null;
    this.presence.setNode(null);
    this.layerNode()?.remove();
    this.layerNode.set(null);
    this.view?.destroy();
    this.view = null;
    this.portal?.release();
    this.portal = null;
    this.arrowPlace = null;
    this.positioned.set(false);
  }

  /** Rebuilt whenever an option it was created with changes. */
  private place() {
    const layer = this.layerNode();
    const anchor = this.tooltip.triggerNode();
    const options = {
      align: this.tooltip.resolvedAlign(),
      alignOffset: this.tooltip.resolvedAlignOffset(),
      boundaryPadding: this.tooltip.resolvedCollisionPadding(),
      flip: this.tooltip.resolvedFlip(),
      hideWhenDetached: this.tooltip.resolvedHideWhenDetached(),
      shift: this.tooltip.resolvedShift(),
      side: this.tooltip.resolvedSide(),
      sideOffset: this.tooltip.resolvedSideOffset(),
      strategy: this.tooltip.resolvedStrategy(),
    };
    const arrow = this.tooltip.resolvedArrow() ? this.tooltip.arrowNode() : null;

    this.positioner?.destroy();
    this.positioner = null;
    if (layer === null || anchor === null || !this.browser) return;

    this.positioner = createPositioner(anchor, layer, {
      ...options,
      ...(arrow ? { arrow, arrowPadding: this.tooltip.resolvedArrowPadding() } : {}),
    });
    /* `data-open` is written on the element in the task that opened the tip,
       with the position, rather than by the effect on the next check. */
    void this.positioner.update().then(() => {
      if (this.tooltip.isOpen()) layer.setAttribute('data-open', '');
      this.positioned.set(true);
    });
  }

  /**
   * The layer joins the single stack only while it is open, so its depth is its
   * real position among the layers a reader has opened. Escape reaches the
   * topmost layer alone; the trigger is a branch, so pressing it is not an
   * outside press and the family closes on it deliberately instead.
   */
  private stack() {
    const layer = this.layerNode();
    const open = this.tooltip.isOpen();
    const trigger = this.tooltip.triggerNode();

    this.dismissable?.destroy();
    this.dismissable = null;
    if (layer === null || !open || !this.browser) return;

    this.dismissable = createDismissableLayer(layer, {
      escape: true,
      focusOutside: false,
      modal: false,
      outsidePress: true,
      scrollLock: false,
      ...(trigger ? { branches: [trigger] } : {}),
      onDismiss: (request) => {
        this.tooltip.toggle(
          false,
          request.reason === 'escape' ? 'escape' : 'pointer',
          request.source,
        );
      },
    });
  }

  /** Every attribute the stylesheet reads, and the two listeners hoverable needs. */
  private paint() {
    const layer = this.layerNode();
    if (layer === null) return;

    layer.setAttribute('data-align', this.tooltip.resolvedAlign());
    layer.setAttribute('data-size', this.tooltip.resolvedSize());
    layer.setAttribute('data-variant', this.tooltip.resolvedVariant());
    toggleAttribute(layer, 'data-hoverable', this.tooltip.resolvedHoverable());
    toggleAttribute(layer, 'data-open', this.tooltip.isOpen() && this.positioned());
    this.showArrow(layer);
  }

  /**
   * The arrow is the consumer's element inside the template, so under
   * `arrow="false"` the layer takes it out — React's arrow renders nothing
   * then — and puts it back in the same place under `true`.
   */
  private showArrow(layer: HTMLElement) {
    const arrow = this.tooltip.arrowNode();
    if (arrow === null) return;
    if (this.tooltip.resolvedArrow()) {
      this.arrowPlace?.replaceWith(arrow);
      this.arrowPlace = null;
      return;
    }
    if (this.arrowPlace !== null || !layer.contains(arrow)) return;
    this.arrowPlace = layer.ownerDocument.createComment('');
    arrow.replaceWith(this.arrowPlace);
  }
}

function toggleAttribute(element: HTMLElement, name: string, present: boolean) {
  if (present) element.setAttribute(name, '');
  else element.removeAttribute(name);
}

/**
 * The painted surface, and the element the trigger's ARIA relationship names.
 *
 * It is the one part written as a component, because a component is what can
 * carry `styleUrl`: this is where the family's single authored stylesheet
 * enters an Angular application, exactly as every other family here does it.
 */
@Component({
  selector: '[slTooltipContent]',
  standalone: true,
  exportAs: 'slTooltipContent',
  template: '<ng-content />',
  styleUrl: '../../../styles/src/tooltip/tooltip.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'content',
    'data-part-content': '',
    role: 'tooltip',
    '[attr.id]': 'tooltip.contentId',
    '[attr.aria-hidden]': 'hidden()',
  },
})
export class SlTooltipContent {
  protected readonly tooltip = inject(SlTooltip);

  /** Hidden from the reader under `none`, which is a hint shown and not read. */
  protected readonly hidden = computed(() =>
    this.tooltip.resolvedDescribes() === 'none' ? true : null,
  );
}

/**
 * The mark that points at the anchor. The family draws it; the positioner
 * measures it and says where it goes. It is hidden from assistive technology,
 * because it is decoration a reader has no use for.
 */
@Directive({
  selector: '[slTooltipArrow]',
  standalone: true,
  exportAs: 'slTooltipArrow',
  host: {
    'data-part': 'arrow',
    'data-part-arrow': '',
    'aria-hidden': 'true',
  },
})
export class SlTooltipArrow {
  constructor() {
    const tooltip = inject(SlTooltip);
    const native: HTMLElement = inject(ElementRef).nativeElement;
    tooltip.arrowNode.set(native);
    inject(DestroyRef).onDestroy(() => tooltip.arrowNode.set(null));
  }
}

/**
 * The layer's own pointer handlers, written on the layer element rather than
 * bound by a directive, because the element is built here rather than by the
 * consumer. Entering the layer cancels the pending close; leaving it starts one
 * again, which is the whole of `hoverable`.
 */
function bindHoverBridge(layer: HTMLElement, tooltip: SlTooltip): () => void {
  const enter = () => {
    if (tooltip.resolvedHoverable()) tooltip.cancelPending();
  };
  const leave = (event: PointerEvent) => {
    if (tooltip.resolvedHoverable()) tooltip.closeAfterDelay(event);
  };
  layer.addEventListener('pointerenter', enter);
  layer.addEventListener('pointerleave', leave);
  return () => {
    layer.removeEventListener('pointerenter', enter);
    layer.removeEventListener('pointerleave', leave);
  };
}
