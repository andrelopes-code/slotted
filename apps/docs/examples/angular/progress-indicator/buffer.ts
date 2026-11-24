import { Component } from '@angular/core';
import { SlProgressBar } from '@slotted/angular/progress-indicator';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-progress-indicator-buffer',
  imports: [SlProgressBar, SlStack],
  template: `
    <div slStack [gap]="5">
      <div
        slProgressBar
        label="Processing uploaded pages"
        showValue
        size="lg"
        [buffer]="72"
        [value]="34"
      ></div>
      <div
        slProgressBar
        label="The same value without a buffer"
        showValue
        size="lg"
        [value]="34"
      ></div>
    </div>
  `,
})
export class ProgressIndicatorBuffer {}
