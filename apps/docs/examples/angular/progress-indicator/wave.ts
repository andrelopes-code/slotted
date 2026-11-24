import { Component } from '@angular/core';
import { SlProgressBar, SlProgressCircle } from '@slotted/angular/progress-indicator';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-progress-indicator-wave',
  imports: [SlProgressBar, SlProgressCircle, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slProgressBar label="Rendering the report" showValue size="lg" wave [value]="62"></div>
      <div slProgressBar label="Preparing your export" size="lg" wave></div>
      <div
        slProgressCircle
        label="Rendering the report"
        showValue
        size="lg"
        wave
        [value]="62"
      ></div>
    </div>
  `,
})
export class ProgressIndicatorWave {}
