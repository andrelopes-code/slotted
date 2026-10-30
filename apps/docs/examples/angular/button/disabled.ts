import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-button-disabled',
  imports: [SlButton, SlInline, SlStack, SlText],
  template: `
    <div slStack [gap]="2">
      <div slInline [gap]="2">
        <button slButton disabled tone="secondary" variant="outline">Export</button>
        <button slButton aria-describedby="submit-hint" disabled focusableWhenDisabled>
          Submit for approval
        </button>
      </div>
      <span slText id="submit-hint" size="sm" tone="muted">
        Add at least one line item before submitting.
      </span>
    </div>
  `,
})
export class ButtonDisabled {}
