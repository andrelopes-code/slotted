import { Component } from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlTextField, SlTextFieldInput, SlTextFieldStart } from '@slotted/angular/text-field';

@Component({
  selector: 'app-text-field-clearable',
  imports: [SlGlyph, SlIcon, SlTextField, SlTextFieldInput, SlTextFieldStart],
  template: `
    <div slTextField clearable>
      <span slTextFieldStart>
        <span slIcon><svg slGlyph name="search"></svg></span>
      </span>
      <input
        slTextFieldInput
        type="search"
        aria-label="Search invoices"
        enterkeyhint="search"
        defaultValue="invoice 2026"
      />
    </div>
  `,
})
export class TextFieldClearable {}
