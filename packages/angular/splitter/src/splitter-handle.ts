import { computed, Directive, ElementRef, inject, isDevMode } from '@angular/core';

import { SlSplitter } from './splitter';

function readsRightToLeft(element: HTMLElement) {
  return getComputedStyle(element).direction === 'rtl';
}

/**
 * The separator, and the only focusable part of the family. Its
 * aria-orientation is perpendicular to the root's: a vertical line separates
 * two side-by-side panes. `horizontal` is the attribute's default value, so it
 * is written only in the case that departs from it.
 */
@Directive({
  selector: 'div[slSplitterHandle]',
  standalone: true,
  host: {
    'data-part': 'handle',
    role: 'separator',
    tabindex: '0',
    '[attr.aria-orientation]': 'ariaOrientation()',
    '[attr.aria-valuemax]': 'splitter.max()',
    '[attr.aria-valuemin]': 'splitter.min()',
    '[attr.aria-valuenow]': 'splitter.position()',
    '(keydown)': 'handleKeyDown($event)',
    '(pointerdown)': 'handlePointerDown($event)',
    '(pointermove)': 'handlePointerMove($event)',
    '(pointerup)': 'handlePointerUp($event)',
  },
})
export class SlSplitterHandle {
  protected readonly splitter = inject(SlSplitter);

  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;

  private dragging = false;

  protected readonly ariaOrientation = computed(() =>
    this.splitter.orientation() === 'horizontal' ? 'vertical' : null,
  );

  constructor() {
    if (!isDevMode()) return;
    const ariaLabel = this.element.getAttribute('aria-label');
    const ariaLabelledBy = this.element.getAttribute('aria-labelledby');
    if (!ariaLabel?.trim() && !ariaLabelledBy?.trim()) {
      console.warn(
        'SplitterHandle has no accessible name. Give it aria-label, or aria-labelledby pointing at the text that names it.',
      );
    }
  }

  handleKeyDown(event: KeyboardEvent) {
    const horizontal = this.splitter.orientation() === 'horizontal';
    const reversed = horizontal && readsRightToLeft(this.splitter.element);
    const towardsStart = horizontal ? 'ArrowLeft' : 'ArrowUp';
    const towardsEnd = horizontal ? 'ArrowRight' : 'ArrowDown';
    const step = this.splitter.step();

    if (event.key === towardsStart) {
      this.splitter.setValue(this.splitter.position() + (reversed ? step : -step));
    } else if (event.key === towardsEnd) {
      this.splitter.setValue(this.splitter.position() + (reversed ? -step : step));
    } else if (event.key === 'Home') {
      this.splitter.setValue(this.splitter.min());
    } else if (event.key === 'End') {
      this.splitter.setValue(this.splitter.max());
    } else if (event.key === 'Enter') {
      this.splitter.toggleCollapse();
    } else {
      return;
    }

    event.preventDefault();
  }

  handlePointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    this.element.setPointerCapture(event.pointerId);
    this.dragging = true;
  }

  handlePointerMove(event: PointerEvent) {
    if (!this.dragging) return;

    const root = this.splitter.element;
    const rect = root.getBoundingClientRect();
    const horizontal = this.splitter.orientation() === 'horizontal';
    const span = horizontal ? rect.width : rect.height;
    if (span === 0) return;

    const offset = horizontal ? event.clientX - rect.left : event.clientY - rect.top;
    const fraction = horizontal && readsRightToLeft(root) ? 1 - offset / span : offset / span;
    this.splitter.setValue(fraction * 100);
  }

  handlePointerUp(event: PointerEvent) {
    if (this.element.hasPointerCapture(event.pointerId)) {
      this.element.releasePointerCapture(event.pointerId);
    }
    this.dragging = false;
  }
}
