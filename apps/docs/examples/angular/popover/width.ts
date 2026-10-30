import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import {
  SlPopover,
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverLayer,
  SlPopoverTrigger,
} from '@slotted/angular/popover';

@Component({
  selector: 'app-popover-width',
  imports: [
    SlButton,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlPopover,
    SlPopoverArrow,
    SlPopoverBody,
    SlPopoverContent,
    SlPopoverLayer,
    SlPopoverTrigger,
  ],
  template: `
    <ng-container slPopover align="start" width="anchor">
      <button slButton fullWidth tone="secondary" variant="outline" slPopoverTrigger>
        Chai, stock by warehouse
      </button>
      <ng-template slPopoverLayer>
        <div slPopoverContent aria-label="Chai stock by warehouse">
          <div slPopoverBody>
            <div slDescriptionList>
              @for (warehouse of warehouses; track warehouse.name) {
                <div slDescriptionListItem>
                  <dt slDescriptionListTerm>{{ warehouse.name }}</dt>
                  <dd slDescriptionListDescription>{{ warehouse.stock }}</dd>
                </div>
              }
            </div>
          </div>
        </div>
        <div slPopoverArrow></div>
      </ng-template>
    </ng-container>
  `,
})
export class PopoverWidth {
  readonly warehouses = [
    { name: 'Seattle', stock: '39 units' },
    { name: 'Tacoma', stock: '120 units' },
    { name: 'Portland', stock: 'Out of stock' },
  ];
}
