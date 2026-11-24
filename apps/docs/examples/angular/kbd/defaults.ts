import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { provideKbdDefaults, SlShortcut } from '@slotted/angular/kbd';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-kbd-defaults',
  imports: [SlInline, SlShortcut, SlStack, SlText],
  providers: [provideKbdDefaults({ platform: 'windows', size: 'sm', variant: 'soft' })],
  template: `
    <div slStack [gap]="3">
      <div slInline justify="between" align="center">
        <p slText>Open search</p>
        <kbd slShortcut keys="mod+k"></kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>Create order</p>
        <kbd slShortcut keys="mod+n"></kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>Print packing slip</p>
        <kbd slShortcut keys="mod+p" variant="outline"></kbd>
      </div>
    </div>
  `,
})
export class KbdDefaults {}
