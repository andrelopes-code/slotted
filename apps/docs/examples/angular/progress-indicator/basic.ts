import { Component } from '@angular/core';
import { SlProgressBar } from '@slotted/angular/progress-indicator';

@Component({
  selector: 'app-progress-indicator-basic',
  imports: [SlProgressBar],
  template: `<div slProgressBar label="Uploading invoices" showValue [value]="40"></div>`,
})
export class ProgressIndicatorBasic {}
