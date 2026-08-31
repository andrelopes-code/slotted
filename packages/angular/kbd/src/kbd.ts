import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

export type KbdSize = 'sm' | 'md';

/**
 * One key, not a combination. `Ctrl + K` is two elements and a separator the
 * consumer writes, because the separator is text in their language and the
 * order of modifiers differs between platforms.
 */
@Component({
  selector: 'kbd[slKbd]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/kbd/kbd.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-kbd',
    'data-slotted-component': 'kbd',
    'data-part': 'root',
    '[attr.data-size]': 'size()',
  },
})
export class SlKbd {
  readonly size = input<KbdSize>('md');
}
