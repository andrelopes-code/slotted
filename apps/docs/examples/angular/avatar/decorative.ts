import { Component } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-avatar-decorative',
  imports: [SlAvatar, SlInline, SlStack, SlText],
  template: `
    <div slInline align="center" [gap]="3">
      <span slAvatar decorative name="Maria Chen" size="lg" [src]="portrait"></span>
      <div slStack [gap]="1">
        <span slText weight="medium">Maria Chen</span>
        <span slText size="sm" tone="muted">Warehouse supervisor</span>
      </div>
    </div>
  `,
})
export class AvatarDecorative {
  protected readonly portrait =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23c7d2fe'/%3E%3Ccircle cx='32' cy='25' r='11' fill='%234338ca'/%3E%3Cpath d='M10 64a22 22 0 0 1 44 0Z' fill='%234338ca'/%3E%3C/svg%3E";
}
