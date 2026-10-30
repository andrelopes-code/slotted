import { Component } from '@angular/core';
import { SlCheckbox, SlCheckboxDescription } from '@slotted/angular/checkbox';
import { SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';

@Component({
  selector: 'app-checkbox-group-descriptions',
  imports: [SlCheckbox, SlCheckboxDescription, SlCheckboxGroup, SlFieldGroup, SlFieldGroupLegend],
  template: `
    <fieldset slFieldGroup>
      <legend slFieldGroupLegend>When stock runs low</legend>
      <div slCheckboxGroup [defaultValue]="['alert']">
        <div slCheckbox value="alert">
          Alert the buyer
          <p slCheckboxDescription>
            Sent to the buyer for the SKU when on-hand drops below the reorder point.
          </p>
        </div>
        <div slCheckbox value="draft-po">
          Draft a purchase order
          <p slCheckboxDescription>
            Created for the preferred supplier at the usual order quantity, waiting for approval.
          </p>
        </div>
        <div slCheckbox value="hide">
          Stop selling online at zero
          <p slCheckboxDescription>
            The product page shows Out of stock instead of a delivery date.
          </p>
        </div>
      </div>
    </fieldset>
  `,
})
export class CheckboxGroupDescriptions {}
