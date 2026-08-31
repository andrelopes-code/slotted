import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
  numberAttribute,
  ViewEncapsulation,
} from '@angular/core';

export type SplitterOrientation = 'horizontal' | 'vertical';

export function clampPosition(value: number, min: number, max: number) {
  return Number(Math.min(Math.max(value, min), max).toFixed(2));
}

/**
 * The position is the first grid track's size, written as a style binding on
 * the root. A percentage rather than a pixel count, because the container is
 * not measured until layout and a pixel position taken from one viewport is
 * wrong on the next.
 */
@Component({
  selector: 'div[slSplitter]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/splitter/splitter.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-splitter',
    'data-slotted-component': 'splitter',
    'data-part': 'root',
    '[attr.data-orientation]': 'orientation()',
    '[style.grid-template-columns]': 'columns()',
    '[style.grid-template-rows]': 'rows()',
  },
})
export class SlSplitter {
  readonly max = input(100, { transform: numberAttribute });
  readonly min = input(0, { transform: numberAttribute });
  readonly orientation = input<SplitterOrientation>('horizontal');
  readonly step = input(5, { transform: numberAttribute });
  readonly value = model(50);

  readonly element = inject(ElementRef<HTMLElement>).nativeElement;

  private restore = 50;

  readonly position = computed(() => clampPosition(this.value(), this.min(), this.max()));

  private readonly track = computed(() => `${this.position()}% auto 1fr`);

  readonly columns = computed(() => (this.orientation() === 'horizontal' ? this.track() : null));

  readonly rows = computed(() => (this.orientation() === 'vertical' ? this.track() : null));

  setValue(next: number) {
    this.value.set(clampPosition(next, this.min(), this.max()));
  }

  toggleCollapse() {
    const position = this.position();
    const min = this.min();
    if (position > min) {
      this.restore = position;
      this.setValue(min);
      return;
    }
    this.setValue(this.restore > min ? this.restore : this.max());
  }
}
