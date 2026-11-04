import { Component } from '@angular/core';
import {
  SlList,
  SlListSection,
  SlListSectionEnd,
  SlListSectionLabel,
  SlListSectionList,
} from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemEnd,
  SlListItemLabel,
} from '@slotted/angular/list-item';
import { SlScrollArea, SlScrollAreaContent } from '@slotted/angular/scroll-area';

const DAYS = [
  {
    day: 'Monday',
    moves: [
      { id: 'MV-801', sku: 'Oat flour, 25 kg', quantity: '+40' },
      { id: 'MV-802', sku: 'Rye flour, 25 kg', quantity: '+24' },
      { id: 'MV-803', sku: 'Sea salt, 5 kg', quantity: '−12' },
      { id: 'MV-804', sku: 'Cane sugar, 10 kg', quantity: '−30' },
    ],
  },
  {
    day: 'Tuesday',
    moves: [
      { id: 'MV-805', sku: 'Oat flour, 25 kg', quantity: '−18' },
      { id: 'MV-806', sku: 'Dried yeast, 500 g', quantity: '+60' },
      { id: 'MV-807', sku: 'Butter, 10 kg', quantity: '−8' },
      { id: 'MV-808', sku: 'Sea salt, 5 kg', quantity: '+20' },
    ],
  },
  {
    day: 'Wednesday',
    moves: [
      { id: 'MV-809', sku: 'Rye flour, 25 kg', quantity: '−16' },
      { id: 'MV-810', sku: 'Cane sugar, 10 kg', quantity: '+45' },
      { id: 'MV-811', sku: 'Butter, 10 kg', quantity: '+12' },
      { id: 'MV-812', sku: 'Dried yeast, 500 g', quantity: '−22' },
    ],
  },
];

@Component({
  selector: 'app-list-sticky',
  imports: [
    SlList,
    SlListItem,
    SlListItemBody,
    SlListItemContent,
    SlListItemEnd,
    SlListItemLabel,
    SlListSection,
    SlListSectionEnd,
    SlListSectionLabel,
    SlListSectionList,
    SlScrollArea,
    SlScrollAreaContent,
  ],
  template: `
    <div slScrollArea maxBlockSize="16rem" [messages]="{ label: 'Stock movements' }">
      <div slScrollAreaContent>
        <ul slList aria-label="Stock movements" variant="ruled">
          @for (group of days; track group.day) {
            <li slListSection>
              <h3 slListSectionLabel sticky variant="ruled">
                {{ group.day }}
                <span slListSectionEnd>{{ group.moves.length }} moves</span>
              </h3>
              <ul slListSectionList>
                @for (move of group.moves; track move.id) {
                  <li slListItem>
                    <div slListItemContent>
                      <span slListItemBody>
                        <span slListItemLabel>{{ move.sku }}</span>
                      </span>
                      <span slListItemEnd>{{ move.quantity }}</span>
                    </div>
                  </li>
                }
              </ul>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class ListSticky {
  readonly days = DAYS;
}
