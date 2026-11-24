import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlShortcut } from '@slotted/angular/kbd';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-kbd-words',
  imports: [SlInline, SlShortcut, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      <div slInline justify="between" align="center">
        <p slText>Remove row</p>
        <kbd
          slShortcut
          keys="mod+delete"
          [legends]="{ mod: 'Control', delete: 'Delete' }"
          [names]="{ delete: 'Remove' }"
          platform="windows"
        ></kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>Export report</p>
        <kbd slShortcut keys="mod+shift+e" platform="windows" separator="-"></kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>Go to inbox</p>
        <kbd slShortcut keys="g i" [messages]="{ then: 'followed by' }"></kbd>
      </div>
    </div>
  `,
})
export class KbdWords {}
