import { Component } from '@angular/core';
import { SlList, type ListVariant } from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemLabel,
} from '@slotted/angular/list-item';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-list-variants',
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
      @for (variant of variants; track variant) {
        <div slStack [gap]="2">
          <span slText size="sm" tone="muted">{{ variant }}</span>
          <ul slList [attr.aria-label]="'Carriers, ' + variant" [variant]="variant">
            @for (carrier of carriers; track carrier) {
              <li slListItem>
                <div slListItemContent>
                  <span slListItemBody>
                    <span slListItemLabel>{{ carrier }}</span>
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
export class ListVariants {
  readonly variants: ListVariant[] = ['plain', 'ruled', 'framed', 'separated'];
  readonly carriers = ['UPS Ground', 'FedEx Express'];
}
