import { Component } from '@angular/core';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlInline } from '@slotted/angular/inline';
import { SlShortcut } from '@slotted/angular/kbd';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-kbd-commands',
  imports: [SlCard, SlCardBody, SlInline, SlShortcut, SlStack, SlText],
  template: `
    <div slCard>
      <div slCardBody>
        <div slStack [gap]="3">
          <div slInline justify="between" align="center">
            <p slText>Open command palette</p>
            <kbd slShortcut keys="mod+k" size="sm" variant="plain"></kbd>
          </div>
          <div slInline justify="between" align="center">
            <p slText>Duplicate order</p>
            <kbd slShortcut keys="mod+d" size="sm" variant="plain"></kbd>
          </div>
          <div slInline justify="between" align="center">
            <p slText>Archive order</p>
            <kbd slShortcut keys="mod+shift+a" size="sm" variant="plain"></kbd>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class KbdCommands {}
