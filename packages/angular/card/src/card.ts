import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { injectCardDefaults } from './card-defaults';
import type { CardFill, CardOrientation, CardSize } from './card-defaults';

export type { CardFill, CardOrientation, CardSize } from './card-defaults';

/**
 * A bounded surface that groups one subject. It claims nothing about what that
 * subject is: the directive is written on the element the page chose, so an
 * `article` with its own heading, the `li` of a list of results and the
 * `label` of a chooser are all the same card.
 *
 * The card holds no state. `selected` and `disabled` mirror state that belongs
 * to the control inside it, which is also what announces them.
 */
@Component({
  selector: '[slCard]',
  standalone: true,
  exportAs: 'slCard',
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/card/card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'card',
    'data-ui-card': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.data-fill]': 'resolvedFill()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-selected]': "selected() ? '' : null",
    '[attr.data-disabled]': "disabled() ? '' : null",
  },
})
export class SlCard {
  /**
   * `horizontal` puts the media beside the regions and answers the card's own
   * inline size, returning the media to the top in a narrow container.
   */
  readonly orientation = input<CardOrientation>();
  /** How the surface is bounded. Falls back to the injected default. */
  readonly fill = input<CardFill>();
  /** The card's own inset. Falls back to the injected default. */
  readonly size = input<CardSize>();
  /**
   * Mirrors a selection the page owns. The card paints it; the control inside
   * announces it.
   */
  readonly selected = input(false, { transform: booleanAttribute });
  /**
   * Mirrors a control the page has disabled: the card dims, stops answering
   * hover and withdraws the hit area it added. It disables nothing, because
   * only the control inside can refuse an interaction.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly defaults = injectCardDefaults();

  protected readonly resolvedOrientation = computed(
    () => this.orientation() ?? this.defaults.orientation,
  );
  protected readonly resolvedFill = computed(() => this.fill() ?? this.defaults.fill);
  protected readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
}
