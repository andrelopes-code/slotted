import { Component } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-avatar-tones',
  imports: [SlAvatar, SlInline, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      @for (variant of variants; track variant) {
        <div slStack [gap]="2">
          <span slText size="sm" tone="muted">{{ variant }}</span>
          <div slInline [gap]="3">
            @for (tone of tones; track tone) {
              <span slAvatar name="Maria Chen" [tone]="tone" [variant]="variant"></span>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class AvatarTones {
  protected readonly tones = [
    'accent',
    'secondary',
    'info',
    'success',
    'warning',
    'danger',
  ] as const;
  protected readonly variants = ['soft', 'solid'] as const;
}
