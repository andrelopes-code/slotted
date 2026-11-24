import { Component } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-badge-appearance',
  imports: [SlBadge, SlInline, SlStack],
  template: `
    <div slStack [gap]="3">
      @for (variant of variants; track variant) {
        <div slInline [gap]="2">
          @for (item of tones; track item.tone) {
            <span slBadge [tone]="item.tone" [variant]="variant">{{ item.label }}</span>
          }
        </div>
      }
    </div>
  `,
})
export class BadgeAppearance {
  protected readonly variants = ['solid', 'soft', 'outline'] as const;
  protected readonly tones = [
    { tone: 'accent', label: 'Accent' },
    { tone: 'secondary', label: 'Secondary' },
    { tone: 'info', label: 'Info' },
    { tone: 'success', label: 'Success' },
    { tone: 'warning', label: 'Warning' },
    { tone: 'danger', label: 'Danger' },
  ] as const;
}
