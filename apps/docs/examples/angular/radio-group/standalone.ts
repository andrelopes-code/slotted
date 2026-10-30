import { Component } from '@angular/core';
import { SlRadio, SlRadioGroup } from '@slotted/angular/radio-group';

@Component({
  selector: 'app-radio-group-standalone',
  imports: [SlRadio, SlRadioGroup],
  template: `
    <div slRadioGroup aria-label="Chart range" orientation="horizontal" size="sm" defaultValue="30">
      <div slRadio value="7">7 days</div>
      <div slRadio value="30">30 days</div>
      <div slRadio value="90">90 days</div>
    </div>
  `,
})
export class RadioGroupStandalone {}
