import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlLoader, SlProgressBar, SlProgressCircle } from '@slotted/angular/progress-indicator';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-progress-indicator-sizes',
  imports: [SlInline, SlLoader, SlProgressBar, SlProgressCircle, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slProgressBar label="Small" showValue size="sm" [value]="55"></div>
      <div slProgressBar label="Medium" showValue size="md" [value]="55"></div>
      <div slProgressBar label="Large" showValue size="lg" [value]="55"></div>
      <div slInline align="center" [gap]="4">
        <div slProgressCircle hideLabel label="Small ring" size="sm" [value]="55"></div>
        <div slProgressCircle hideLabel label="Medium ring" size="md" [value]="55"></div>
        <div slProgressCircle hideLabel label="Large ring" size="lg" [value]="55"></div>
      </div>
      <div slInline align="center" [gap]="4">
        <div slLoader hideLabel label="Small loader" size="sm"></div>
        <div slLoader hideLabel label="Medium loader" size="md"></div>
        <div slLoader hideLabel label="Large loader" size="lg"></div>
      </div>
    </div>
  `,
})
export class ProgressIndicatorSizes {}
