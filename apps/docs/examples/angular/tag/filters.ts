import { Component, signal } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlTag, SlTagGroup, SlTagRemove, SlTagToggle } from '@slotted/angular/tag';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-tag-filters',
  imports: [SlStack, SlTag, SlTagGroup, SlTagRemove, SlTagToggle, SlText],
  template: `
    <div slStack [gap]="3">
      <div slTagGroup aria-label="Order filters">
        @for (facet of facets(); track facet) {
          <span slTag tone="accent" removable (remove)="drop(facet)">
            <button
              slTagToggle
              [selected]="chosen().includes(facet)"
              (selectedChange)="select(facet, $event.value)"
            >
              {{ facet }}
            </button>
            <button slTagRemove></button>
          </span>
        }
      </div>

      <p slText size="sm" tone="muted">
        {{ chosen().length }} of {{ facets().length }} filters applied.
      </p>
    </div>
  `,
})
export class TagFilters {
  protected readonly facets = signal(['Late', 'Backordered', 'Fragile', 'Gift wrap']);
  protected readonly chosen = signal(['Late']);

  protected select(facet: string, selected: boolean) {
    this.chosen.update((current) =>
      selected ? [...current, facet] : current.filter((item) => item !== facet),
    );
  }

  protected drop(facet: string) {
    this.facets.update((current) => current.filter((item) => item !== facet));
    this.chosen.update((current) => current.filter((item) => item !== facet));
  }
}
