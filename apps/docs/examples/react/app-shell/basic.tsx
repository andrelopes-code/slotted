import {
  AppShell,
  AppShellBanner,
  AppShellBrand,
  AppShellMain,
  AppShellNav,
  AppShellNavToggle,
} from '@slotted/react/app-shell';
import {
  SideNavigation,
  SideNavigationItem,
  SideNavigationLabel,
  SideNavigationLink,
  SideNavigationList,
} from '@slotted/react/side-navigation';

export default function AppShellBasic() {
  return (
    <AppShell>
      <AppShellBanner>
        <AppShellNavToggle />
        <AppShellBrand>Northwind</AppShellBrand>
      </AppShellBanner>
      <AppShellNav>
        <SideNavigation aria-label="Main navigation" defaultValue="orders">
          <SideNavigationList>
            <SideNavigationItem value="orders">
              <SideNavigationLink href="/orders">
                <SideNavigationLabel>Orders</SideNavigationLabel>
              </SideNavigationLink>
            </SideNavigationItem>
            <SideNavigationItem value="customers">
              <SideNavigationLink href="/customers">
                <SideNavigationLabel>Customers</SideNavigationLabel>
              </SideNavigationLink>
            </SideNavigationItem>
          </SideNavigationList>
        </SideNavigation>
      </AppShellNav>
      <AppShellMain>
        <h1>Orders</h1>
      </AppShellMain>
    </AppShell>
  );
}
