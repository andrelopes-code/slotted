import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlKbd } from '@slotted/angular/kbd';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-kbd-sizes',
  imports: [SlHeading, SlInline, SlKbd, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <div slInline [gap]="3" align="center">
        <kbd slKbd keyName="escape" size="xs"></kbd>
        <kbd slKbd keyName="escape" size="sm"></kbd>
        <kbd slKbd keyName="escape" size="md"></kbd>
        <kbd slKbd keyName="escape" size="lg"></kbd>
      </div>
      <h3 slHeading size="md">
        Press <kbd slKbd keyName="escape" size="inherit"></kbd> to cancel the count
      </h3>
      <p slText size="sm">
        Press <kbd slKbd keyName="escape" size="inherit"></kbd> to discard the draft.
      </p>
    </div>
  `,
})
export class KbdSizes {}
