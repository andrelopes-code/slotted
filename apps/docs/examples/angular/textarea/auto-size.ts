import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlTextarea } from '@slotted/angular/textarea';

@Component({
  selector: 'app-textarea-auto-size',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlTextarea],
  template: `
    <div slField>
      <label slFieldLabel>Picking note</label>
      <textarea
        slTextarea
        autoSize
        [rows]="2"
        [maxRows]="6"
        defaultValue="Use the reinforced boxes for the olive oil."
      ></textarea>
      <span slFieldDescription>Shown to the picker on the warehouse screen.</span>
    </div>
  `,
})
export class TextareaAutoSize {}
