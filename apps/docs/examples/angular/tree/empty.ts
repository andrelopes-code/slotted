import { Component } from '@angular/core';
import { SlTree, SlTreeEmpty } from '@slotted/angular/tree';

@Component({
  selector: 'app-tree-empty',
  imports: [SlTree, SlTreeEmpty],
  template: `
    <div slTree aria-label="Archived categories" variant="framed" [nodes]="[]" [getKey]="key">
      <div slTreeEmpty>No archived categories</div>
    </div>
  `,
})
export class TreeEmpty {
  protected readonly key = (category: { id: string }) => category.id;
}
