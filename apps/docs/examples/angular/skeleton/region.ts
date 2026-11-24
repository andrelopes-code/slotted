import { Component, effect, signal } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlSkeleton, SlSkeletonRegion } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-skeleton-region',
  imports: [SlAvatar, SlButton, SlHeading, SlInline, SlSkeleton, SlSkeletonRegion, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <div slInline align="center" [gap]="3">
        <h2 slHeading size="md">Warehouse team</h2>
        <button slButton size="sm" variant="outline" (click)="loading.set(true)">
          Replay loading
        </button>
      </div>
      <div
        slSkeletonRegion
        loadedLabel="Team loaded"
        [loading]="loading()"
        [messages]="{ label: 'Loading the team' }"
      >
        <div slStack [gap]="4">
          @for (member of team; track member.name) {
            <div slInline align="center" [gap]="3">
              @if (loading()) {
                <span slSkeleton shape="circle" size="md"></span>
              } @else {
                <span slAvatar [name]="member.name" size="md"></span>
              }
              <div slStack [gap]="1">
                <span slText>
                  @if (loading()) {
                    <span slSkeleton [inlineSize]="member.widths[0]"></span>
                  } @else {
                    {{ member.name }}
                  }
                </span>
                <span slText size="sm" tone="muted">
                  @if (loading()) {
                    <span slSkeleton [inlineSize]="member.widths[1]"></span>
                  } @else {
                    {{ member.role }}
                  }
                </span>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class SkeletonRegionExample {
  protected readonly team = [
    { name: 'Maria Chen', role: 'Dock supervisor', widths: ['5.5rem', '7rem'] },
    { name: 'Tomás Rivera', role: 'Forklift operator', widths: ['6.5rem', '8rem'] },
    { name: 'Priya Nair', role: 'Inventory analyst', widths: ['5rem', '7.5rem'] },
  ];

  protected readonly loading = signal(true);

  constructor() {
    effect((onCleanup) => {
      if (!this.loading()) return;
      const timer = setTimeout(() => this.loading.set(false), 1500);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
