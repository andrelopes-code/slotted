import { Component } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-avatar-status',
  imports: [SlAvatar, SlInline, SlStack, SlText],
  template: `
    <div slInline [gap]="6">
      @for (status of statuses; track status) {
        <div slStack [gap]="2">
          <span slAvatar name="Maria Chen" size="lg" [src]="portrait" [status]="status"></span>
          <span slText size="sm" tone="muted">{{ status }}</span>
        </div>
      }
    </div>
  `,
})
export class AvatarStatusExample {
  protected readonly portrait =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23c7d2fe'/%3E%3Ccircle cx='32' cy='25' r='11' fill='%234338ca'/%3E%3Cpath d='M10 64a22 22 0 0 1 44 0Z' fill='%234338ca'/%3E%3C/svg%3E";
  protected readonly statuses = ['idle', 'loading', 'loaded', 'error'] as const;
}
