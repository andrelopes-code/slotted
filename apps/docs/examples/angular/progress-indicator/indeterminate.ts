import { Component } from '@angular/core';
import { SlProgressBar, SlProgressCircle } from '@slotted/angular/progress-indicator';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-progress-indicator-indeterminate',
  imports: [SlProgressBar, SlProgressCircle, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slProgressBar label="Preparing your export"></div>
      <div slProgressCircle label="Checking availability"></div>
    </div>
  `,
})
export class ProgressIndicatorIndeterminate {}
