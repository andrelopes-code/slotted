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
  SlPopoverAnchor,
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverClose,
  SlPopoverContent,
  SlPopoverHeader,
  SlPopoverLayer,
  SlPopoverTitle,
  SlPopoverTrigger,
} from '@slotted/angular/popover';
import {
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';

@Component({
  selector: 'app-popover-table-row',
  imports: [
    SlButton,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlPopover,
    SlPopoverAnchor,
    SlPopoverArrow,
    SlPopoverBody,
    SlPopoverClose,
    SlPopoverContent,
    SlPopoverHeader,
    SlPopoverLayer,
    SlPopoverTitle,
    SlPopoverTrigger,
    SlTable,
    SlTableBody,
    SlTableCaption,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
  ],
  template: `
    <div slTable [columns]="3">
      <div slTableContent>
        <caption slTableCaption>
          Shipped orders
        </caption>
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader>Order</th>
            <th slTableColumnHeader>Customer</th>
            <th slTableColumnHeader>Shipment</th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (order of orders; track order.id) {
            <ng-container slPopover align="end">
              <tr slTableRow slPopoverAnchor [value]="order.id">
                <th slTableRowHeader>{{ order.id }}</th>
                <td slTableCell>{{ order.customer }}</td>
                <td slTableCell>
                  <button slButton size="sm" tone="secondary" variant="ghost" slPopoverTrigger>
                    Tracking
                  </button>
                </td>
              </tr>
              <ng-template slPopoverLayer>
                <div slPopoverContent>
                  <div slPopoverHeader>
                    <div slPopoverTitle>Order {{ order.id }} shipment</div>
                    <button slPopoverClose></button>
                  </div>
                  <div slPopoverBody>
                    <div slDescriptionList>
                      <div slDescriptionListItem>
                        <dt slDescriptionListTerm>Carrier</dt>
                        <dd slDescriptionListDescription>{{ order.carrier }}</dd>
                      </div>
                      <div slDescriptionListItem>
                        <dt slDescriptionListTerm>Tracking</dt>
                        <dd slDescriptionListDescription>{{ order.tracking }}</dd>
                      </div>
                      <div slDescriptionListItem>
                        <dt slDescriptionListTerm>Shipped</dt>
                        <dd slDescriptionListDescription>{{ order.shipped }}</dd>
                      </div>
                    </div>
                  </div>
                </div>
                <div slPopoverArrow></div>
              </ng-template>
            </ng-container>
          }
        </tbody>
      </div>
    </div>
  `,
})
export class PopoverTableRow {
  readonly orders = [
    {
      id: '10248',
      customer: 'Vins et alcools Chevalier',
      carrier: 'Federal Shipping',
      tracking: 'FS-4471-0921',
      shipped: 'Jul 16',
    },
    {
      id: '10249',
      customer: 'Toms Spezialitäten',
      carrier: 'Speedy Express',
      tracking: 'SE-2210-3384',
      shipped: 'Jul 10',
    },
    {
      id: '10250',
      customer: 'Hanari Carnes',
      carrier: 'United Package',
      tracking: 'UP-9035-1172',
      shipped: 'Jul 12',
    },
  ];
}
