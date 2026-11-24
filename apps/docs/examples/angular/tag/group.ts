import { Component } from '@angular/core';
import { SlTag, SlTagBody, SlTagGroup } from '@slotted/angular/tag';

@Component({
  selector: 'app-tag-group',
  imports: [SlTag, SlTagBody, SlTagGroup],
  template: `
    <div slTagGroup orientation="vertical" aria-label="Saved order views" [loop]="false">
      <span slTag><button slTagBody>All orders</button></span>
      <span slTag><button slTagBody>Late deliveries</button></span>
      <span slTag><button slTagBody>Awaiting payment</button></span>
      <span slTag><button slTagBody>Returns in transit</button></span>
    </div>
  `,
})
export class TagGroupExample {}
