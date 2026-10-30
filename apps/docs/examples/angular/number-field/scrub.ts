import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlGrid } from '@slotted/angular/grid';
import {
  SlNumberField,
  SlNumberFieldEnd,
  SlNumberFieldInput,
  SlNumberFieldScrub,
  SlNumberFieldStart,
} from '@slotted/angular/number-field';

@Component({
  selector: 'app-number-field-scrub',
  imports: [
    SlField,
    SlFieldLabel,
    SlGrid,
    SlNumberField,
    SlNumberFieldEnd,
    SlNumberFieldInput,
    SlNumberFieldScrub,
    SlNumberFieldStart,
  ],
  template: `
    <div slGrid [columns]="2" [gap]="4">
      <div slField>
        <label slFieldLabel>Label width</label>
        <div slNumberField>
          <span slNumberFieldStart><span slNumberFieldScrub>W</span></span>
          <input slNumberFieldInput defaultValue="100" min="20" max="210" />
          <span slNumberFieldEnd>mm</span>
        </div>
      </div>
      <div slField>
        <label slFieldLabel>Label height</label>
        <div slNumberField>
          <span slNumberFieldStart><span slNumberFieldScrub [sensitivity]="4">H</span></span>
          <input slNumberFieldInput defaultValue="150" min="20" max="297" />
          <span slNumberFieldEnd>mm</span>
        </div>
      </div>
    </div>
  `,
})
export class NumberFieldScrubExample {}
