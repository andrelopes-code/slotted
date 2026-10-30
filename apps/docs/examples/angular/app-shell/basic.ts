import { Component } from '@angular/core';
import {
  SlAppShell,
  SlAppShellBanner,
  SlAppShellBrand,
  SlAppShellMain,
  SlAppShellNav,
  SlAppShellNavToggle,
} from '@slotted/angular/app-shell';
import {
  SlSideNavigation,
  SlSideNavigationItem,
  SlSideNavigationLabel,
  SlSideNavigationLink,
  SlSideNavigationList,
} from '@slotted/angular/side-navigation';

@Component({
  selector: 'app-app-shell-basic',
  imports: [
    SlAppShell,
    SlAppShellBanner,
    SlAppShellBrand,
    SlAppShellMain,
    SlAppShellNav,
    SlAppShellNavToggle,
    SlSideNavigation,
    SlSideNavigationItem,
    SlSideNavigationLabel,
    SlSideNavigationLink,
    SlSideNavigationList,
  ],
  template: `
    <div slAppShell>
      <header slAppShellBanner>
        <button slAppShellNavToggle></button>
        <span slAppShellBrand>Northwind</span>
      </header>
      <nav slAppShellNav>
        <div slSideNavigation aria-label="Main navigation" value="orders">
          <ul slSideNavigationList>
            <li slSideNavigationItem value="orders">
              <a slSideNavigationLink href="/orders"><span slSideNavigationLabel>Orders</span></a>
            </li>
            <li slSideNavigationItem value="customers">
              <a slSideNavigationLink href="/customers"
                ><span slSideNavigationLabel>Customers</span></a
              >
            </li>
          </ul>
        </div>
      </nav>
      <main slAppShellMain>
        <h1>Orders</h1>
      </main>
    </div>
  `,
})
export class AppShellBasic {}
