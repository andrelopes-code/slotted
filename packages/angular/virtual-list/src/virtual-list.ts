import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  numberAttribute,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { virtualWindow } from '@slotted/core/collection';

/**
 * Renders the rows near the viewport and claims all of them. The host is the
 * scroll container; the canvas inside it carries the block size of the whole
 * list, so the scrollbar describes the list rather than the window.
 *
 * The window is exposed as `indices()` through `exportAs`, and the consumer
 * writes an ordinary `@for` over it. Virtualization takes the decision of
 * which rows exist away from the consumer — that is the point of it — so a row
 * cannot be an ordinary child. What the consumer keeps is what the row
 * contains.
 */
@Component({
  selector: 'div[slVirtualList]',
  exportAs: 'slVirtualList',
  standalone: true,
  template:
    '<div data-part="canvas" role="none" [style.block-size.px]="totalSize()"><ng-content /></div>',
  styleUrl: '../../../styles/src/virtual-list/virtual-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-virtual-list',
    'data-slotted-component': 'virtual-list',
    'data-part': 'root',
    role: 'list',
    tabindex: '0',
    '(scroll)': 'measure()',
  },
})
export class SlVirtualList {
  readonly itemCount = input.required<number, unknown>({ transform: numberAttribute });
  readonly itemSize = input.required<number, unknown>({ transform: numberAttribute });
  readonly overscan = input(4, { transform: numberAttribute });

  readonly element = inject(ElementRef<HTMLElement>).nativeElement;

  private readonly destroyRef = inject(DestroyRef);

  private readonly scrollOffset = signal(0);

  private readonly viewportSize = signal(0);

  private readonly window = computed(() =>
    virtualWindow({
      itemCount: this.itemCount(),
      itemSize: this.itemSize(),
      overscan: this.overscan(),
      scrollOffset: this.scrollOffset(),
      viewportSize: this.viewportSize(),
    }),
  );

  readonly totalSize = computed(() => this.window().totalSize);

  /** The rows to render, by their position in the whole list. */
  readonly indices = computed(() => {
    const { endIndex, startIndex } = this.window();
    return Array.from({ length: endIndex - startIndex }, (_, offset) => startIndex + offset);
  });

  constructor() {
    afterNextRender(() => {
      this.measure();
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => this.measure());
      observer.observe(this.element);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /**
   * Both numbers come from the same element and the same layout, so they are
   * read together. The observer answers a resize that arrives without a
   * scroll; this answers the far more common case, and answers it in
   * environments that have no observer to install.
   */
  measure() {
    this.scrollOffset.set(this.element.scrollTop);
    this.viewportSize.set(this.element.clientHeight);
  }
}
