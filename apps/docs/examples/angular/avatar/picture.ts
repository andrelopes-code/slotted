import { Component, signal } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import type { AvatarStatus } from '@slotted/angular/avatar';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const PORTRAIT =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23c7d2fe'/%3E%3Ccircle cx='32' cy='25' r='11' fill='%234338ca'/%3E%3Cpath d='M10 64a22 22 0 0 1 44 0Z' fill='%234338ca'/%3E%3C/svg%3E";
const UNREADABLE = 'data:image/png;base64,AAAA';

@Component({
  selector: 'app-avatar-picture',
  imports: [SlAvatar, SlButton, SlInline, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <span
        slAvatar
        name="Maria Chen"
        size="xl"
        [src]="failed() ? unreadable : portrait"
        (statusChange)="status.set($event)"
      ></span>
      <p slText size="sm" tone="muted">Status: {{ status() }}</p>
      <div slInline>
        <button slButton tone="secondary" variant="outline" (click)="failed.set(!failed())">
          {{ failed() ? 'Restore the picture' : 'Fail the request' }}
        </button>
      </div>
    </div>
  `,
})
export class AvatarPicture {
  protected readonly portrait = PORTRAIT;
  protected readonly unreadable = UNREADABLE;
  protected readonly failed = signal(false);
  protected readonly status = signal<AvatarStatus>('loading');
}
