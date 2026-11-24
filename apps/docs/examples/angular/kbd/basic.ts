import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlShortcut } from '@slotted/angular/kbd';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-kbd-basic',
  imports: [SlInline, SlShortcut, SlText],
  template: `
    <div slInline [gap]="3" align="center">
      <p slText>Search orders</p>
      <kbd slShortcut keys="mod+k"></kbd>
    </div>
  `,
})
export class KbdBasic {}
