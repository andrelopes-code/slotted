import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';
import { SlTextarea } from '@slotted/angular/textarea';

@Component({
  selector: 'app-textarea-rows',
  imports: [SlField, SlFieldLabel, SlStack, SlTextarea],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Gift message</label>
        <textarea
          slTextarea
          [rows]="2"
          resize="none"
          defaultValue="Happy birthday, Laura. Enjoy the tea."
        ></textarea>
      </div>
      <div slField>
        <label slFieldLabel>Incident report</label>
        <textarea
          slTextarea
          [rows]="5"
          placeholder="What happened, when, and who was involved"
        ></textarea>
      </div>
      <div slField>
        <label slFieldLabel>Reply draft</label>
        <textarea
          slTextarea
          resize="both"
          placeholder="Drag the corner to resize in both directions"
        ></textarea>
      </div>
    </div>
  `,
})
export class TextareaRows {}
