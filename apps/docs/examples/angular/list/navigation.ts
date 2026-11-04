import { Component, signal } from '@angular/core';
import { SlList } from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemLabel,
} from '@slotted/angular/list-item';

@Component({
  selector: 'app-list-navigation',
  imports: [SlList, SlListItem, SlListItemBody, SlListItemContent, SlListItemLabel],
  template: `
    <nav aria-label="Settings">
      <ul slList>
        @for (section of sections; track section.href) {
          <li slListItem [current]="section.href === here() ? 'page' : false">
            <a slListItemContent [href]="section.href" (click)="navigate($event, section.href)">
              <span slListItemBody>
                <span slListItemLabel>{{ section.name }}</span>
              </span>
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class ListNavigation {
  readonly sections = [
    { href: '#general', name: 'General' },
    { href: '#warehouses', name: 'Warehouses' },
    { href: '#carriers', name: 'Carriers' },
    { href: '#billing', name: 'Billing' },
  ];

  readonly here = signal('#warehouses');

  navigate(event: MouseEvent, href: string) {
    event.preventDefault();
    this.here.set(href);
  }
}
