import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlKbd } from '@slotted/angular/kbd';
import { SlStack } from '@slotted/angular/stack';
import {
  SlTextField,
  SlTextFieldEnd,
  SlTextFieldInput,
  SlTextFieldStart,
} from '@slotted/angular/text-field';

@Component({
  selector: 'app-text-field-adornments',
  imports: [
    SlField,
    SlFieldLabel,
    SlGlyph,
    SlIcon,
    SlKbd,
    SlStack,
    SlTextField,
    SlTextFieldEnd,
    SlTextFieldInput,
    SlTextFieldStart,
  ],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Unit price</label>
        <div slTextField>
          <span slTextFieldStart>$</span>
          <input slTextFieldInput inputmode="decimal" defaultValue="24.90" />
          <span slTextFieldEnd>USD</span>
        </div>
      </div>
      <div slField>
        <label slFieldLabel>Shipping weight</label>
        <div slTextField>
          <input slTextFieldInput inputmode="decimal" defaultValue="1.25" />
          <span slTextFieldEnd>kg</span>
        </div>
      </div>
      <div slField>
        <label slFieldLabel>Storefront address</label>
        <div slTextField>
          <span slTextFieldStart>https://</span>
          <input slTextFieldInput defaultValue="shop.northwind.com" />
        </div>
      </div>
      <div slTextField>
        <span slTextFieldStart>
          <span slIcon><svg slGlyph name="search"></svg></span>
        </span>
        <input
          slTextFieldInput
          type="search"
          aria-label="Search orders"
          placeholder="Search orders"
        />
        <span slTextFieldEnd><kbd slKbd>/</kbd></span>
      </div>
    </div>
  `,
})
export class TextFieldAdornments {}
