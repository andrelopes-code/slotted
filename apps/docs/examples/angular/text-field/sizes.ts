import { Component } from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput, SlTextFieldStart } from '@slotted/angular/text-field';

@Component({
  selector: 'app-text-field-sizes',
  imports: [SlGlyph, SlIcon, SlStack, SlTextField, SlTextFieldInput, SlTextFieldStart],
  template: `
    <div slStack [gap]="4">
      <div slTextField size="sm">
        <span slTextFieldStart>
          <span slIcon><svg slGlyph name="search"></svg></span>
        </span>
        <input
          slTextFieldInput
          type="search"
          aria-label="Filter order lines"
          placeholder="Filter order lines"
        />
      </div>
      <div slTextField size="md">
        <span slTextFieldStart>
          <span slIcon><svg slGlyph name="search"></svg></span>
        </span>
        <input
          slTextFieldInput
          type="search"
          aria-label="Search customers"
          placeholder="Search customers"
        />
      </div>
      <div slTextField size="lg">
        <span slTextFieldStart>
          <span slIcon><svg slGlyph name="search"></svg></span>
        </span>
        <input
          slTextFieldInput
          type="search"
          aria-label="Search the catalog"
          placeholder="Search the catalog"
        />
      </div>
    </div>
  `,
})
export class TextFieldSizes {}
