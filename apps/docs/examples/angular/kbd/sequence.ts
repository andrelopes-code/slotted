import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlShortcut } from '@slotted/angular/kbd';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-kbd-sequence',
  imports: [SlInline, SlShortcut, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      <div slInline justify="between" align="center">
        <p slText>Go to the inbox</p>
        <kbd slShortcut keys="g i"></kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>Go to orders</p>
        <kbd slShortcut keys="g o"></kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>Shortcuts</p>
        <kbd slShortcut keys="mod+k mod+s"></kbd>
      </div>
    </div>
  `,
})
export class KbdSequence {}
