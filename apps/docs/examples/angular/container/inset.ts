import { Component } from '@angular/core';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlContainer } from '@slotted/angular/container';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-container-inset',
  imports: [SlCard, SlCardBody, SlContainer, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      @for (inset of insets; track inset) {
        <div slCard>
          <div slContainer [inset]="inset" size="bleed">
            <div slCard>
              <div slCardBody>
                <span slText>inset: {{ inset }}</span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ContainerInset {
  protected readonly insets = [0, 3, 6, 12] as const;
}
