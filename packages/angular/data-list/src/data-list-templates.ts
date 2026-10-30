import { Directive, inject, input, TemplateRef } from '@angular/core';
import type { GridColumn } from '@slotted/core/grid';

import type { DataListEmptyStatus } from './data-list-defaults';

/** What a value template receives: the cell's own context, and where it is drawn. */
export interface DataListCellContext<Row = unknown> {
  readonly $implicit: Row;
  readonly row: Row;
  readonly column: GridColumn<Row>;
  readonly key: string;
  readonly value: unknown;
  /** The formatted text; `''` for an absent value. */
  readonly text: string;
  readonly place: 'title' | 'subtitle' | 'trailing' | 'field' | 'actions';
}

/**
 * Draws a column's value wherever the record shows it: title, subtitle,
 * trailing value, field or actions. A template with no column id serves every
 * column that has none of its own.
 */
@Directive({ selector: 'ng-template[slDataListCell]', standalone: true })
export class SlDataListCellTemplate {
  /** The column id, or empty for every column. */
  readonly slDataListCell = input<string>('');
  readonly template = inject<TemplateRef<DataListCellContext>>(TemplateRef);
}

/** The picture at the start of a record: an avatar, a thumbnail. */
@Directive({ selector: 'ng-template[slDataListMedia]', standalone: true })
export class SlDataListMediaTemplate {
  readonly template = inject<TemplateRef<{ $implicit: unknown }>>(TemplateRef);
}

/** Replaces the empty, no-results or error state. */
@Directive({ selector: 'ng-template[slDataListEmpty]', standalone: true })
export class SlDataListEmptyTemplate {
  readonly template = inject<TemplateRef<{ $implicit: DataListEmptyStatus }>>(TemplateRef);
}
