import { Component } from '@angular/core';
import { provideCheckboxDefaults, SlCheckbox } from '@slotted/angular/checkbox';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-checkbox-defaults',
  imports: [SlCheckbox, SlStack],
  providers: [provideCheckboxDefaults({ size: 'sm', labelPlacement: 'start' })],
  template: `
    <div slStack [gap]="2">
      <div slCheckbox defaultChecked>Show prices with tax</div>
      <div slCheckbox>Show discontinued products</div>
      <div slCheckbox defaultChecked>Group orders by customer</div>
    </div>
  `,
})
export class CheckboxDefaults {}
