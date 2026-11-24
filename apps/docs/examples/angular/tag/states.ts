import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlTag, SlTagBody, SlTagRemove } from '@slotted/angular/tag';

@Component({
  selector: 'app-tag-states',
  imports: [SlInline, SlTag, SlTagBody, SlTagRemove],
  template: `
    <div slInline [gap]="2">
      <span slTag disabled removable>
        <span slTagBody>Archived</span>
        <button slTagRemove></button>
      </span>
      <span slTag removable removeDisabled>
        <span slTagBody>Required</span>
        <button slTagRemove></button>
      </span>
      <span slTag disabled><button slTagBody>Assign owner</button></span>
      <span slTag disabled><a slTagBody href="#carrier-portal">Carrier portal</a></span>
    </div>
  `,
})
export class TagStates {}
