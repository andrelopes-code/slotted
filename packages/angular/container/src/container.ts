import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { injectContainerDefaults } from './container-defaults';
import type { ContainerAlign, ContainerInset, ContainerSize } from './container-defaults';

export type { ContainerAlign, ContainerInset, ContainerSize } from './container-defaults';

/**
 * Bounds the inline size of a region, insets it from the edge of the space it
 * was given, and places it inside that space. It paints nothing, separates
 * nothing and claims no semantics: the directive is written on the element the
 * page chose, so a `main`, a `section` and an `article` are all the same
 * container.
 *
 * The root is a three-track grid rather than a box with a maximum, because a
 * `slContainerBreakout` child needs a track to span. A run of text written
 * directly inside it becomes an item nothing can select and is placed in the
 * start gutter; wrap text in an element, as every layout family in this
 * library already requires.
 */
@Component({
  selector: '[slContainer]',
  standalone: true,
  exportAs: 'slContainer',
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/container/container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'container',
    'data-ui-container': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-inset]': 'resolvedInset()',
    '[attr.data-align]': 'resolvedAlign()',
  },
})
export class SlContainer {
  /** What the column bounds. Falls back to the injected default. */
  readonly size = input<ContainerSize>();
  /** The gap between the column and the edge, as a step on the space scale. */
  readonly inset = input<ContainerInset>();
  /** Where the column sits when there is space left over. */
  readonly align = input<ContainerAlign>();

  private readonly defaults = injectContainerDefaults();

  protected readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  protected readonly resolvedInset = computed(() => String(this.inset() ?? this.defaults.inset));
  protected readonly resolvedAlign = computed(() => this.align() ?? this.defaults.align);
}
