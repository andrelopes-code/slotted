import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  BreadcrumbLink,
  ButtonLink,
  CardLink,
  Link,
  List,
  ListItem,
  ListItemContent,
  ListItemLink,
  NavigationMenuLink,
  PageHeaderBack,
  SideNavigationLink,
  TableOfContentsLink,
  TagLink,
  TopNavigationAction,
  TopNavigationHelp,
  TopNavigationHome,
  TopNavigationLink,
} from './index';

/**
 * A router's link as TanStack Router types it under the repository's
 * `exactOptionalPropertyTypes`: an optional member does not admit `undefined`.
 * Every `render` a link family offers spreads its props onto it; the file
 * compiling is the type half of the test.
 */
interface RouterLinkProps {
  children?: ReactNode;
  className?: string;
  'data-current'?: string;
  href?: string;
  target?: string;
  to: string;
}

const received: Record<string, unknown>[] = [];

function RouterLink({ to, ...props }: RouterLinkProps) {
  received.push(props as Record<string, unknown>);
  return <a {...props} href={to} />;
}

export const spreadsOntoARouterLink = [
  <BreadcrumbLink key="breadcrumb" render={(props) => <RouterLink {...props} to="/" />} />,
  <ButtonLink key="button" render={(props) => <RouterLink {...props} to="/" />}>
    Go
  </ButtonLink>,
  <CardLink key="card" render={(props) => <RouterLink {...props} to="/" />} />,
  <Link key="link" render={(props) => <RouterLink {...props} to="/" />} />,
  <ListItemLink key="list-item" render={(props) => <RouterLink {...props} to="/" />} />,
  <NavigationMenuLink key="navigation-menu" render={(props) => <RouterLink {...props} to="/" />} />,
  <PageHeaderBack key="page-header" render={(props) => <RouterLink {...props} to="/" />} />,
  <SideNavigationLink key="side-navigation" render={(props) => <RouterLink {...props} to="/" />} />,
  <TableOfContentsLink
    key="table-of-contents"
    render={(props) => <RouterLink {...props} to="/" />}
  />,
  <TagLink key="tag" render={(props) => <RouterLink {...props} to="/" />} />,
  <TopNavigationAction key="action" render={(props) => <RouterLink {...props} to="/" />} />,
  <TopNavigationHelp key="help" render={(props) => <RouterLink {...props} to="/" />} />,
  <TopNavigationHome key="home" render={(props) => <RouterLink {...props} to="/" />} />,
  <TopNavigationLink key="top-link" render={(props) => <RouterLink {...props} to="/" />} />,
];

const undefinedMembers = (props: Record<string, unknown>) =>
  Object.keys(props).filter((name) => props[name] === undefined);

describe('the props a link family hands to render', () => {
  it('carry no member whose value is undefined', () => {
    received.length = 0;
    render(
      <>
        <ButtonLink render={(props) => <RouterLink {...props} to="/a" />}>Go</ButtonLink>
        <Link render={(props) => <RouterLink {...props} to="/b" />}>Go</Link>
        <List aria-label="Places">
          <ListItem>
            <ListItemContent
              render={(props) => (
                <div {...props}>
                  <ListItemLink render={(link) => <RouterLink {...link} to="/c" />} />
                </div>
              )}
            />
          </ListItem>
        </List>
      </>,
    );

    expect(received).toHaveLength(3);
    for (const props of received) expect(undefinedMembers(props)).toEqual([]);
  });
});
