import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlKbd, SlShortcut } from '@slotted/angular/kbd';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-kbd-states',
  imports: [SlInline, SlKbd, SlShortcut, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      <div slInline justify="between" align="center">
        <p slText>Approve payment run</p>
        <kbd slShortcut keys="mod+enter"></kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>Reverse posting</p>
        <kbd slShortcut keys="mod+shift+r" disabled></kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>Dispatch to carrier</p>
        <kbd slKbd keyName="enter" disabled></kbd>
      </div>
    </div>
  `,
})
export class KbdStates {}
