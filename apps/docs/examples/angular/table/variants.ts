import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
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

const SHIPMENTS = [
  { id: 'SH-3301', carrier: 'UPS Ground', cartons: 12 },
  { id: 'SH-3302', carrier: 'FedEx Express', cartons: 3 },
  { id: 'SH-3303', carrier: 'USPS Priority', cartons: 1 },
];

const VARIANTS = [
  { variant: 'plain', caption: 'Plain: inside a card that already draws the box' },
  { variant: 'ruled', caption: 'Ruled: the default, a rule between rows' },
  { variant: 'framed', caption: 'Framed: the table is its own panel' },
] as const;

@Component({
  selector: 'app-table-variants',
  imports: [
    SlStack,
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
    <div slStack [gap]="6">
      @for (item of variants; track item.variant) {
        <div slTable [columns]="3" [variant]="item.variant">
          <div slTableContent>
            <caption slTableCaption>
              {{
                item.caption
              }}
            </caption>
            <thead slTableHead>
              <tr slTableRow>
                <th slTableColumnHeader>Shipment</th>
                <th slTableColumnHeader>Carrier</th>
                <th slTableColumnHeader numeric>Cartons</th>
              </tr>
            </thead>
            <tbody slTableBody>
              @for (shipment of shipments; track shipment.id) {
                <tr slTableRow [value]="shipment.id">
                  <th slTableRowHeader>{{ shipment.id }}</th>
                  <td slTableCell>{{ shipment.carrier }}</td>
                  <td slTableCell numeric>{{ shipment.cartons }}</td>
                </tr>
              }
            </tbody>
          </div>
        </div>
      }
    </div>
  `,
})
export class TableVariants {
  readonly shipments = SHIPMENTS;
  readonly variants = VARIANTS;
}
