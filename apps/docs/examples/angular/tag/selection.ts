import { Component } from '@angular/core';
import { SlTag, SlTagGroup, SlTagToggle } from '@slotted/angular/tag';

@Component({
  selector: 'app-tag-selection',
  imports: [SlTag, SlTagGroup, SlTagToggle],
  template: `
    <div slTagGroup aria-label="Order status">
      <span slTag tone="accent"><button slTagToggle defaultSelected>Open</button></span>
      <span slTag tone="accent"><button slTagToggle>Packed</button></span>
      <span slTag tone="accent"><button slTagToggle>Shipped</button></span>
      <span slTag tone="accent" disabled><button slTagToggle>Cancelled</button></span>
    </div>
  `,
})
export class TagSelection {}
