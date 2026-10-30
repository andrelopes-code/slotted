import { hostSelectorKey } from '@slotted/core/selector-key';
import {
  EXTENT_LARGE_STEP_PX,
  EXTENT_STEP_PX,
  anchorsAtStart,
  extentAtPoint,
  addExtentSample,
  extentVelocity,
  holdResizeGesture,
  isInlineSide,
  sameStop,
  settleExtent,
  SHEET_DRAG_SLOP_PX,
  SHEET_FLING_PX_PER_S,
  stepAmountFromPixels,
  stepExtent,
} from '@slotted/core/extent';
import type { ExtentSample, SheetScroll } from '@slotted/core/extent';
import { clamp } from '@slotted/core/measure';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { SlDrawer } from './drawer';
import type { DrawerOpenReason } from './drawer-defaults';

/**
 * A click synthesised by the keyboard reports no detail; a real one reports the
 * click count. It is how `Enter`, `Space` and a pointer are told apart without
 * a key listener existing for something the platform already handles.
 */
function activationReason(event: MouseEvent): DrawerOpenReason {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * The control that opens a drawer.
 *
 * It is the consumer's own element, which is what this ecosystem composes with:
 * `<button slButton [slDrawerTrigger]="d">` is the library's own button and
 * this adds the wiring to it. React reaches the same place with `render`,
 * because there the component owns the tag.
 *
 * The trigger is also an overlay layer's *branch*: a press on it is inside the
 * layer as far as `dismissable-layer` is concerned, or opening would
 * immediately be read as an outside press and close what it just opened.
 *
 * `aria-haspopup` is written only under `mode="overlay"`. An inline drawer is a
 * disclosure, not a popup, and the property would promise a layer that never
 * arrives.
 */
@Directive({
  selector: '[slDrawerTrigger]',
  standalone: true,
  exportAs: 'slDrawerTrigger',
  host: {
    '[attr.data-part]': 'part',
    type: 'button',
    '[attr.aria-haspopup]': 'haspopup()',
    '[attr.aria-expanded]': 'drawer().open()',
    '[attr.aria-controls]': 'controls()',
    '[attr.data-open]': "drawer().open() ? '' : null",
    '[id]': 'drawer().triggerId',
    '(click)': 'press($event)',
  },
})
export class SlDrawerTrigger implements OnInit, OnDestroy {
  /** The drawer this control opens, reached with a template reference variable. */
  readonly drawer = input.required<SlDrawer>({ alias: 'slDrawerTrigger' });

  private readonly native: HTMLElement = inject(ElementRef).nativeElement;

  /**
   * `trigger` names the control when it belongs to no family of its own. On
   * `slButton` the element is that family's root, and the part stays `root`:
   * two directives write one attribute, and the family the element is drawn by
   * keeps it, as React's `render` does by spreading the button's props last.
   */
  protected readonly part = hostSelectorKey(
    this.native,
    'part',
    this.native.hasAttribute('data-ui') ? this.native.getAttribute('data-part') : 'trigger',
  );

  protected readonly controls = computed(() =>
    this.drawer().mounted() ? this.drawer().panelId : null,
  );
  protected readonly haspopup = computed(() =>
    this.drawer().resolvedMode() === 'overlay' ? 'dialog' : null,
  );

  ngOnInit() {
    this.drawer().triggerNode.set(this.native);
  }

  ngOnDestroy() {
    if (this.drawer().triggerNode() === this.native) this.drawer().triggerNode.set(null);
  }

  protected press(event: MouseEvent) {
    /* The consumer's own handler ran first, and `preventDefault()` refuses the
       open — composed with, never replaced. */
    if (event.defaultPrevented) return;
    const drawer = this.drawer();
    drawer.request(!drawer.open(), activationReason(event), undefined, event);
  }
}

@Directive({
  selector: '[slDrawerHeader]',
  standalone: true,
  exportAs: 'slDrawerHeader',
  host: { 'data-part': 'header', 'data-part-header': '' },
})
export class SlDrawerHeader {}

/**
 * The visible name, which `aria-labelledby` points at — on the panel and, as
 * the Window Splitter pattern requires, on the separator that sizes it.
 */
@Directive({
  selector: '[slDrawerTitle]',
  standalone: true,
  exportAs: 'slDrawerTitle',
  host: { 'data-part': 'title', 'data-part-title': '', '[id]': 'drawer.titleId' },
})
export class SlDrawerTitle implements OnInit, OnDestroy {
  protected readonly drawer = inject(SlDrawer);

  ngOnInit() {
    this.drawer.hasTitle.set(true);
  }

  ngOnDestroy() {
    this.drawer.hasTitle.set(false);
  }
}

/** The actions beside the title, on its row: one or two icon buttons, such as "history" and "new". */
@Directive({
  selector: '[slDrawerActions]',
  standalone: true,
  exportAs: 'slDrawerActions',
  host: { 'data-part': 'actions', 'data-part-actions': '' },
})
export class SlDrawerActions {}

/** The sentence that says what the drawer is about. */
@Directive({
  selector: '[slDrawerDescription]',
  standalone: true,
  exportAs: 'slDrawerDescription',
  host: { 'data-part': 'description', 'data-part-description': '', '[id]': 'drawer.descriptionId' },
})
export class SlDrawerDescription implements OnInit, OnDestroy {
  protected readonly drawer = inject(SlDrawer);

  ngOnInit() {
    this.drawer.hasDescription.set(true);
  }

  ngOnDestroy() {
    this.drawer.hasDescription.set(false);
  }
}

/**
 * The one row that scrolls, and the row `aria-busy` belongs to while the
 * content is still on its way — the header, the close button, Escape and the
 * separator all stay operable, because a drawer a reader cannot leave is the
 * worse failure of the two.
 */
@Directive({
  selector: '[slDrawerBody]',
  standalone: true,
  exportAs: 'slDrawerBody',
  host: {
    'data-part': 'body',
    'data-part-body': '',
    '[attr.aria-busy]': "drawer.loading() ? 'true' : null",
    '[attr.data-inset]': 'inset() ?? null',
  },
})
export class SlDrawerBody {
  protected readonly drawer = inject(SlDrawer);
  /** `none` drops the body's own padding, for content that brings its own inset — a page, a list on the panel's edges. */
  readonly inset = input<'none' | undefined>(undefined);
}

@Directive({
  selector: '[slDrawerFooter]',
  standalone: true,
  exportAs: 'slDrawerFooter',
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlDrawerFooter {}

/**
 * The ✕ in the corner. It carries `dismiss`, which is the word the closed
 * vocabulary in `docs/state-and-events.md` already has for what a close button
 * means, and its `value` rides out on the request as the result.
 */
@Component({
  selector: '[slDrawerClose]',
  standalone: true,
  exportAs: 'slDrawerClose',
  imports: [SlGlyph, SlIcon],
  /* The cross is drawn unless the consumer wrote content of their own. */
  template: `<ng-content
    ><span slIcon><svg slGlyph name="x"></svg></span
  ></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-part': 'close',
    'data-part-close': '',
    type: 'button',
    '[attr.aria-label]': 'label()',
    '(click)': 'press($event)',
  },
})
export class SlDrawerClose {
  /** The result the close carries out, which is the platform's `returnValue`. */
  readonly value = input<string | undefined>(undefined);

  private readonly drawer = inject(SlDrawer);
  /** A consumer's own `aria-label`, which wins over the catalog. */
  private readonly ownLabel = inject(new HostAttributeToken('aria-label'), { optional: true });

  protected readonly label = computed(() => this.ownLabel ?? this.drawer.t('close'));

  protected press(event: MouseEvent) {
    if (event.defaultPrevented) return;
    this.drawer.request(false, 'dismiss', this.value(), event);
  }
}

/**
 * The separator the reader moves, from the WAI-ARIA Window Splitter pattern.
 *
 * **Rendering it is the capability.** There is no `resizable` input, so an
 * input with no separator, and a separator an input had switched off, are both
 * states this family cannot be in.
 *
 * The arrows are physical rather than logical, which is the pattern's own
 * reading: the key names a direction on the screen. `ArrowLeft` grows an
 * `end`-side panel in a left-to-right document and shrinks it in a mirrored
 * one, because there the panel is on the left and the reader is pushing its
 * edge toward the wall.
 */
/** How far a press on the separator may wander and still be a tap. */
const TAP_SLOP_PX = 3;

@Component({
  selector: '[slDrawerResizer]',
  standalone: true,
  exportAs: 'slDrawerResizer',
  /**
   * A component rather than a directive, and the template is the whole reason:
   * the separator draws its own picture now — two hairlines and a grip, or a
   * pill on a block side — and a directive has nothing to draw them with.
   *
   * Three elements rather than pseudo-elements because
   * `packages/styles/src/fallbacks.test.mjs` forbids a system colour inside
   * `::before` or `::after`, and both steps these take have one as their last
   * resort. The selector is unchanged, so no consumer's template moves.
   */
  template: `
    <span data-part="line" data-part-line="" aria-hidden="true"></span>
    <span data-part="grip" data-part-grip="" aria-hidden="true"></span>
    <span data-part="line" data-part-line="" aria-hidden="true"></span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'resizer',
    'data-part-resizer': '',
    role: 'separator',
    tabindex: '0',
    '[attr.aria-controls]': 'drawer.panelId',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-valuemin]': 'percent(floor())',
    '[attr.aria-valuemax]': 'percent(drawer.bounds().max)',
    '[attr.aria-valuenow]': 'valueNow()',
    '(pointerdown)': 'pointerDown($event)',
    '(pointermove)': 'pointerMove($event)',
    '(pointerup)': 'endDrag($event)',
    '(lostpointercapture)': 'endDrag($event)',
    '(pointercancel)': 'cancelPress()',
    '(keydown)': 'keyDown($event)',
    '(dblclick)': 'restore($event)',
  },
})
export class SlDrawerResizer {
  /**
   * How far one arrow press moves the separator, **in pixels**, when there are
   * no snap points. A distance and not a proportion: a reader adjusting a pane
   * is placing an edge against the content beside it, and a proportion of a
   * wide layer is a jump.
   */
  readonly step = input(EXTENT_STEP_PX);
  /** How far `Shift` and an arrow move it, in pixels. */
  readonly largeStep = input(EXTENT_LARGE_STEP_PX);

  protected readonly drawer = inject(SlDrawer);
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;

  /** Where the pointer last was, which is what decides a dismissal on release. */
  private dragged: number | null = null;
  /** Where the pointer has been, for the velocity the release reads. */
  private samples: ExtentSample[] = [];
  /**
   * Where the press began and how far the panel's edge was from the pointer
   * then. The panel follows the pointer from that offset rather than jumping
   * its edge under it, so a press that does not move is a tap and moves nothing.
   */
  private press: {
    x: number;
    y: number;
    at: number;
    offset: number;
    moved: boolean;
    /** The measure before the gesture, which a close by the gesture gives back. */
    before: number | undefined;
  } | null = null;
  /** What `Enter` restores to once it has collapsed the panel. */
  private collapsed: number | null = null;
  /** What the document looked like before the drag, and how to put it back. */
  private gesture: (() => void) | null = null;
  /** A press on a sheet's separator: a tap, or a mouse dragging the sheet's scroll. */
  private sheetPress: {
    x: number;
    y: number;
    mouse: boolean;
    scroll: SheetScroll;
    drag: ReturnType<SheetScroll['drag']> | null;
  } | null = null;

  protected readonly orientation = computed(() =>
    isInlineSide(this.drawer.resolvedSide()) ? 'vertical' : 'horizontal',
  );
  protected readonly labelledBy = computed(() =>
    this.drawer.hasTitle() ? this.drawer.titleId : null,
  );
  /* A content sheet may rest below `minExtent`, and its rest is still a value
     the range holds. */
  protected readonly floor = computed(() => {
    const min = this.drawer.bounds().min;
    const rest = this.drawer.rest();
    return this.drawer.resolvedSize() === 'content' && rest !== undefined
      ? Math.min(min, rest)
      : min;
  });
  protected readonly valueNow = computed(() =>
    this.percent(clamp(this.current(), this.floor(), this.drawer.bounds().max)),
  );

  protected percent(value: number) {
    return Math.round(clamp(value, 0, 1) * 100);
  }

  private current() {
    return this.drawer.currentExtent() ?? this.drawer.rest() ?? this.drawer.bounds().min;
  }

  private isRtl() {
    return getComputedStyle(this.native).direction === 'rtl';
  }

  private span() {
    const box = this.drawer.measuringBox();
    if (box === null) return 0;
    const rect = box.getBoundingClientRect();
    return isInlineSide(this.drawer.resolvedSide()) ? rect.width : rect.height;
  }

  /**
   * The stops the keyboard, the release and a tap share. Without snap points
   * the range is continuous and there are none — the content stop joins only a
   * list the consumer started, or a separator with no stops would stop moving.
   */
  private stopsNow(): { stops: number[]; rest: number | undefined } {
    const panel = this.native.parentElement;
    /* A sheet's stops are the scroll's, laid out with its snap points. */
    const scroll = this.drawer.sheetScroll;
    if (scroll !== null) return { rest: scroll.rest(), stops: [...scroll.stops()] };
    if (panel === null || this.drawer.snapPoints().length === 0) {
      return { rest: this.drawer.rest(), stops: [] };
    }
    return this.drawer.measureStops(panel, this.span());
  }

  private fractionAt(event: PointerEvent) {
    const box = this.drawer.measuringBox();
    if (box === null) return null;
    return extentAtPoint({
      point: { x: event.clientX, y: event.clientY },
      rect: box.getBoundingClientRect(),
      rtl: this.isRtl(),
      side: this.drawer.resolvedSide(),
    });
  }

  protected pointerDown(event: PointerEvent) {
    if (event.defaultPrevented || event.button !== 0) return;

    /* A sheet's separator: a touch that moves is the scroll's, one that does
       not is a tap; a mouse, which no scroll follows, drags the scroll. */
    const scroll = this.drawer.sheetScroll;
    if (scroll !== null) {
      const mouse = event.pointerType === 'mouse';
      if (mouse) {
        event.preventDefault();
        this.native.setPointerCapture(event.pointerId);
      }
      this.native.focus();
      this.sheetPress = { drag: null, mouse, scroll, x: event.clientX, y: event.clientY };
      return;
    }
    const fraction = this.fractionAt(event);
    if (fraction === null) return;

    event.preventDefault();
    this.native.setPointerCapture(event.pointerId);
    this.native.focus();
    this.press = {
      at: fraction,
      before: this.drawer.currentExtent(),
      moved: false,
      offset: this.current() - fraction,
      x: event.clientX,
      y: event.clientY,
    };
    this.samples = [];
  }

  protected cancelPress() {
    this.sheetPress = null;
  }

  protected pointerMove(event: PointerEvent) {
    const tapped = this.sheetPress;
    if (tapped !== null) {
      const travel = Math.hypot(event.clientX - tapped.x, event.clientY - tapped.y);
      if (tapped.drag === null && travel < (tapped.mouse ? TAP_SLOP_PX : SHEET_DRAG_SLOP_PX))
        return;
      if (!tapped.mouse) {
        this.sheetPress = null;
        return;
      }
      tapped.drag ??= tapped.scroll.drag();
      tapped.drag.move(tapped.y - event.clientY);
      return;
    }
    const held = this.press;
    if (held === null) return;
    const at = this.fractionAt(event);
    if (at === null) return;

    if (!held.moved) {
      if (Math.hypot(event.clientX - held.x, event.clientY - held.y) < TAP_SLOP_PX) return;
      held.moved = true;
      /* The cursor has to survive the pointer leaving the separator, and a drag
         across the page must not select the text under it. Both are the
         document's and neither is reachable from the family's own stylesheet. */
      this.gesture?.();
      this.gesture = holdResizeGesture(
        this.native.ownerDocument,
        isInlineSide(this.drawer.resolvedSide()) ? 'col-resize' : 'row-resize',
      );
      this.drawer.dragging.set(true);
    }

    const fraction = clamp(at + held.offset, 0, 1);
    this.dragged = fraction;
    this.samples = addExtentSample(this.samples, { at: event.timeStamp, fraction });
    this.drawer.requestExtent(fraction, 'pointer', event);
  }

  /**
   * A tap walks the stops upward and wraps from the highest to the lowest,
   * which is what the grabber of a native sheet does and what Ionic calls
   * `handleBehavior="cycle"`. A separator with no stops has nowhere to walk.
   */
  private cycle(event: PointerEvent) {
    const { rest, stops } = this.stopsNow();
    if (stops.length < 2) return;
    /* Where the panel is, read with the stops rather than from state a frame old. */
    const at =
      this.drawer.sheetScroll?.at() ?? this.drawer.currentExtent() ?? rest ?? this.current();
    const next = stops.find((stop) => stop > at && !sameStop(stop, at)) ?? (stops[0] as number);
    this.drawer.requestExtent(this.drawer.asRequest(next, rest), 'pointer', event);
  }

  /**
   * Where the release lands. With stops it is `settleExtent`, the same rule
   * the sheet's body answers: the closed position is the stop `0`, a fling goes
   * to the next stop, anything slower to the nearest to where it was heading.
   * Without stops the range is continuous — resizing is what a separator does
   * on a desktop screen — and only the floor, or a fling toward the edge, asks
   * to close. A close the consumer cancels leaves the panel at the floor.
   */
  protected endDrag(event: PointerEvent) {
    const tapped = this.sheetPress;
    if (tapped !== null) {
      this.sheetPress = null;
      if (tapped.drag !== null) tapped.drag.end();
      else if (event.type === 'pointerup') this.cycle(event);
      return;
    }
    const held = this.press;
    if (held === null) return;
    this.press = null;
    if (this.native.hasPointerCapture(event.pointerId)) {
      this.native.releasePointerCapture(event.pointerId);
    }
    if (!held.moved) {
      if (event.type === 'pointerup') this.cycle(event);
      return;
    }

    this.gesture?.();
    this.gesture = null;
    this.drawer.dragging.set(false);

    const bounds = this.drawer.bounds();
    const span = this.span();
    const last = this.dragged ?? this.current();
    /* A cancelled pointer was not let go: it has no speed to carry on. */
    const velocity =
      event.type === 'pointercancel' ? 0 : extentVelocity(this.samples, event.timeStamp);
    this.dragged = null;
    this.samples = [];

    const { rest, stops } = this.stopsNow();
    /* Where the release lands: a stop, the floor, or out. */
    const landed: number | 'close' =
      stops.length > 0
        ? settleExtent({ fraction: last, span, stops, velocity })
        : last < bounds.min || velocity * span <= -SHEET_FLING_PX_PER_S
          ? 'close'
          : clamp(last, bounds.min, bounds.max);

    if (landed === 'close') {
      const floor = stops.length > 0 ? (stops[0] as number) : bounds.min;
      this.drawer.request(false, 'pointer', undefined, event);
      /* The next open starts at the measure the drawer had before the gesture,
         which a separator resizing as it moved has to ask back. A close the
         consumer refused leaves the panel open, at the floor. */
      this.drawer.requestExtent(held.before, 'pointer', event);
      requestAnimationFrame(() => {
        if (this.drawer.open()) this.drawer.requestExtent(floor, 'pointer', event);
      });
      return;
    }
    this.drawer.requestExtent(
      stops.length > 0 ? this.drawer.asRequest(landed, rest) : landed,
      'pointer',
      event,
    );
  }

  /**
   * Back to the measure the size step gives it, which is what `undefined`
   * means for this state. It is the one gesture in the family that restores
   * rather than moves, and every desktop pane divider answers a double click
   * with it.
   */
  protected restore(event: MouseEvent) {
    if (event.defaultPrevented) return;
    event.preventDefault();
    this.drawer.restoreExtent('pointer', event);
  }

  protected keyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;

    const side = this.drawer.resolvedSide();
    const bounds = this.drawer.bounds();
    const inline = isInlineSide(side);
    const atStart = anchorsAtStart(side, this.isRtl());
    const towardFirstEdge = inline ? 'ArrowLeft' : 'ArrowUp';
    const towardLastEdge = inline ? 'ArrowRight' : 'ArrowDown';

    /**
     * A distance and not a proportion. Five per cent of a twelve-hundred-pixel
     * layer is sixty pixels, which is a jump rather than an adjustment; the
     * fraction is still what the family stores, and the pixels are converted
     * against the layer measured at the moment of the press.
     */
    const box = this.drawer.measuringBox();
    const amount =
      box === null
        ? 0
        : stepAmountFromPixels({
            pixels: event.shiftKey ? this.largeStep() : this.step(),
            rect: box.getBoundingClientRect(),
            side,
          });

    const { rest, stops } = this.stopsNow();
    const by = (direction: 1 | -1) => {
      event.preventDefault();
      const next = stepExtent({
        amount,
        direction,
        fraction: this.current(),
        max: stops.at(-1) ?? bounds.max,
        min: stops[0] ?? bounds.min,
        snapPoints: stops,
      });
      this.drawer.requestExtent(this.drawer.asRequest(next, rest), 'keyboard', event);
    };

    /** The two ends of the range: the first and last stop when there are stops. */
    const to = (target: number) => {
      event.preventDefault();
      this.drawer.requestExtent(this.drawer.asRequest(target, rest), 'keyboard', event);
    };

    switch (event.key) {
      case towardFirstEdge:
        return by(atStart ? -1 : 1);
      case towardLastEdge:
        return by(atStart ? 1 : -1);
      case 'Home':
        return to(stops[0] ?? bounds.min);
      case 'End':
        return to(stops.at(-1) ?? bounds.max);
      /**
       * The pattern's own key, and the one departure from it: "collapses the
       * pane" would mean closing the drawer, and Escape already means that. A
       * reader who presses Enter on a separator expects the separator to still
       * be there afterwards.
       */
      case 'Enter': {
        event.preventDefault();
        if (this.current() > bounds.min) {
          this.collapsed = this.current();
          return this.drawer.requestExtent(bounds.min, 'keyboard', event);
        }
        return this.drawer.requestExtent(this.collapsed ?? bounds.max, 'keyboard', event);
      }
      default:
        return;
    }
  }
}
