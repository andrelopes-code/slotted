import { Component, effect, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlList } from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemDescription,
  SlListItemEnd,
  SlListItemLabel,
} from '@slotted/angular/list-item';
import { SlSkeleton, SlSkeletonRegion } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-list-loading',
  imports: [
    SlButton,
    SlList,
    SlListItem,
    SlListItemBody,
    SlListItemContent,
    SlListItemDescription,
    SlListItemEnd,
    SlListItemLabel,
    SlSkeleton,
    SlSkeletonRegion,
    SlStack,
  ],
  template: `
    <div slStack align="start" [gap]="3">
      <button slButton size="sm" variant="outline" (click)="loading.set(true)">
        Refresh carriers
      </button>
      <div
        slSkeletonRegion
        [delay]="200"
        [loading]="loading()"
        [messages]="{ label: 'Loading carriers' }"
        [minDuration]="400"
      >
        <ul slList aria-label="Carriers" [loading]="loading()" variant="ruled">
          @for (carrier of carriers; track carrier.name) {
            <li slListItem [loading]="loading()">
              <div slListItemContent>
                <span slListItemBody>
                  <span slListItemLabel>
                    @if (loading()) {
                      <span slSkeleton [inlineSize]="carrier.widths[0]"></span>
                    } @else {
                      {{ carrier.name }}
                    }
                  </span>
                  <span slListItemDescription>
                    @if (loading()) {
                      <span slSkeleton [inlineSize]="carrier.widths[1]"></span>
                    } @else {
                      {{ carrier.cutoff }}
                    }
                  </span>
                </span>
                <span slListItemEnd>
                  @if (loading()) {
                    <span slSkeleton inlineSize="2rem"></span>
                  } @else {
                    {{ carrier.parcels }}
                  }
                </span>
              </div>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class ListLoading {
  readonly carriers = [
    { name: 'UPS Ground', cutoff: 'Pickup at 16:30', parcels: '142', widths: ['6rem', '7rem'] },
    { name: 'FedEx Express', cutoff: 'Pickup at 17:00', parcels: '38', widths: ['7.5rem', '7rem'] },
    { name: 'USPS Priority', cutoff: 'Drop-off by 18:00', parcels: '61', widths: ['7rem', '8rem'] },
  ];

  readonly loading = signal(true);

  constructor() {
    effect((onCleanup) => {
      if (!this.loading()) return;
      const timer = setTimeout(() => this.loading.set(false), 1500);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
