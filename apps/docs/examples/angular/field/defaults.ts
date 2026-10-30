import { Component } from '@angular/core';
import { provideFieldDefaults, SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-field-defaults',
  imports: [SlField, SlFieldLabel, SlStack, SlTextField, SlTextFieldInput],
  providers: [provideFieldDefaults({ size: 'sm', labelPlacement: 'side', necessity: 'optional' })],
  template: `
    <div slStack [gap]="3">
      <div slField required>
        <label slFieldLabel>Warehouse</label>
        <div slTextField><input slTextFieldInput defaultValue="Seattle — Pier 91" /></div>
      </div>
      <div slField required>
        <label slFieldLabel>Bin location</label>
        <div slTextField><input slTextFieldInput defaultValue="A-14-03" /></div>
      </div>
      <div slField>
        <label slFieldLabel>Picking note</label>
        <div slTextField><input slTextFieldInput /></div>
      </div>
    </div>
  `,
})
export class FieldDefaults {}
