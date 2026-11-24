import { Component } from '@angular/core';
import { SlTree } from '@slotted/angular/tree';

interface OrderNode {
  id: string;
  name: string;
  children?: OrderNode[];
}

const MONTHS: OrderNode[] = Array.from({ length: 24 }, (_, month) => {
  const id = `${2025 + Math.floor(month / 12)}-${String((month % 12) + 1).padStart(2, '0')}`;
  return {
    id,
    name: id,
    children: Array.from({ length: 150 }, (_entry, index) => ({
      id: `${id}-${index}`,
      name: `SO-${10000 + month * 150 + index}`,
    })),
  };
});

@Component({
  selector: 'app-tree-virtualization',
  imports: [SlTree],
  template: `
    <div
      slTree
      aria-label="Orders by month"
      variant="framed"
      virtual
      [itemSize]="34"
      [expandedKeys]="open"
      [nodes]="months"
      [getKey]="key"
      [getLabel]="name"
      [getChildren]="children"
    ></div>
  `,
})
export class TreeVirtualization {
  protected readonly months = MONTHS;
  protected readonly key = (node: OrderNode) => node.id;
  protected readonly name = (node: OrderNode) => node.name;
  protected readonly children = (node: OrderNode) => node.children;
  protected readonly open = MONTHS.map((month) => month.id);
}
