import { Component, effect, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlSkeleton, SlSkeletonRegion } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import { SlTree, SlTreeLabel, SlTreeNode } from '@slotted/angular/tree';

const ROWS = [
  { id: 'cmh', name: 'Columbus, OH' },
  { id: 'rno', name: 'Reno, NV' },
  { id: 'sav', name: 'Savannah, GA' },
  { id: 'dfw', name: 'Dallas, TX' },
];

@Component({
  selector: 'app-tree-loading',
  imports: [SlButton, SlSkeleton, SlSkeletonRegion, SlStack, SlTree, SlTreeLabel, SlTreeNode],
  template: `
    <div slStack align="start" [gap]="3">
      <button slButton size="sm" variant="outline" (click)="loading.set(true)">
        Refresh locations
      </button>
      <div
        slSkeletonRegion
        [delay]="200"
        [loading]="loading()"
        [messages]="{ label: 'Loading locations' }"
        [minDuration]="400"
      >
        <div slTree aria-label="Stock locations" [loading]="loading()">
          @for (row of rows; track row.id) {
            <li slTreeNode hasChildren [textValue]="row.name" [value]="row.id">
              @if (loading()) {
                <span slTreeLabel slSkeleton></span>
              } @else {
                <ng-container slTreeLabel>{{ row.name }}</ng-container>
              }
            </li>
          }
        </div>
      </div>
    </div>
  `,
})
export class TreeLoading {
  protected readonly rows = ROWS;
  protected readonly loading = signal(true);

  constructor() {
    effect((onCleanup) => {
      if (!this.loading()) return;
      const timer = setTimeout(() => this.loading.set(false), 1500);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
