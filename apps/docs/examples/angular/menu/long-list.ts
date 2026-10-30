import { Component } from '@angular/core';
import { SlButton, SlButtonEnd } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';

const LOCATIONS = [
  'Amsterdam',
  'Antwerp',
  'Barcelona',
  'Berlin',
  'Bologna',
  'Bordeaux',
  'Bratislava',
  'Brno',
  'Brussels',
  'Budapest',
  'Copenhagen',
  'Dublin',
  'Gdańsk',
  'Geneva',
  'Hamburg',
  'Helsinki',
  'Kraków',
  'Leipzig',
  'Lisbon',
  'Ljubljana',
  'Lyon',
  'Madrid',
  'Milan',
  'Munich',
  'Oslo',
  'Porto',
  'Prague',
  'Rotterdam',
  'Stockholm',
  'Tallinn',
  'Valencia',
  'Vienna',
  'Vilnius',
  'Warsaw',
  'Zagreb',
  'Zürich',
];

@Component({
  selector: 'app-menu-long-list',
  imports: [SlButton, SlButtonEnd, SlGlyph, SlMenu, SlMenuItem, SlMenuTrigger],
  template: `
    <button slButton variant="outline" [slMenuTriggerFor]="warehouses">
      Move to warehouse
      <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
    </button>
    <sl-menu #warehouses>
      @for (location of locations; track location) {
        <button slMenuItem>{{ location }}</button>
      }
    </sl-menu>
  `,
})
export class MenuLongList {
  protected readonly locations = LOCATIONS;
}
