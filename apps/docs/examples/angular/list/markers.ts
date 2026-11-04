import { Component } from '@angular/core';
import { SlList } from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemLabel,
} from '@slotted/angular/list-item';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-list-markers',
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
      <div slStack [gap]="2">
        <span slText size="sm" tone="muted">bullet</span>
        <ul slList aria-label="Shipping rules" marker="bullet">
          @for (rule of rules; track rule) {
            <li slListItem>
              <div slListItemContent>
                <span slListItemBody>
                  <span slListItemLabel>{{ rule }}</span>
                </span>
              </div>
            </li>
          }
        </ul>
      </div>

      <div slStack [gap]="2">
        <span slText size="sm" tone="muted">number, ordered</span>
        <ol slList aria-label="Receiving steps" marker="number">
          @for (step of steps; track step) {
            <li slListItem>
              <div slListItemContent>
                <span slListItemBody>
                  <span slListItemLabel>{{ step }}</span>
                </span>
              </div>
            </li>
          }
        </ol>
      </div>
    </div>
  `,
})
export class ListMarkers {
  readonly rules = [
    'Lithium batteries ship by ground only',
    'Parcels over 30 kg need a two-person lift label',
  ];

  readonly steps = [
    'Receive the pallet at dock 3',
    'Scan every carton',
    'Put each carton away by bin',
  ];
}
