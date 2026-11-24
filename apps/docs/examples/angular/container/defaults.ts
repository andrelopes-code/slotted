import { Component } from '@angular/core';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { provideContainerDefaults, SlContainer } from '@slotted/angular/container';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-container-defaults',
  imports: [SlCard, SlCardBody, SlContainer, SlStack, SlText],
  providers: [provideContainerDefaults({ align: 'start', inset: 9, size: 'measure' })],
  template: `
    <div slStack style="--slotted-container-measure: 40ch" [gap]="4">
      <div slCard>
        <div slContainer>
          <div slCard>
            <div slCardBody>
              <span slText>Takes size, inset and align from the provider.</span>
            </div>
          </div>
        </div>
      </div>

      <div slCard>
        <div slContainer align="center" [inset]="3" size="wide">
          <div slCard>
            <div slCardBody>
              <span slText>States its own size, inset and align.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ContainerDefaults {}
