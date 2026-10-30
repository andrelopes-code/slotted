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
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

const RATES = [
  { term: 'UPS Ground', value: '$38.40, 3 business days' },
  { term: 'FedEx Home Delivery', value: '$41.15, 3 business days' },
  { term: 'UPS 2nd Day Air', value: '$96.80, 2 business days' },
  { term: 'FedEx Priority Overnight', value: '$184.25, next business day' },
];

@Component({
  selector: 'app-drawer-non-modal',
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
    SlField,
    SlFieldDescription,
    SlFieldLabel,
    SlInline,
    SlStack,
    SlTextField,
    SlTextFieldInput,
  ],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Shipping charge</label>
        <div slTextField>
          <input slTextFieldInput inputmode="decimal" placeholder="0.00" />
        </div>
        <span slFieldDescription>Charged to Contoso Foods on invoice INV-2041.</span>
      </div>
      <div slInline>
        <button slButton size="sm" tone="secondary" variant="outline" [slDrawerTrigger]="drawer">
          Show carrier rates
        </button>
      </div>
      <sl-drawer #drawer="slDrawer" [modal]="false" outsidePress="none" [scrimFrom]="1" size="sm">
        <header slDrawerHeader>
          <h2 slDrawerTitle>Carrier rates</h2>
          <p slDrawerDescription>3 packages, 18.4 kg, Reno to Seattle.</p>
          <button slDrawerClose></button>
        </header>
        <div slDrawerBody>
          <div slDescriptionList>
            @for (rate of rates; track rate.term) {
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>{{ rate.term }}</dt>
                <dd slDescriptionListDescription>{{ rate.value }}</dd>
              </div>
            }
          </div>
        </div>
      </sl-drawer>
    </div>
  `,
})
export class DrawerNonModal {
  readonly rates = RATES;
}
