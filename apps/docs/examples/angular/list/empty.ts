import { Component } from '@angular/core';
import { SlList, SlListEmpty } from '@slotted/angular/list';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-list-empty',
  imports: [SlHeading, SlList, SlListEmpty, SlText],
  template: `
    <ul slList aria-label="Returns" variant="framed">
      <li slListEmpty>
        <h3 slHeading size="md">No returns waiting</h3>
        <span slText tone="muted"
          >A return appears here once the customer ships the parcel back.</span
        >
      </li>
    </ul>
  `,
})
export class ListEmpty {}
