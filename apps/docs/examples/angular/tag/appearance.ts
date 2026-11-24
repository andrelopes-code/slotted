import { Component } from '@angular/core';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlTag, SlTagBody } from '@slotted/angular/tag';

@Component({
  selector: 'app-tag-appearance',
  imports: [SlInline, SlStack, SlTag, SlTagBody],
  template: `
    <div slStack [gap]="3">
      @for (variant of variants; track variant) {
        <div slInline [gap]="2">
          @for (item of tones; track item.tone) {
            <span slTag [tone]="item.tone" [variant]="variant">
              <span slTagBody>{{ item.label }}</span>
            </span>
          }
        </div>
      }
    </div>
  `,
})
export class TagAppearance {
  protected readonly variants = ['solid', 'soft', 'outline', 'dashed'] as const;
  protected readonly tones = [
    { tone: 'accent', label: 'Accent' },
    { tone: 'secondary', label: 'Secondary' },
    { tone: 'info', label: 'Info' },
    { tone: 'success', label: 'Success' },
    { tone: 'warning', label: 'Warning' },
    { tone: 'danger', label: 'Danger' },
  ] as const;
}
