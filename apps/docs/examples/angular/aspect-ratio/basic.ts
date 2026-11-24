import { Component } from '@angular/core';
import { SlAspectRatio } from '@slotted/angular/aspect-ratio';

@Component({
  selector: 'app-aspect-ratio-basic',
  imports: [SlAspectRatio],
  template: `
    <div slAspectRatio ratio="landscape">
      <img
        alt="Illustration of the Rotterdam warehouse"
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 120'%3E%3Crect width='160' height='120' fill='%231e3a5f'/%3E%3Crect x='20' y='50' width='120' height='50' fill='%2393c5fd'/%3E%3Cpath d='M10 50 80 20l70 30Z' fill='%23dbeafe'/%3E%3Crect x='65' y='70' width='30' height='30' fill='%231e3a5f'/%3E%3C/svg%3E"
      />
    </div>
  `,
})
export class AspectRatioBasic {}
