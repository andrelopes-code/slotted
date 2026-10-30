import { Directive, inject, input, TemplateRef } from '@angular/core';

/**
 * The surfaces a consumer replaces, each an `ng-template` the grid reads
 * through `contentChildren` and renders only for the cells it mounts. A
 * column-scoped template names the column; one with no name serves every
 * column that has none of its own.
 */
@Directive({ selector: 'ng-template[slDataGridCell]', standalone: true })
export class SlDataGridCellTemplate {
  /** The column id, or empty for every column. */
  readonly slDataGridCell = input<string>('');
  readonly template = inject(TemplateRef);
}

@Directive({ selector: 'ng-template[slDataGridEditor]', standalone: true })
export class SlDataGridEditorTemplate {
  readonly slDataGridEditor = input<string>('');
  readonly template = inject(TemplateRef);
}

@Directive({ selector: 'ng-template[slDataGridHeader]', standalone: true })
export class SlDataGridHeaderTemplate {
  readonly slDataGridHeader = input<string>('');
  readonly template = inject(TemplateRef);
}

/**
 * A column's help, opened from its column-help button in a popover under the
 * column's `description`. Named by column: a help for every column is a
 * description, and `GridColumn.description` already says that.
 */
@Directive({ selector: 'ng-template[slDataGridColumnHelp]', standalone: true })
export class SlDataGridColumnHelp {
  /** The column id. */
  readonly slDataGridColumnHelp = input.required<string>();
  readonly template = inject(TemplateRef);
}

@Directive({ selector: 'ng-template[slDataGridFilter]', standalone: true })
export class SlDataGridFilterTemplate {
  readonly slDataGridFilter = input<string>('');
  readonly template = inject(TemplateRef);
}

/** A row's detail; its presence draws the expander column. */
@Directive({ selector: 'ng-template[slDataGridDetail]', standalone: true })
export class SlDataGridDetailTemplate {
  readonly template = inject(TemplateRef);
}

@Directive({ selector: 'ng-template[slDataGridGroup]', standalone: true })
export class SlDataGridGroupTemplate {
  readonly template = inject(TemplateRef);
}

/** The empty, no-results or error state in place of the family's result-state. */
@Directive({ selector: 'ng-template[slDataGridEmpty]', standalone: true })
export class SlDataGridEmptyTemplate {
  readonly template = inject(TemplateRef);
}

/** What stands in the bar under the grid: pagination, a count. */
@Directive({ selector: '[slDataGridFooter]', standalone: true })
export class SlDataGridFooter {}
