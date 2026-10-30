import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import {
  SlDrawer,
  SlDrawerBody,
  SlDrawerClose,
  SlDrawerDescription,
  SlDrawerHeader,
  SlDrawerTitle,
  SlDrawerTrigger,
} from '@slotted/angular/drawer';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';

const ORDER = [
  { term: 'Customer', value: 'Contoso Foods' },
  { term: 'Items', value: '14 cases, 3 products' },
  { term: 'Total', value: '$1,240.00' },
];

const CUSTOMER = [
  { term: 'Account', value: 'C-0042' },
  { term: 'Contact', value: 'Ana Ruiz, ap@contoso.com' },
  { term: 'Open orders', value: '3, $4,815.50 in total' },
  { term: 'Payment terms', value: 'Net 30' },
];

@Component({
  selector: 'app-drawer-nested',
  imports: [
    SlButton,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlDrawer,
    SlDrawerBody,
    SlDrawerClose,
    SlDrawerDescription,
    SlDrawerHeader,
    SlDrawerTitle,
    SlDrawerTrigger,
    SlInline,
    SlStack,
  ],
  template: `
    <button slButton tone="secondary" variant="outline" [slDrawerTrigger]="order">
      View order SO-1182
    </button>
    <sl-drawer #order="slDrawer">
      <header slDrawerHeader>
        <h2 slDrawerTitle>Order SO-1182</h2>
        <p slDrawerDescription>Placed on 2 October 2026.</p>
        <button slDrawerClose></button>
      </header>
      <div slDrawerBody>
        <div slStack [gap]="5">
          <div slDescriptionList>
            @for (detail of orderDetails; track detail.term) {
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>{{ detail.term }}</dt>
                <dd slDescriptionListDescription>{{ detail.value }}</dd>
              </div>
            }
          </div>
          <div slInline>
            <button
              slButton
              size="sm"
              tone="secondary"
              variant="outline"
              [slDrawerTrigger]="customer"
            >
              View customer
            </button>
          </div>
          <sl-drawer #customer="slDrawer" size="sm">
            <header slDrawerHeader>
              <h2 slDrawerTitle>Contoso Foods</h2>
              <p slDrawerDescription>Customer since March 2021.</p>
              <button slDrawerClose></button>
            </header>
            <div slDrawerBody>
              <div slDescriptionList>
                @for (detail of customerDetails; track detail.term) {
                  <div slDescriptionListItem>
                    <dt slDescriptionListTerm>{{ detail.term }}</dt>
                    <dd slDescriptionListDescription>{{ detail.value }}</dd>
                  </div>
                }
              </div>
            </div>
          </sl-drawer>
        </div>
      </div>
    </sl-drawer>
  `,
})
export class DrawerNested {
  readonly orderDetails = ORDER;
  readonly customerDetails = CUSTOMER;
}
