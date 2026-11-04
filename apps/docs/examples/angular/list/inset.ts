import { Component } from '@angular/core';
import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlList } from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemDescription,
  SlListItemLabel,
} from '@slotted/angular/list-item';
import { SlHeading } from '@slotted/angular/typography';

@Component({
  selector: 'app-list-inset',
  imports: [
    SlCard,
    SlCardBody,
    SlCardHeader,
    SlHeading,
    SlList,
    SlListItem,
    SlListItemBody,
    SlListItemContent,
    SlListItemDescription,
    SlListItemLabel,
  ],
  template: `
    <div slCard>
      <div slCardHeader>
        <h3 slHeading [level]="3" size="md">On shift in Reno</h3>
      </div>
      <div slCardBody>
        <ul slList aria-label="On shift in Reno" inset variant="ruled">
          @for (person of crew; track person.name) {
            <li slListItem>
              <div slListItemContent>
                <span slListItemBody>
                  <span slListItemLabel>{{ person.name }}</span>
                  <span slListItemDescription>{{ person.role }}</span>
                </span>
              </div>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class ListInset {
  readonly crew = [
    { name: 'Amara Nwosu', role: 'Shift lead, receiving' },
    { name: 'Diego Morales', role: 'Picker, aisles 1 to 6' },
    { name: 'Ingrid Holm', role: 'Packer, station 2' },
  ];
}
