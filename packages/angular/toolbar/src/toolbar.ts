import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  isDevMode,
  ViewEncapsulation,
} from '@angular/core';
import { createRovingTabindex } from '@slotted/core/focus';

import { TOOLBAR_ITEM_SELECTOR } from './toolbar.constants';

export type ToolbarOrientation = 'horizontal' | 'vertical';

/**
 * One tab stop for a group of controls, which is the whole point of the
 * pattern: a formatting toolbar of twelve buttons should cost a keyboard user
 * one Tab, not twelve.
 */
@Component({
  selector: 'div[slToolbar]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/toolbar/toolbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-toolbar',
    'data-slotted-component': 'toolbar',
    'data-part': 'root',
    role: 'toolbar',
    '[attr.data-orientation]': 'orientation()',
    '[attr.aria-orientation]': 'ariaOrientation()',
  },
})
export class SlToolbar {
  readonly orientation = input<ToolbarOrientation>('horizontal');

  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;

  readonly ariaOrientation = computed(() =>
    this.orientation() === 'vertical' ? 'vertical' : null,
  );

  constructor() {
    const destroyRef = inject(DestroyRef);

    if (isDevMode()) {
      const ariaLabel = this.element.getAttribute('aria-label');
      const ariaLabelledBy = this.element.getAttribute('aria-labelledby');
      if (!ariaLabel?.trim() && !ariaLabelledBy?.trim()) {
        console.warn(
          'Toolbar has no accessible name. Give it aria-label, or aria-labelledby pointing at the text that names it.',
        );
      }
    }

    afterNextRender(() => {
      const roving = createRovingTabindex(this.element, {
        itemSelector: TOOLBAR_ITEM_SELECTOR,
        orientation: () => this.orientation(),
      });

      /**
       * The controls are the consumer's, so they come and go without this
       * component rendering. A control added after the first render would
       * otherwise keep its own tab stop and break the single one the pattern
       * promises.
       */
      const observer = new MutationObserver(() => roving.refresh());
      observer.observe(this.element, { childList: true, subtree: true });

      destroyRef.onDestroy(() => {
        observer.disconnect();
        roving.destroy();
      });
    });
  }
}
