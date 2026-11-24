import { Component } from '@angular/core';
import { SlTree, SlTreeCell, SlTreeMeta } from '@slotted/angular/tree';

interface AccountRow {
  code: string;
  name: string;
  level: number;
}

const CHART: AccountRow[] = [
  { code: '1000', name: 'Assets', level: 0 },
  { code: '1100', name: 'Cash and equivalents', level: 1 },
  { code: '1110', name: 'Operating account', level: 2 },
  { code: '1120', name: 'Payroll account', level: 2 },
  { code: '1200', name: 'Receivables', level: 1 },
  { code: '2000', name: 'Liabilities', level: 0 },
  { code: '2100', name: 'Payables', level: 1 },
];

@Component({
  selector: 'app-tree-flat-rows',
  imports: [SlTree, SlTreeCell, SlTreeMeta],
  template: `
    <div
      slTree
      aria-label="Chart of accounts"
      [expandedKeys]="['1000', '1100']"
      [nodes]="rows"
      [getKey]="code"
      [getLabel]="name"
      [getLevel]="level"
    >
      <ng-template slTreeCell="meta" let-row [slTreeCellOf]="rows"
        ><span slTreeMeta>{{ row.code }}</span></ng-template
      >
    </div>
  `,
})
export class TreeFlatRows {
  protected readonly rows = CHART;
  protected readonly code = (row: AccountRow) => row.code;
  protected readonly name = (row: AccountRow) => row.name;
  protected readonly level = (row: AccountRow) => row.level;
}
