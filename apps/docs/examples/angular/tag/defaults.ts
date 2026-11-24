import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { provideTagDefaults, SlTag, SlTagBody } from '@slotted/angular/tag';

@Component({
  selector: 'app-tag-defaults',
  imports: [SlInline, SlTag, SlTagBody],
  providers: [provideTagDefaults({ shape: 'square', size: 'sm' })],
  template: `
    <div slInline [gap]="2">
      <span slTag><span slTagBody>Inbound</span></span>
      <span slTag><span slTagBody>Cross-dock</span></span>
      <span slTag shape="pill" size="md"><span slTagBody>Cold chain</span></span>
    </div>
  `,
})
export class TagDefaults {}
