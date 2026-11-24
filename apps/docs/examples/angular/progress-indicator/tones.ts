import { Component } from '@angular/core';
import { SlProgressBar } from '@slotted/angular/progress-indicator';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-progress-indicator-tones',
  imports: [SlProgressBar, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slProgressBar label="Uploading invoices" showValue [value]="62"></div>
      <div
        slProgressBar
        label="Reindexing the catalog"
        showValue
        tone="secondary"
        [value]="62"
      ></div>
      <div slProgressBar label="Syncing carrier rates" showValue tone="info" [value]="62"></div>
      <div slProgressBar label="Backup complete" showValue tone="success" [value]="100"></div>
      <div slProgressBar label="Storage used" showValue tone="warning" [value]="88"></div>
      <div slProgressBar label="Transfer failed" showValue tone="danger" [value]="41"></div>
    </div>
  `,
})
export class ProgressIndicatorTones {}
