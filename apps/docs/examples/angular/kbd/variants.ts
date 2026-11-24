import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlShortcut } from '@slotted/angular/kbd';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-kbd-variants',
  imports: [SlInline, SlShortcut, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      <div slInline justify="between" align="center">
        <p slText>raised</p>
        <kbd slShortcut keys="mod+b" variant="raised"></kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>outline</p>
        <kbd slShortcut keys="mod+b" variant="outline"></kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>soft</p>
        <kbd slShortcut keys="mod+b" variant="soft"></kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>plain</p>
        <kbd slShortcut keys="mod+b" variant="plain"></kbd>
      </div>
    </div>
  `,
})
export class KbdVariants {}
