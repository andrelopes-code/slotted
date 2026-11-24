import { Component, signal } from '@angular/core';
import { SlTag, SlTagBody, SlTagGroup, SlTagRemove } from '@slotted/angular/tag';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-tag-removal',
  imports: [SlTag, SlTagBody, SlTagGroup, SlTagRemove, SlText],
  template: `
    <div slTagGroup aria-label="Labels on order SO-10482">
      @for (label of labels(); track label) {
        <span slTag removable (remove)="drop(label)">
          <span slTagBody>{{ label }}</span>
          <button slTagRemove></button>
        </span>
      }
    </div>

    @if (labels().length === 0) {
      <p slText size="sm" tone="muted">No labels on this order.</p>
    }
  `,
})
export class TagRemoval {
  protected readonly labels = signal(['Wholesale', 'Fragile', 'Priority shipping', 'Gift wrap']);

  protected drop(label: string) {
    this.labels.update((current) => current.filter((item) => item !== label));
  }
}
