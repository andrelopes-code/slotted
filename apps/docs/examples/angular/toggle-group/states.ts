import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlToggleGroup, SlToggleGroupItem } from '@slotted/angular/toggle-group';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-toggle-group-states',
  imports: [SlStack, SlText, SlToggleGroup, SlToggleGroupItem],
  template: `
    <div slStack [gap]="5">
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">One item unavailable</p>
        <div slToggleGroup aria-label="Export format" [defaultValue]="['csv']">
          <button slToggleGroupItem value="csv">CSV</button>
          <button slToggleGroupItem value="xlsx" disabled>XLSX</button>
          <button slToggleGroupItem value="pdf">PDF</button>
        </div>
      </div>
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">Unavailable while on</p>
        <div slToggleGroup aria-label="Invoice status" [defaultValue]="['approved']">
          <button slToggleGroupItem value="draft">Draft</button>
          <button slToggleGroupItem value="approved" disabled>Approved</button>
          <button slToggleGroupItem value="paid">Paid</button>
        </div>
      </div>
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">Whole group unavailable</p>
        <div slToggleGroup aria-label="Payment terms" disabled [defaultValue]="['net30']">
          <button slToggleGroupItem value="net15">Net 15</button>
          <button slToggleGroupItem value="net30">Net 30</button>
          <button slToggleGroupItem value="net60">Net 60</button>
        </div>
      </div>
    </div>
  `,
})
export class ToggleGroupStates {}
