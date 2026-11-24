import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlInlineMessage } from '@slotted/angular/inline-message';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';

@Component({
  selector: 'app-inline-message-reserve',
  imports: [SlInline, SlInlineMessage, SlStack, SlTextField, SlTextFieldInput],
  template: `
    <div slInline [gap]="4">
      <div slStack [gap]="2">
        <div slTextField>
          <input slTextFieldInput aria-label="Units, Rotterdam" value="120" />
        </div>
        <p slInlineMessage reserve tone="danger"></p>
        <div slTextField>
          <input slTextFieldInput aria-label="Reorder point, Rotterdam" value="40" />
        </div>
      </div>
      <div slStack [gap]="2">
        <div slTextField>
          <input slTextFieldInput aria-label="Units, Antwerp" value="900" />
        </div>
        <p slInlineMessage reserve tone="danger">Order at most 500 units at once.</p>
        <div slTextField>
          <input slTextFieldInput aria-label="Reorder point, Antwerp" value="60" />
        </div>
      </div>
    </div>
  `,
})
export class InlineMessageReserve {}
