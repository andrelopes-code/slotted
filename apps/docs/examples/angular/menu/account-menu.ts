import { Component, computed, signal } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlButton, SlButtonStart } from '@slotted/angular/button';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  SlMenu,
  SlMenuHeader,
  SlMenuItem,
  SlMenuItemDescription,
  SlMenuItemIcon,
  SlMenuItemMeta,
  SlMenuRadioGroup,
  SlMenuSeparator,
  SlMenuTrigger,
} from '@slotted/angular/menu';

const WORKSPACES = ['Northwind Operations', 'Northwind Europe', 'Northwind Wholesale'];

@Component({
  selector: 'app-menu-account-menu',
  imports: [
    SlAvatar,
    SlButton,
    SlButtonStart,
    SlGlyph,
    SlIcon,
    SlMenu,
    SlMenuHeader,
    SlMenuItem,
    SlMenuItemDescription,
    SlMenuItemIcon,
    SlMenuItemMeta,
    SlMenuRadioGroup,
    SlMenuSeparator,
    SlMenuTrigger,
  ],
  template: `
    <button slButton variant="ghost" [slMenuTriggerFor]="account">
      <span slButtonStart><span slAvatar decorative name="Maria Chen" size="sm"></span></span>
      Maria Chen
    </button>
    <sl-menu #account align="end">
      <div slMenuHeader>
        <span slAvatar decorative name="Maria Chen" size="md"></span>
        <span data-part="label">Maria Chen</span>
        <span slMenuItemDescription>maria.chen&#64;northwind.example</span>
      </div>
      <hr slMenuSeparator />
      <button slMenuItem>
        <span slMenuItemIcon
          ><span slIcon><svg slGlyph name="person"></svg></span
        ></span>
        Profile
      </button>
      <button slMenuItem>
        <span slMenuItemIcon
          ><span slIcon><svg slGlyph name="bell"></svg></span
        ></span>
        Notifications
      </button>
      <button slMenuItem [slMenuTriggerFor]="workspaces">
        Workspace <span slMenuItemMeta>{{ short() }}</span>
      </button>
      <sl-menu #workspaces>
        <sl-menu-radio-group [(value)]="workspace">
          @for (name of names; track name) {
            <button slMenuRadioItem [value]="name">{{ name }}</button>
          }
        </sl-menu-radio-group>
      </sl-menu>
      <hr slMenuSeparator />
      <button slMenuItem tone="danger">
        <span slMenuItemIcon
          ><span slIcon><svg slGlyph name="arrow-left"></svg></span
        ></span>
        Sign out
      </button>
    </sl-menu>
  `,
})
export class MenuAccountMenu {
  protected readonly names = WORKSPACES;
  protected readonly workspace = signal<string | undefined>('Northwind Operations');
  protected readonly short = computed(() => this.workspace()?.replace('Northwind ', ''));
}
