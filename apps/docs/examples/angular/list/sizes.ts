import { Component } from '@angular/core';
import { SlList, type ListSize } from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemLabel,
} from '@slotted/angular/list-item';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-list-sizes',
  imports: [
    SlList,
    SlListItem,
    SlListItemBody,
    SlListItemContent,
    SlListItemLabel,
    SlStack,
    SlText,
  ],
  template: `
    <div slStack [gap]="5">
      @for (size of sizes; track size) {
        <div slStack [gap]="2">
          <span slText size="sm" tone="muted">{{ size }}</span>
          <ul slList [attr.aria-label]="'Bins, ' + size" [size]="size" variant="ruled">
            @for (bin of bins; track bin) {
              <li slListItem>
                <div slListItemContent>
                  <span slListItemBody>
                    <span slListItemLabel>{{ bin }}</span>
                  </span>
                </div>
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class ListSizes {
  readonly sizes: ListSize[] = ['sm', 'md', 'lg'];
  readonly bins = ['Aisle 4, bin 12', 'Aisle 4, bin 13'];
}
