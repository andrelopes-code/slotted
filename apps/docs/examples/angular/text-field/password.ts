import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlTextField, SlTextFieldInput, SlTextFieldStart } from '@slotted/angular/text-field';

@Component({
  selector: 'app-text-field-password',
  imports: [
    SlField,
    SlFieldDescription,
    SlFieldLabel,
    SlGlyph,
    SlIcon,
    SlTextField,
    SlTextFieldInput,
    SlTextFieldStart,
  ],
  template: `
    <div slField required>
      <label slFieldLabel>New password</label>
      <div slTextField revealable>
        <span slTextFieldStart>
          <span slIcon><svg slGlyph name="lock"></svg></span>
        </span>
        <input slTextFieldInput type="password" autocomplete="new-password" minlength="12" />
      </div>
      <span slFieldDescription>At least 12 characters.</span>
    </div>
  `,
})
export class TextFieldPassword {}
