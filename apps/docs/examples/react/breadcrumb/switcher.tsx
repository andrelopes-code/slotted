import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbTrigger,
} from '@slotted/react/breadcrumb';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@slotted/react/menu';

export default function BreadcrumbSwitcher() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Northwind</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <Menu>
            <MenuTrigger
              render={(props) => (
                <BreadcrumbTrigger {...props}>Accounts receivable</BreadcrumbTrigger>
              )}
            />
            <MenuContent>
              <MenuItem>Accounts payable</MenuItem>
              <MenuItem>Accounts receivable</MenuItem>
              <MenuItem>General ledger</MenuItem>
            </MenuContent>
          </Menu>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <Menu>
            <MenuTrigger
              render={(props) => (
                <BreadcrumbTrigger {...props} current>
                  August 2026
                </BreadcrumbTrigger>
              )}
            />
            <MenuContent>
              <MenuItem>July 2026</MenuItem>
              <MenuItem>August 2026</MenuItem>
              <MenuItem>September 2026</MenuItem>
            </MenuContent>
          </Menu>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
