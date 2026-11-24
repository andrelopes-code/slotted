import { Component, computed, signal } from '@angular/core';
import { SlTag, SlTagBody, SlTagGroup } from '@slotted/angular/tag';

@Component({
  selector: 'app-tag-actions',
  imports: [SlTag, SlTagBody, SlTagGroup],
  template: `
    <div slTagGroup aria-label="Carriers on route 14">
      @for (carrier of shown(); track carrier.name) {
        <span slTag>
          <a slTagBody [href]="carrier.href">{{ carrier.name }}</a>
        </span>
      }
      <span slTag variant="outline">
        <button slTagBody (click)="expanded.set(!expanded())">
          {{ expanded() ? 'Show fewer' : '+' + hidden + ' more' }}
        </button>
      </span>
    </div>
  `,
})
export class TagActions {
  protected readonly expanded = signal(false);
  protected readonly shown = computed(() =>
    this.expanded() ? this.carriers : this.carriers.slice(0, 3),
  );
  protected readonly hidden = 2;

  private readonly carriers = [
    { name: 'Northwind Freight', href: '#northwind-freight' },
    { name: 'Harbor Line', href: '#harbor-line' },
    { name: 'Blue Route', href: '#blue-route' },
    { name: 'Summit Cargo', href: '#summit-cargo' },
    { name: 'Delta Parcel', href: '#delta-parcel' },
  ];
}
