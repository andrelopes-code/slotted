import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlShortcut } from '@slotted/angular/kbd';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-kbd-platform',
  imports: [SlInline, SlShortcut, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      <div slInline justify="between" align="center">
        <p slText>mac</p>
        <kbd slShortcut keys="meta+shift+s" platform="mac"></kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>windows</p>
        <kbd slShortcut keys="meta+shift+s" platform="windows"></kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>linux</p>
        <kbd slShortcut keys="meta+shift+s" platform="linux"></kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>other</p>
        <kbd slShortcut keys="meta+shift+s" platform="other"></kbd>
      </div>
      <div slInline justify="between" align="center">
        <p slText>auto</p>
        <kbd slShortcut keys="meta+shift+s" platform="auto"></kbd>
      </div>
    </div>
  `,
})
export class KbdPlatform {}
