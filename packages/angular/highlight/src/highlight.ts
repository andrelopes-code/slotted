import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { highlightRuns } from '@slotted/core/highlight';
import type { HighlightMatcher, HighlightRange } from '@slotted/core/highlight';

import { injectHighlightDefaults } from './highlight-defaults';
import type { HighlightOccurrences, HighlightSensitivity } from './highlight-defaults';

/**
 * The spans of a text a query found, marked.
 *
 * The component is written on the consumer's own element — the `span` that
 * holds an option's label, the `p` under a find bar — which is the element
 * that holds the text and the reason this binding needs no `render` input:
 * substituting the element is Angular's default. The `mark` inside it is
 * fixed; it is the element the HTML Standard defines for the term searched
 * for inside a result.
 *
 * It is content, not a control: nothing here is focusable and nothing answers
 * a key. What is marked is decided by `@slotted/core/highlight`, the same scan
 * `combobox`'s filter decides with. `text` is a string and the runs are
 * slices of it; nothing is projected, because a `mark` inside projected
 * content would be HTML the family interpreted.
 *
 * Every space in this template is load-bearing: a newline between two nodes
 * collapses into a space, and a space between two runs is a space inside the
 * text.
 */
@Component({
  selector: '[slHighlight]',
  standalone: true,
  exportAs: 'slHighlight',
  // prettier-ignore
  template: `@for (run of runs(); track $index) {@if (run.matched) {<mark data-part="match" data-part-match="" [attr.data-current]="run.index === current() ? '' : null">{{ run.text }}</mark>} @else {{{ run.text }}}}`,
  styleUrl: '../../../styles/src/highlight/highlight.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'highlight',
    'data-ui-highlight': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-disabled]': 'disabled() ? "" : null',
  },
})
export class SlHighlight {
  /**
   * The text, whole. It is the only content the family renders: nothing in it
   * is HTML, and a run is a slice of it.
   */
  readonly text = input.required<string>();
  /** One query or several. Empty and whitespace-only entries find nothing. */
  readonly query = input<string | readonly string[] | undefined>(undefined);
  /**
   * Spans already found — by a server, by a fuzzy engine — in the text's own
   * code units. Wins over `query` and `matcher`; normalised like either.
   */
  readonly ranges = input<readonly HighlightRange[] | undefined>(undefined);
  /** Replaces the default matcher. Loses to `ranges`. */
  readonly matcher = input<HighlightMatcher | undefined>(undefined);
  /**
   * The match a find bar is standing on, counting matches only. It is stated,
   * never moved: the family has no keyboard. Out of range marks nothing.
   */
  readonly current = input<number | undefined>(undefined);
  /** Defaults to the provider, then to the runtime's locale. */
  readonly locale = input<string | undefined>(undefined);
  /** Defaults to the provider, then to `base`. */
  readonly sensitivity = input<HighlightSensitivity | undefined>(undefined);
  /** Defaults to the provider, then to `all`. */
  readonly occurrences = input<HighlightOccurrences | undefined>(undefined);
  /**
   * Steps the marks down without claiming the row's semantics. The row above
   * already says it with `data-disabled`, and the sheet reads that too.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly defaults = injectHighlightDefaults();

  /** The runs the template renders; a consumer counting matches reads it too. */
  readonly runs = computed(() =>
    highlightRuns(this.text(), {
      locale: this.locale() ?? this.defaults.locale,
      matcher: this.matcher(),
      occurrences: this.occurrences() ?? this.defaults.occurrences,
      query: this.query(),
      ranges: this.ranges(),
      sensitivity: this.sensitivity() ?? this.defaults.sensitivity,
    }),
  );
}
