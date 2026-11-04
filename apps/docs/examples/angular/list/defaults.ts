import { Component } from '@angular/core';
import { provideListDefaults, SlList } from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemLabel,
} from '@slotted/angular/list-item';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-list-defaults',
  imports: [SlList, SlListItem, SlListItemBody, SlListItemContent, SlListItemLabel, SlStack],
  providers: [provideListDefaults({ size: 'sm', variant: 'ruled' })],
  template: `
    <div slStack [gap]="5">
      <ul slList aria-label="Carriers">
        @for (name of carriers; track name) {
          <li slListItem>
            <div slListItemContent>
              <span slListItemBody>
                <span slListItemLabel>{{ name }}</span>
              </span>
            </div>
          </li>
        }
      </ul>
      <ul slList aria-label="Docks" variant="framed">
        @for (name of docks; track name) {
          <li slListItem>
            <div slListItemContent>
              <span slListItemBody>
                <span slListItemLabel>{{ name }}</span>
              </span>
            </div>
          </li>
        }
      </ul>
    </div>
  `,
})
export class ListDefaults {
  readonly carriers = ['UPS Ground', 'FedEx Express'];
  readonly docks = ['Dock 1, inbound', 'Dock 3, outbound'];
}
