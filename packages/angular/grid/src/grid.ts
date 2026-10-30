import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

/**
 * A step on the space scale. Separation is chosen from the scale rather than
 * stated as a length, so a theme retunes every layout at once and no component
 * invents a rhythm of its own. `0` is the absence of separation.
 */
export type GridGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * A ceiling on the number of tracks, not a promise of them. The grid drops a
 * column whenever keeping it would take a cell below `minItemWidth`.
 */
export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** The narrowest a cell may become before the grid drops a column. */
export type GridMinItemWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Across the flow, which for a cell is the block axis. */
export type GridAlign = 'start' | 'center' | 'end' | 'stretch';

/** Along the flow, which for a cell is the inline axis. */
export type GridJustify = 'start' | 'center' | 'end' | 'stretch';

/**
 * Grid arranges its children across two axes and reflows by measuring itself
 * rather than the viewport, so no breakpoint appears anywhere in the family. It
 * paints nothing and adds no semantics: the element is the one the consumer
 * wrote.
 *
 * It is not the APG grid widget. There is no `role="grid"`, no cell and no
 * arrow-key navigation: this family lays children out, and the children keep
 * whatever semantics they already had.
 *
 * The count travels as a custom property as well as an attribute, because a
 * track function cannot read an integer from an attribute.
 */
@Component({
  selector: '[slGrid]',
  standalone: true,
  exportAs: 'slGrid',
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/grid/grid.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'grid',
    'data-ui-grid': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-gap]': 'gap() ?? null',
    '[attr.data-columns]': 'columns() ?? null',
    '[attr.data-min-item-width]': 'minItemWidth() ?? null',
    '[attr.data-align]': 'align() ?? null',
    /* `align` is also an obsolete HTML attribute a browser still honours on a
       div, centring its text; written statically for the input it would stay. */
    '[attr.align]': 'null',
    '[attr.data-justify]': 'justify() ?? null',
    '[style.--slotted-grid-columns]': 'columns() ?? null',
  },
})
export class SlGrid {
  /** Positions a child across the flow, inside its own cell. */
  readonly align = input<GridAlign>();
  /** At most this many tracks. Absent, the grid fits as many as it can. */
  readonly columns = input<GridColumns>();
  /** Separation between cells, as a step on the space scale. */
  readonly gap = input<GridGap>();
  /** Positions a child along the flow, inside its own cell. */
  readonly justify = input<GridJustify>();
  /** The narrowest a cell may become before a column is dropped. */
  readonly minItemWidth = input<GridMinItemWidth>();
}
