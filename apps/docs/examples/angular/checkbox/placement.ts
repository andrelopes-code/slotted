import { Component } from '@angular/core';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-checkbox-placement',
  imports: [SlCheckbox, SlStack],
  template: `
    <div slStack [gap]="3">
      <div slCheckbox labelPlacement="start" defaultChecked>Email when an order ships</div>
      <div slCheckbox labelPlacement="start">Email when stock runs low</div>
      <div slCheckbox labelPlacement="start" defaultChecked>Weekly sales digest</div>
    </div>
  `,
})
export class CheckboxPlacement {}
