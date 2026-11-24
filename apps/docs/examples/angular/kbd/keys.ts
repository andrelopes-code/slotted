import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlKbd } from '@slotted/angular/kbd';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-kbd-keys',
  imports: [SlInline, SlKbd, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      <div slInline justify="between" align="center">
        <p slText>Next field</p>
        <kbd slKbd keyName="tab"></kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>Close the panel</p>
        <kbd slKbd keyName="esc"></kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>Previous order</p>
        <kbd slKbd keyName="up"></kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>Refresh the list</p>
        <kbd slKbd keyName="f5"></kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>Open the row menu</p>
        <kbd slKbd>Right click</kbd>
      </div>
    </div>
  `,
})
export class KbdKeys {}
