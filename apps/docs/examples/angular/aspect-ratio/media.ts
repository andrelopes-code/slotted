import { Component } from '@angular/core';
import { SlAspectRatio } from '@slotted/angular/aspect-ratio';
import { SlCard } from '@slotted/angular/card';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-aspect-ratio-media',
  imports: [SlAspectRatio, SlCard, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <p slText size="sm" tone="muted">A 4:3 picture in a video frame</p>
      <div slCard>
        <div slAspectRatio ratio="video">
          <img
            alt="Illustration of the Rotterdam warehouse"
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 120'%3E%3Crect width='160' height='120' fill='%231e3a5f'/%3E%3Crect x='20' y='50' width='120' height='50' fill='%2393c5fd'/%3E%3Cpath d='M10 50 80 20l70 30Z' fill='%23dbeafe'/%3E%3Crect x='65' y='70' width='30' height='30' fill='%231e3a5f'/%3E%3C/svg%3E"
          />
        </div>
      </div>
      <p slText size="sm" tone="muted">The same picture in a square frame</p>
      <div slCard>
        <div slAspectRatio ratio="square">
          <img
            alt="Illustration of the Rotterdam warehouse"
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 120'%3E%3Crect width='160' height='120' fill='%231e3a5f'/%3E%3Crect x='20' y='50' width='120' height='50' fill='%2393c5fd'/%3E%3Cpath d='M10 50 80 20l70 30Z' fill='%23dbeafe'/%3E%3Crect x='65' y='70' width='30' height='30' fill='%231e3a5f'/%3E%3C/svg%3E"
          />
        </div>
      </div>
    </div>
  `,
})
export class AspectRatioMedia {}
