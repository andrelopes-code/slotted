import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-stack-form',
  imports: [SlButton, SlField, SlFieldLabel, SlInline, SlStack, SlTextField, SlTextFieldInput],
  template: `
    <form slStack [gap]="5" (submit)="$event.preventDefault()">
      <div slField required>
        <label slFieldLabel>Email</label>
        <div slTextField>
          <input slTextFieldInput type="email" autocomplete="email" />
        </div>
      </div>
      <div slField required>
        <label slFieldLabel>Password</label>
        <div slTextField>
          <input slTextFieldInput type="password" autocomplete="current-password" />
        </div>
      </div>
      <div slInline justify="end">
        <button slButton type="submit">Sign in</button>
      </div>
    </form>
  `,
})
export class StackForm {}
