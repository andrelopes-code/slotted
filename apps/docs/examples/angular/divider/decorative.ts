import { Component } from '@angular/core';
import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlDivider } from '@slotted/angular/divider';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-divider-decorative',
  imports: [SlCard, SlCardBody, SlCardHeader, SlDivider, SlHeading, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      @for (decorative of options; track decorative) {
        <div slCard>
          <div slCardHeader>
            <h2 slHeading size="sm">{{ decorative ? 'decorative' : 'Announced' }}</h2>
          </div>
          <div slCardBody>
            <div slStack [gap]="3">
              <p slText>Order 20418 was packed.</p>
              <hr slDivider [decorative]="decorative" />
              <p slText>Order 20418 was handed to the carrier.</p>
              <div slDivider [decorative]="decorative" label="Delivery"></div>
              <p slText>Order 20418 is due on Thursday.</p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class DividerDecorative {
  protected readonly options = [false, true];
}
