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
  SlPopoverClose,
  SlPopoverContent,
  SlPopoverDescription,
  SlPopoverHeader,
  SlPopoverLayer,
  SlPopoverTitle,
  SlPopoverTrigger,
} from '@slotted/angular/popover';

@Component({
  selector: 'app-popover-basic',
  imports: [
    SlButton,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlPopover,
    SlPopoverArrow,
    SlPopoverBody,
    SlPopoverClose,
    SlPopoverContent,
    SlPopoverDescription,
    SlPopoverHeader,
    SlPopoverLayer,
    SlPopoverTitle,
    SlPopoverTrigger,
  ],
  template: `
    <ng-container slPopover>
      <button slButton tone="secondary" variant="outline" slPopoverTrigger>Chai stock</button>
      <ng-template slPopoverLayer>
        <div slPopoverContent>
          <div slPopoverHeader>
            <div slPopoverTitle>Chai</div>
            <p slPopoverDescription>SKU NW-1001, Seattle warehouse</p>
            <button slPopoverClose></button>
          </div>
          <div slPopoverBody>
            <div slDescriptionList>
              @for (row of stock; track row.term) {
                <div slDescriptionListItem>
                  <dt slDescriptionListTerm>{{ row.term }}</dt>
                  <dd slDescriptionListDescription>{{ row.value }}</dd>
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
export class PopoverBasic {
  readonly stock = [
    { term: 'On hand', value: '39 units' },
    { term: 'Reserved', value: '12 units' },
    { term: 'Reorder point', value: '25 units' },
    { term: 'Next delivery', value: 'Oct 14, Exotic Liquids' },
  ];
}
