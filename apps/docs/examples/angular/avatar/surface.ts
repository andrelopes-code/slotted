import { Component } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-avatar-surface',
  imports: [SlAvatar, SlInline, SlStack, SlText],
  template: `
    <div slInline [gap]="6">
      @for (surface of surfaces; track surface) {
        <div slStack [gap]="2">
          <span
            slAvatar
            name="Nordic Freight"
            shape="square"
            size="lg"
            [src]="logo"
            [surface]="surface"
          ></span>
          <span slText size="sm" tone="muted">{{ surface }}</span>
        </div>
      }
    </div>
  `,
})
export class AvatarSurfaceExample {
  protected readonly logo =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath d='M8 52V12h8l32 28V12h8v40h-8L16 24v28Z' fill='%23111827'/%3E%3C/svg%3E";
  protected readonly surfaces = ['tone', 'none', 'plate'] as const;
}
