import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlSelect } from '@slotted/angular/select';

@Component({
  selector: 'app-select-empty',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlSelect],
  template: `
    <div slField>
      <label slFieldLabel>Purchase order to receive</label>
      <sl-select
        placeholder="Choose a purchase order"
        [messages]="{ empty: 'No open purchase orders for Kiln & Co.' }"
      ></sl-select>
      <span slFieldDescription>Only orders awaiting receipt are listed.</span>
    </div>
  `,
})
export class SelectEmpty {}
