import {
  SideNavigation,
  SideNavigationCount,
  SideNavigationItem,
  SideNavigationLabel,
  SideNavigationLink,
  SideNavigationList,
} from '@slotted/react/side-navigation';

export default function SideNavigationBasic() {
  return (
    <SideNavigation aria-label="Main navigation" defaultValue="loads">
      <SideNavigationList>
        <SideNavigationItem value="dashboard">
          <SideNavigationLink href="/dashboard">
            <SideNavigationLabel>Dashboard</SideNavigationLabel>
          </SideNavigationLink>
        </SideNavigationItem>
        <SideNavigationItem value="loads">
          <SideNavigationLink href="/loads">
            <SideNavigationLabel>Loads</SideNavigationLabel>
            <SideNavigationCount>12</SideNavigationCount>
          </SideNavigationLink>
        </SideNavigationItem>
      </SideNavigationList>
    </SideNavigation>
  );
}
