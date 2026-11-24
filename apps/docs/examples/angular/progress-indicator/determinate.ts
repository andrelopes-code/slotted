import { Component } from '@angular/core';
import { SlProgressBar } from '@slotted/angular/progress-indicator';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-progress-indicator-determinate',
  imports: [SlProgressBar, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slProgressBar label="Copying files" showValue [value]="40"></div>
      <div
        slProgressBar
        label="Pallets staged"
        showValue
        [max]="400"
        [min]="200"
        [value]="260"
      ></div>
      <div
        slProgressBar
        label="Downloading carrier manifest"
        showValue
        [format]="{ style: 'unit', unit: 'megabyte', unitDisplay: 'narrow' }"
        [max]="512"
        [value]="128"
      ></div>
      <div
        slProgressBar
        label="Importing orders"
        showValue
        valueText="3 of 7 files"
        [max]="7"
        [value]="3"
      ></div>
      <div slProgressBar label="Backup finished" showValue [value]="100"></div>
    </div>
  `,
})
export class ProgressIndicatorDeterminate {}
