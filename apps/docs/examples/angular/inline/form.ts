import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-inline-form',
  imports: [SlButton, SlField, SlFieldLabel, SlInline, SlTextField, SlTextFieldInput],
  template: `
    <form
      slInline
      align="end"
      [gap]="3"
      aria-label="Find orders"
      (submit)="$event.preventDefault()"
    >
      <div slField>
        <label slFieldLabel>Order number</label>
        <div slTextField>
          <input slTextFieldInput placeholder="SO-10482" />
        </div>
      </div>
      <div slField>
        <label slFieldLabel>Customer</label>
        <div slTextField>
          <input slTextFieldInput placeholder="Harbor Street store" />
        </div>
      </div>
      <button slButton type="submit">Search</button>
    </form>
  `,
})
export class InlineForm {}
