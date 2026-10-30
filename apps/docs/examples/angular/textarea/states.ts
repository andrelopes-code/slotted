import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextarea } from '@slotted/angular/textarea';

@Component({
  selector: 'app-textarea-states',
  imports: [SlField, SlFieldDescription, SlFieldError, SlFieldLabel, SlStack, SlTextarea],
  template: `
    <div slStack [gap]="5">
      <div slField invalid required>
        <label slFieldLabel>Damage report</label>
        <textarea slTextarea [rows]="2" defaultValue="Box dented."></textarea>
        <span slFieldError>Describe the damage in at least 20 characters.</span>
      </div>
      <div slField readOnly>
        <label slFieldLabel>Customer note</label>
        <textarea
          slTextarea
          [rows]="2"
          defaultValue="Please ring the bell twice. The office is on the second floor."
        ></textarea>
        <span slFieldDescription>Written by the customer at checkout.</span>
      </div>
      <div slField disabled>
        <label slFieldLabel>Carrier instructions</label>
        <textarea slTextarea [rows]="2" defaultValue="Leave with the building manager."></textarea>
        <span slFieldDescription>Locked once the shipment is booked.</span>
      </div>
    </div>
  `,
})
export class TextareaStates {}
