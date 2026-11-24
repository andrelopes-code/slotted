import { Component } from '@angular/core';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlTag, SlTagBody, SlTagEnd, SlTagStart } from '@slotted/angular/tag';

@Component({
  selector: 'app-tag-content',
  imports: [SlGlyph, SlInline, SlTag, SlTagBody, SlTagEnd, SlTagStart],
  template: `
    <div slInline [gap]="2">
      <span slTag tone="warning">
        <span slTagBody>
          <span slTagStart><svg slGlyph name="clock"></svg></span>
          Due Friday
        </span>
      </span>
      <span slTag>
        <span slTagBody>
          Contract price
          <span slTagEnd><svg slGlyph name="lock"></svg></span>
        </span>
      </span>
      <span slTag tone="success">
        <span slTagBody>
          <span slTagStart><svg slGlyph name="pin"></svg></span>
          Verified address
          <span slTagEnd><svg slGlyph name="circle-check"></svg></span>
        </span>
      </span>
    </div>
  `,
})
export class TagContent {}
