import { Component, signal } from '@angular/core';
import {
  SlSideNavigation,
  SlSideNavigationCount,
  SlSideNavigationItem,
  SlSideNavigationLabel,
  SlSideNavigationLink,
  SlSideNavigationList,
} from '@slotted/angular/side-navigation';

@Component({
  selector: 'app-side-navigation-basic',
  imports: [
    SlSideNavigation,
    SlSideNavigationCount,
    SlSideNavigationItem,
    SlSideNavigationLabel,
    SlSideNavigationLink,
    SlSideNavigationList,
  ],
  template: `
    <nav slSideNavigation aria-label="Main navigation" [(value)]="current">
      <ul slSideNavigationList>
        <li slSideNavigationItem value="dashboard">
          <a slSideNavigationLink href="/dashboard"><span slSideNavigationLabel>Dashboard</span></a>
        </li>
        <li slSideNavigationItem value="loads">
          <a slSideNavigationLink href="/loads">
            <span slSideNavigationLabel>Loads</span>
            <span slSideNavigationCount>12</span>
          </a>
        </li>
      </ul>
    </nav>
  `,
})
export class SideNavigationBasic {
  readonly current = signal('loads');
}
