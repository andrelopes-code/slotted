import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlTextarea } from '@slotted/angular/textarea';

const TERMS = `1. Payment. Invoices are payable within 30 days of the invoice date. Late payments carry interest of 1% per month.

2. Delivery. The supplier ships within five business days of a confirmed purchase order. Partial shipments are invoiced separately.

3. Returns. Goods damaged in transit are reported within 48 hours of receipt, with photographs of the packaging.

4. Prices. Prices are fixed for the term of this agreement and reviewed every January.

5. Termination. Either party may end this agreement with 60 days' written notice.`;

@Component({
  selector: 'app-textarea-read-only',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlTextarea],
  template: `
    <div slField>
      <label slFieldLabel>Supplier terms</label>
      <textarea slTextarea readOnly [rows]="6" [defaultValue]="terms"></textarea>
      <span slFieldDescription>Agreed with Exotic Liquids on 3 March 2026.</span>
    </div>
  `,
})
export class TextareaReadOnly {
  readonly terms = TERMS;
}
