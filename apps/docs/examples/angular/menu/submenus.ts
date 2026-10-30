import { Component, signal } from '@angular/core';
import { SlButton, SlButtonEnd } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import {
  SlMenu,
  SlMenuItem,
  SlMenuItemMeta,
  SlMenuRadioGroup,
  SlMenuSeparator,
  SlMenuTrigger,
} from '@slotted/angular/menu';

const PEOPLE = ['Maria Chen', 'Tomás Ortega', 'Aiko Tanaka', 'Unassigned'];
const WAREHOUSES = ['Rotterdam', 'Leipzig', 'Lyon', 'Gdańsk'];

@Component({
  selector: 'app-menu-submenus',
  imports: [
    SlButton,
    SlButtonEnd,
    SlGlyph,
    SlMenu,
    SlMenuItem,
    SlMenuItemMeta,
    SlMenuRadioGroup,
    SlMenuSeparator,
    SlMenuTrigger,
  ],
  template: `
    <button slButton variant="outline" [slMenuTriggerFor]="order">
      SO-10482
      <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
    </button>
    <sl-menu #order>
      <button slMenuItem>View order</button>
      <button slMenuItem [slMenuTriggerFor]="assign">
        Assign to <span slMenuItemMeta>{{ assignee() }}</span>
      </button>
      <sl-menu #assign>
        <sl-menu-radio-group [(value)]="assignee">
          @for (person of people; track person) {
            <button slMenuRadioItem [value]="person">{{ person }}</button>
          }
        </sl-menu-radio-group>
      </sl-menu>
      <button slMenuItem [slMenuTriggerFor]="move">Move to warehouse</button>
      <sl-menu #move>
        @for (warehouse of warehouses; track warehouse) {
          <button slMenuItem>{{ warehouse }}</button>
        }
      </sl-menu>
      <hr slMenuSeparator />
      <button slMenuItem tone="danger">Cancel order…</button>
    </sl-menu>
  `,
})
export class MenuSubmenus {
  protected readonly people = PEOPLE;
  protected readonly warehouses = WAREHOUSES;
  protected readonly assignee = signal<string | undefined>('Maria Chen');
}
