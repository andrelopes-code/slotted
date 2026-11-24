import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlKbd, SlShortcut } from '@slotted/angular/kbd';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-kbd-composition',
  imports: [SlInline, SlKbd, SlShortcut, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      <div slInline justify="between" align="center">
        <p slText>Select a range of rows</p>
        <kbd slShortcut platform="windows" size="sm" variant="soft">
          <kbd slKbd keyName="shift"></kbd>
          <kbd slKbd>Click</kbd>
        </kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>Add a row to the selection</p>
        <kbd slShortcut platform="windows" size="sm" variant="soft">
          <kbd slKbd keyName="mod"></kbd>
          <kbd slKbd>Click</kbd>
        </kbd>
      </div>
    </div>
  `,
})
export class KbdComposition {}
