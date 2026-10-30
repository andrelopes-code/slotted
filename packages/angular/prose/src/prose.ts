import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { injectProseDefaults } from './prose-defaults';
import type { ProseFlow, ProseSize } from './prose-defaults';

export type { ProseFlow, ProseSize } from './prose-defaults';

/**
 * The typography of a region the application did not author element by
 * element. The tree arrives from a Markdown renderer, a CMS or a language
 * model, and the page never gets to put an attribute on the `h2`.
 *
 * Text the application does author is `slText` and `slHeading`: those carry a
 * size, a weight and a tone per element, and wrapping two authored paragraphs
 * in this family is choosing a recipe over a decision. The boundary is who
 * wrote the tags.
 *
 * It does not sanitise. The renderer that produced the tree is where a
 * sanitiser belongs, and a component that both styled and sanitised would hide
 * which of the two failed.
 *
 * The selector is an attribute, so the page keeps its own element: a `div`
 * claims nothing, and `article`, `section` or `main` is a claim the page
 * makes. Measure is not painted here either — `slContainer` owns it, and one
 * element composes the two:
 *
 * ```html
 * <div slContainer size="measure"><article slProse [innerHTML]="rendered"></article></div>
 * ```
 */
@Component({
  selector: '[slProse]',
  standalone: true,
  exportAs: 'slProse',
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/prose/prose.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'prose',
    'data-ui-prose': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-flow]': 'resolvedFlow()',
  },
})
export class SlProse {
  /** The type-scale step the body text takes. Falls back to the token. */
  readonly size = input<ProseSize>();
  /** The space between blocks, from which every other distance derives. */
  readonly flow = input<ProseFlow>();

  private readonly defaults = injectProseDefaults();

  protected readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  protected readonly resolvedFlow = computed(() => this.flow() ?? this.defaults.flow);
}
