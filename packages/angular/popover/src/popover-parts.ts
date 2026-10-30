import { writeSelectorKey } from '@slotted/core/selector-key';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import type { DismissableLayerHandle } from '@slotted/core/dismissable-layer';
import { createPortalRoot } from '@slotted/core/portal';
import type { PortalRootHandle } from '@slotted/core/portal';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceStatus } from '@slotted/core/presence';
import {
  afterEveryRender,
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  signal,
  TemplateRef,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import type { EmbeddedViewRef } from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { SlPopover } from './popover';
import type {
  PopoverAlign,
  PopoverFocusTarget,
  PopoverSide,
  PopoverWidth,
} from './popover-defaults';

/** An element, or a selector read inside the panel. */
function resolveFocus(
  target: PopoverFocusTarget | undefined,
  scope: HTMLElement | null,
): HTMLElement | null {
  if (target === undefined) return null;
  if (typeof target === 'string') return scope?.querySelector<HTMLElement>(target) ?? null;
  return target as HTMLElement;
}

/**
 * How far the layer moves along its alignment axis so the panel's edge, not
 * the layer's, meets the anchor's. The layer's padding is the gap around the
 * panel, the same on every side, so a layer aligned to the anchor's start edge
 * leaves the panel one gap inside it. A centred layer needs nothing, and
 * neither does one as wide as its anchor, which the positioner centres.
 */
function alignInset(
  layer: HTMLElement,
  side: PopoverSide,
  align: PopoverAlign,
  width: PopoverWidth,
): number {
  if (align === 'center') return 0;
  if (width === 'anchor' && (side === 'top' || side === 'bottom')) return 0;
  const style = layer.ownerDocument.defaultView?.getComputedStyle(layer);
  const gap = Number.parseFloat(style?.paddingTop ?? '') || 0;
  return align === 'start' ? -gap : gap;
}

/**
 * The control that opens the panel.
 *
 * The directive goes on the consumer's own control — a `button`, which is what
 * gives `Enter` and `Space` for free. It carries the wiring and `data-open`,
 * and **no `data-part`**: a trigger is very often another family's root, and
 * claiming it would unstyle that family.
 */
@Directive({
  selector: '[slPopoverTrigger]',
  standalone: true,
  exportAs: 'slPopoverTrigger',
  host: {
    '[attr.aria-controls]': 'popover.contentNode() !== null ? popover.contentId : null',
    '[attr.aria-expanded]': 'popover.isOpen()',
    'aria-haspopup': 'dialog',
    '[attr.data-open]': "popover.isOpen() ? '' : null",
  },
})
export class SlPopoverTrigger implements AfterViewInit {
  protected readonly popover = inject(SlPopover);
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.popover.triggerNode.set(this.native);
    this.destroyRef.onDestroy(() => this.popover.triggerNode.set(null));
  }

  /**
   * After the view, not as a host listener. A `(click)` the consumer wrote on
   * the same element is bound when the view is created, so a listener bound any
   * earlier runs first and reads `defaultPrevented` before the consumer has had
   * the chance to set it — the order `slIconButton` records.
   */
  ngAfterViewInit() {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      const reason = event.detail === 0 ? 'keyboard' : 'pointer';
      this.popover.toggle(!this.popover.isOpen(), reason, event);
    };
    this.native.addEventListener('click', onClick);
    this.destroyRef.onDestroy(() => this.native.removeEventListener('click', onClick));
  }
}

/**
 * What the panel points at, when that is not the button that opened it — a row
 * whose action menu hangs off the row rather than off its own control. It
 * carries no attributes: it is only measured.
 */
@Directive({
  selector: '[slPopoverAnchor]',
  standalone: true,
  exportAs: 'slPopoverAnchor',
})
export class SlPopoverAnchor {
  constructor() {
    const popover = inject(SlPopover);
    const native: HTMLElement = inject(ElementRef).nativeElement;
    popover.anchorNode.set(native);
    inject(DestroyRef).onDestroy(() => popover.anchorNode.set(null));
  }
}

/**
 * The positioned layer, built from a template rather than from an element, for
 * the reason `slTooltipLayer` sets out: `mount="active"` means the layer exists
 * only while it is open, and a component cannot remove its own host.
 *
 * It also builds the two focus guards. Focus reaching one arrived by `Tab` at
 * the edge of a layer that lives at the end of the document, so the family
 * closes and puts focus back on the trigger, from which the reader's next `Tab`
 * continues down the page. It is the only answer that keeps the reading order
 * intact without trapping focus in a layer that is not modal.
 */
@Directive({
  selector: 'ng-template[slPopoverLayer]',
  standalone: true,
  exportAs: 'slPopoverLayer',
})
export class SlPopoverLayer {
  private readonly popover = inject(SlPopover);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly comment: Comment = this.viewContainer.element.nativeElement;
  private readonly arrowPlaceholder: Comment =
    this.comment.ownerDocument.createComment('slPopoverArrow');

  /** A signal, so every effect that reads it re-runs when the layer arrives. */
  private readonly layerNode = signal<HTMLElement | null>(null);
  private view: EmbeddedViewRef<unknown> | null = null;
  private portal: PortalRootHandle | null = null;
  private positioner: PositionerHandle | null = null;
  private dismissable: DismissableLayerHandle | null = null;

  private readonly status = signal<PresenceStatus>('unmounted');
  private readonly positioned = signal(false);
  private wasOpen = false;
  private readonly presence = createPresence({
    present: false,
    onStatusChange: (next) => this.status.set(next),
  });

  readonly mounted = computed(() => {
    const mount = this.popover.resolvedMount();
    if (mount === 'eager') return true;
    if (mount === 'lazy') return this.popover.seen();
    return this.status() !== 'unmounted';
  });

  constructor() {
    effect(() => this.presence.sync(this.popover.isOpen()));
    effect(() => (this.mounted() ? this.build() : this.teardown()));
    effect(() => this.place());
    effect(() => this.stack());
    effect(() => this.paint());
    effect(() => this.showArrow());
    effect(() => this.moveFocus());

    inject(DestroyRef).onDestroy(() => {
      this.presence.destroy();
      this.teardown();
    });
  }

  /** Measures and places the layer again. */
  reposition() {
    void this.positioner?.update();
  }

  private build() {
    if (this.layerNode() !== null) return;

    const document = this.comment.ownerDocument;
    const layer = document.createElement('div');
    writeSelectorKey(layer, 'ui', 'popover');
    writeSelectorKey(layer, 'part', 'root');

    const view = this.viewContainer.createEmbeddedView(this.template);
    view.detectChanges();

    layer.appendChild(this.guard(document));
    for (const node of view.rootNodes as Node[]) layer.appendChild(node);
    layer.appendChild(this.guard(document));

    const portal = createPortalRoot({
      origin: this.popover.anchorNode() ?? this.popover.triggerNode(),
      disabled: !this.popover.resolvedPortal(),
    });
    const container = portal.container ?? this.comment.parentNode;
    if (container === this.comment.parentNode) container?.insertBefore(layer, this.comment);
    else container?.appendChild(layer);

    this.view = view;
    this.portal = portal;
    this.presence.setNode(layer);
    this.layerNode.set(layer);
  }

  private guard(document: Document): HTMLElement {
    const guard = document.createElement('span');
    writeSelectorKey(guard, 'part', 'focus-guard');
    guard.setAttribute('aria-hidden', 'true');
    guard.tabIndex = 0;
    guard.addEventListener('focus', () => {
      this.popover.toggle(false, 'keyboard');
      this.popover.triggerNode()?.focus();
    });
    return guard;
  }

  private teardown() {
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
    this.positioned.set(false);
  }

  private place() {
    const layer = this.layerNode();
    const anchor = this.popover.anchorNode() ?? this.popover.triggerNode();
    const align = this.popover.resolvedAlign();
    const side = this.popover.resolvedSide();
    const width = this.popover.resolvedWidth();
    const options = {
      align,
      alignOffset:
        this.popover.resolvedAlignOffset() +
        (layer === null ? 0 : alignInset(layer, side, align, width)),
      boundaryPadding: this.popover.resolvedCollisionPadding(),
      flip: this.popover.resolvedFlip(),
      hideWhenDetached: this.popover.resolvedHideWhenDetached(),
      matchWidth: width === 'anchor',
      shift: this.popover.resolvedShift(),
      side,
      sideOffset: this.popover.resolvedSideOffset(),
      strategy: this.popover.resolvedStrategy(),
    };
    const arrow = this.popover.resolvedArrow() ? this.popover.arrowNode() : null;

    this.positioner?.destroy();
    this.positioner = null;
    if (layer === null || anchor === null) return;

    this.positioner = createPositioner(anchor, layer, {
      ...options,
      ...(arrow ? { arrow, arrowPadding: this.popover.resolvedArrowPadding() } : {}),
    });
    /* `data-open` is written on the element in the task that opened the panel,
       with the position, rather than by the effect on the next check. */
    void this.positioner.update().then(() => {
      if (this.popover.isOpen()) layer.setAttribute('data-open', '');
      this.positioned.set(true);
    });
  }

  /**
   * One layer in the single stack, and only while it is open. It is not modal:
   * nothing outside becomes `inert` and the page keeps scrolling. The trigger
   * and the anchor are branches, so pressing either is inside the layer.
   */
  private stack() {
    const layer = this.layerNode();
    const open = this.popover.isOpen();
    const branches = [this.popover.triggerNode(), this.popover.anchorNode()].filter(
      (element): element is HTMLElement => element !== null,
    );

    this.dismissable?.destroy();
    this.dismissable = null;
    if (layer === null || !open) return;

    this.dismissable = createDismissableLayer(layer, {
      escape: this.popover.resolvedCloseOnEscape(),
      focusOutside: false,
      modal: false,
      outsidePress: this.popover.resolvedCloseOnOutsidePress(),
      scrollLock: false,
      ...(branches.length > 0 ? { branches } : {}),
      onDismiss: (request) => {
        this.popover.toggle(
          false,
          request.reason === 'escape' ? 'escape' : 'outsidePress',
          request.source,
        );
      },
    });
  }

  private paint() {
    const layer = this.layerNode();
    if (layer === null) return;

    layer.setAttribute('data-align', this.popover.resolvedAlign());
    layer.setAttribute('data-size', this.popover.resolvedSize());
    layer.setAttribute('data-width', this.popover.resolvedWidth());
    if (this.popover.isOpen() && this.positioned()) layer.setAttribute('data-open', '');
    else layer.removeAttribute('data-open');
  }

  /**
   * The arrow the consumer wrote leaves the layer while `arrow` resolves to
   * false, and a comment holds its place, so the layer holds no arrow — as
   * React's `PopoverArrow` renders none — and the positioner measures none.
   */
  private showArrow() {
    const layer = this.layerNode();
    const arrow = this.popover.arrowNode();
    if (layer === null || arrow === null) return;

    if (this.popover.resolvedArrow()) {
      if (this.arrowPlaceholder.parentNode === layer) this.arrowPlaceholder.replaceWith(arrow);
    } else if (arrow.parentNode === layer) {
      arrow.replaceWith(this.arrowPlaceholder);
    }
  }

  /**
   * Focus goes to the panel itself rather than to its first control, so a
   * reader hears the panel's name before its contents. It waits for the first
   * measurement, because focusing a layer still at the origin scrolls the page
   * to it.
   */
  private moveFocus() {
    const open = this.popover.isOpen();
    const layer = this.layerNode();
    const content = this.popover.contentNode();
    const positioned = this.positioned();

    if (open && positioned && !this.wasOpen) {
      this.wasOpen = true;
      if (!this.popover.resolvedAutoFocus()) return;
      (resolveFocus(this.popover.initialFocus(), content) ?? content)?.focus();
      return;
    }

    if (!open && this.wasOpen) {
      this.wasOpen = false;
      /**
       * Only while the focus is still inside the layer. A reader who closed the
       * popover by pressing something else on the page keeps the focus they
       * moved to; taking it back would undo their own move.
       */
      const active = layer?.ownerDocument.activeElement ?? null;
      if (layer !== null && active !== null && !layer.contains(active)) return;
      (resolveFocus(this.popover.finalFocus(), content) ?? this.popover.triggerNode())?.focus();
    }
  }
}

/**
 * The panel. `role="dialog"`, named by its title and described by its
 * description when those parts are present, and `aria-modal` is never written —
 * saying it would tell a reader the rest of the page is gone while it is not.
 *
 * A popover with no title gets no `aria-labelledby`; the family invents no
 * name, and a consumer writes `aria-label` here instead — which is why the
 * host attribute they wrote is read before the binding is computed.
 *
 * It is the one part written as a component, because a component is what can
 * carry `styleUrl`: this is where the family's authored stylesheet enters an
 * Angular application.
 */
@Component({
  selector: '[slPopoverContent]',
  standalone: true,
  exportAs: 'slPopoverContent',
  template: '<ng-content />',
  styleUrl: '../../../styles/src/popover/popover.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'content',
    'data-part-content': '',
    tabindex: '-1',
    '[attr.role]': 'role()',
    '[attr.id]': 'popover.contentId',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-describedby]': 'describedBy()',
  },
})
export class SlPopoverContent {
  protected readonly popover = inject(SlPopover);
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });

  /* The consumer's own `role` wins; the popover decides the rest. */
  protected readonly role = computed(() => this.writtenRole ?? this.popover.contentRole());
  protected readonly labelledBy = computed(() =>
    this.popover.hasTitle() && this.writtenLabel === null ? this.popover.titleId : null,
  );
  protected readonly describedBy = computed(() =>
    this.popover.hasDescription() ? this.popover.descriptionId : null,
  );

  constructor() {
    const native: HTMLElement = inject(ElementRef).nativeElement;
    this.popover.contentNode.set(native);
    inject(DestroyRef).onDestroy(() => this.popover.contentNode.set(null));
  }
}

/** The title, the description and the close control, on the row that stays put. */
@Directive({
  selector: '[slPopoverHeader]',
  standalone: true,
  exportAs: 'slPopoverHeader',
  host: { 'data-part': 'header', 'data-part-header': '' },
})
export class SlPopoverHeader {}

/**
 * The panel's accessible name. The consumer writes the element, so a heading
 * that belongs in the document outline is theirs to choose — the reason
 * `result-state` records for the same decision.
 */
@Directive({
  selector: '[slPopoverTitle]',
  standalone: true,
  exportAs: 'slPopoverTitle',
  host: { 'data-part': 'title', 'data-part-title': '', '[attr.id]': 'popover.titleId' },
})
export class SlPopoverTitle {
  protected readonly popover = inject(SlPopover);

  constructor() {
    this.popover.hasTitle.set(true);
    inject(DestroyRef).onDestroy(() => this.popover.hasTitle.set(false));
  }
}

/** One line under the title, referenced by the panel rather than announced. */
@Directive({
  selector: '[slPopoverDescription]',
  standalone: true,
  exportAs: 'slPopoverDescription',
  host: {
    'data-part': 'description',
    'data-part-description': '',
    '[attr.id]': 'popover.descriptionId',
  },
})
export class SlPopoverDescription {
  protected readonly popover = inject(SlPopover);

  constructor() {
    this.popover.hasDescription.set(true);
    inject(DestroyRef).onDestroy(() => this.popover.hasDescription.set(false));
  }
}

/**
 * The only part that scrolls, bounded by the height the engine says is left.
 * Bounding the whole panel would scroll the title out of sight, which is how a
 * reader loses track of what they are in.
 */
@Directive({
  selector: '[slPopoverBody]',
  standalone: true,
  exportAs: 'slPopoverBody',
  host: { 'data-part': 'body', 'data-part-body': '' },
})
export class SlPopoverBody {}

/** The actions row, which keeps its height while the body scrolls under it. */
@Directive({
  selector: '[slPopoverFooter]',
  standalone: true,
  exportAs: 'slPopoverFooter',
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlPopoverFooter {}

/**
 * The pointer's way out. The keyboard has Escape, and a reader on a touch
 * device has no Escape key at all. A close control with no text of its own —
 * the drawn cross, or the consumer's icon — is named by the catalog's `close`;
 * one that shows words, such as "Done", is named by them, and a name the
 * consumer wrote on the element wins over both.
 */
@Component({
  selector: 'button[slPopoverClose]',
  standalone: true,
  exportAs: 'slPopoverClose',
  imports: [SlGlyph, SlIcon],
  /* The cross is drawn unless the consumer wrote content of their own. */
  template: `<ng-content
    ><span slIcon size="sm"><svg slGlyph name="x"></svg></span
  ></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-part': 'close',
    'data-part-close': '',
    type: 'button',
    '[attr.aria-label]': 'label()',
    '(click)': 'popover.toggle(false, "dismiss", $event)',
  },
})
export class SlPopoverClose {
  protected readonly popover = inject(SlPopover);
  private readonly written = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;
  /** Whether the content shows text, read after every render because it may change. */
  private readonly hasText = signal(false);

  protected readonly label = computed(
    () => this.written ?? (this.hasText() ? null : this.popover.t('close')),
  );

  constructor() {
    afterEveryRender(() => this.hasText.set((this.native.textContent ?? '').trim() !== ''));
  }
}

/**
 * The mark that points at the anchor. The family draws it; the positioner
 * measures it and says where it goes. It is hidden from assistive technology.
 * While `arrow` resolves to false the layer takes it out (`slPopoverLayer`).
 */
@Directive({
  selector: '[slPopoverArrow]',
  standalone: true,
  exportAs: 'slPopoverArrow',
  host: { 'data-part': 'arrow', 'data-part-arrow': '', 'aria-hidden': 'true' },
})
export class SlPopoverArrow {
  constructor() {
    const popover = inject(SlPopover);
    const native: HTMLElement = inject(ElementRef).nativeElement;
    popover.arrowNode.set(native);
    inject(DestroyRef).onDestroy(() => popover.arrowNode.set(null));
  }
}
