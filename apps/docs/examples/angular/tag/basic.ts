import { Component } from '@angular/core';
import { SlTag, SlTagBody, SlTagGroup } from '@slotted/angular/tag';

@Component({
  selector: 'app-tag-basic',
  imports: [SlTag, SlTagBody, SlTagGroup],
  template: `
    <div slTagGroup role="list" aria-label="Labels on order SO-10482">
      <span slTag><span slTagBody>Wholesale</span></span>
      <span slTag><span slTagBody>Fragile</span></span>
      <span slTag><span slTagBody>Priority shipping</span></span>
    </div>
  `,
})
export class TagBasic {}
