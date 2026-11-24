import { Component } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlGrid } from '@slotted/angular/grid';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-inline-gap',
  imports: [SlAvatar, SlGrid, SlInline, SlStack, SlText],
  template: `
    <div slGrid minItemWidth="sm" [columns]="2" [gap]="5">
      @for (gap of gaps; track gap) {
        <div slStack [gap]="1">
          <span slText size="xs" tone="muted">Gap {{ gap }}</span>
          <div slInline [gap]="gap">
            @for (person of people; track person) {
              <span slAvatar [name]="person" size="sm"></span>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class InlineGap {
  protected readonly gaps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
  protected readonly people = ['Maria Chen', 'Tomas Reyes', 'Priya Nair'] as const;
}
