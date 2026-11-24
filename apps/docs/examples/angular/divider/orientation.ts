import { Component } from '@angular/core';
import { SlDivider } from '@slotted/angular/divider';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-divider-orientation',
  imports: [SlDivider, SlInline, SlStack, SlText],
  template: `
    <div slStack [gap]="6">
      <div slStack [gap]="3">
        <p slText size="sm" tone="muted">horizontal</p>
        <p slText>42 open orders</p>
        <hr slDivider orientation="horizontal" />
        <p slText>17 shipped today</p>
      </div>
      <div slStack [gap]="3">
        <p slText size="sm" tone="muted">vertical</p>
        <div slInline [gap]="4">
          <p slText>42 open orders</p>
          <hr slDivider orientation="vertical" />
          <p slText>17 shipped today</p>
        </div>
      </div>
    </div>
  `,
})
export class DividerOrientation {}
