import { Component, signal } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlMenu, SlMenuItem, SlMenuRadioGroup, SlMenuTrigger } from '@slotted/angular/menu';
import {
  SlTextField,
  SlTextFieldAction,
  SlTextFieldInput,
  SlTextFieldStart,
} from '@slotted/angular/text-field';
import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';

@Component({
  selector: 'app-text-field-menu',
  imports: [
    SlField,
    SlFieldLabel,
    SlGlyph,
    SlIcon,
    SlMenu,
    SlMenuItem,
    SlMenuRadioGroup,
    SlMenuTrigger,
    SlTextField,
    SlTextFieldAction,
    SlTextFieldInput,
    SlTextFieldStart,
    SlVisuallyHidden,
  ],
  template: `
    <div slField>
      <label slFieldLabel>Phone</label>
      <div slTextField>
        <span slTextFieldStart>
          <button slTextFieldAction [slMenuTriggerFor]="countries">
            <span slVisuallyHidden>Country code</span>{{ country() }}
            <span slIcon><svg slGlyph name="chevron-down"></svg></span>
          </button>
        </span>
        <input
          slTextFieldInput
          type="tel"
          autocomplete="tel-national"
          defaultValue="206 555 0134"
        />
      </div>
      <sl-menu #countries>
        <sl-menu-radio-group [(value)]="country">
          <button slMenuRadioItem value="+1">United States +1</button>
          <button slMenuRadioItem value="+44">United Kingdom +44</button>
          <button slMenuRadioItem value="+49">Germany +49</button>
          <button slMenuRadioItem value="+81">Japan +81</button>
        </sl-menu-radio-group>
      </sl-menu>
    </div>
  `,
})
export class TextFieldMenu {
  protected readonly country = signal('+1');
}
