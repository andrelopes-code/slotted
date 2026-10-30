import { Component } from '@angular/core';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-checkbox-sizes',
  imports: [SlCheckbox, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slCheckbox size="sm" defaultChecked>Show archived orders</div>
      <div slCheckbox size="md" defaultChecked>Notify the warehouse</div>
      <div slCheckbox size="lg" defaultChecked>Remember this device</div>
    </div>
  `,
})
export class CheckboxSizes {}
