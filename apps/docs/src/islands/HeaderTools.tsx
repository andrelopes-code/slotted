import { Contrast, Menu as MenuGlyph, Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { IconButton } from '@slotted/react/button';
import { CommandPalette, CommandPaletteTrigger } from '@slotted/react/command-palette';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerHeader,
  DrawerPanel,
  DrawerTitle,
  DrawerTrigger,
} from '@slotted/react/drawer';
import { Glyph, Icon } from '@slotted/react/icon';
import { Shortcut } from '@slotted/react/kbd';
import { Menu, MenuContent, MenuRadioGroup, MenuRadioItem, MenuTrigger } from '@slotted/react/menu';
import { Segment, SegmentedControl } from '@slotted/react/segmented-control';

import { applySchemeChoice, readSchemeChoice, type SchemeChoice } from '../lib/scheme';

export interface SearchEntry {
  id: string;
  label: string;
  group: string;
  href: string;
  description?: string;
}

interface Props {
  /** The page's framework; `undefined` on a page written for every framework. */
  framework: 'react' | 'angular' | undefined;
  /** Where each framework's version of this page lives; `null` when it does not exist yet. */
  frameworkHrefs: { react: string | null; angular: string | null };
  search: SearchEntry[];
  /** The documentation navigation, shown in a drawer below the wide layout. */
  nav: { heading: string; links: { label: string; href: string }[] }[];
  path: string;
}

const SCHEME_ICONS: Record<SchemeChoice, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
  'high-contrast': Contrast,
};

export default function HeaderTools({ framework, frameworkHrefs, search, nav, path }: Props) {
  const [scheme, setScheme] = useState<SchemeChoice>('system');

  useEffect(() => {
    setScheme(readSchemeChoice());
    const media = matchMedia('(prefers-color-scheme: dark)');
    const follow = () => {
      if (readSchemeChoice() === 'system') applySchemeChoice('system');
    };
    media.addEventListener('change', follow);
    return () => media.removeEventListener('change', follow);
  }, []);

  const SchemeIcon = SCHEME_ICONS[scheme];

  return (
    <>
      <CommandPalette
        items={search}
        groups={[...new Set(search.map((entry) => entry.group))].map((group) => ({
          id: group,
          label: group,
        }))}
        messages={{ placeholder: 'Search components and guides' }}
      >
        <CommandPaletteTrigger
          render={(props) => (
            <button {...props} type="button" className="docs-search" aria-label="Search">
              <Icon size="sm">
                <Glyph name="search" />
              </Icon>
              <span className="docs-search-label" aria-hidden="true">
                Search documentation
              </span>
              <span className="docs-search-keys" aria-hidden="true">
                <Shortcut keys="mod+k" separator="" size="xs" variant="outline" />
              </span>
            </button>
          )}
        />
      </CommandPalette>

      {framework && (
        <SegmentedControl
          aria-label="Framework"
          size="sm"
          value={framework}
          onValueChange={(value) => {
            const href = value === 'react' || value === 'angular' ? frameworkHrefs[value] : null;
            if (href) window.location.assign(href);
          }}
        >
          <Segment value="react">React</Segment>
          <Segment value="angular" disabled={frameworkHrefs.angular === null}>
            Angular
          </Segment>
        </SegmentedControl>
      )}

      <Menu>
        <MenuTrigger
          render={(props) => (
            <IconButton {...props} aria-label="Color scheme" size="sm">
              <Icon size="sm">
                <SchemeIcon strokeWidth={1.75} />
              </Icon>
            </IconButton>
          )}
        />
        <MenuContent>
          <MenuRadioGroup
            value={scheme}
            onValueChange={(value) => {
              const choice = value as SchemeChoice;
              setScheme(choice);
              applySchemeChoice(choice);
            }}
          >
            <MenuRadioItem value="system">System</MenuRadioItem>
            <MenuRadioItem value="light">Light</MenuRadioItem>
            <MenuRadioItem value="dark">Dark</MenuRadioItem>
            <MenuRadioItem value="high-contrast">High contrast</MenuRadioItem>
          </MenuRadioGroup>
        </MenuContent>
      </Menu>

      <div className="docs-nav-toggle">
        <Drawer side="start" size="sm">
          <DrawerTrigger
            render={(props) => (
              <IconButton {...props} aria-label="Open navigation" size="sm">
                <Icon size="sm">
                  <MenuGlyph strokeWidth={1.75} />
                </Icon>
              </IconButton>
            )}
          />
          <DrawerPanel render={(props) => <nav {...props} aria-label="Documentation" />}>
            <DrawerHeader>
              <DrawerTitle>Documentation</DrawerTitle>
              <DrawerClose />
            </DrawerHeader>
            <DrawerBody>
              {nav.map((group) => (
                <section key={group.heading} className="docs-nav-group">
                  <h2 className="docs-nav-heading">{group.heading}</h2>
                  <ul className="docs-nav-list">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <a href={link.href} aria-current={path === link.href ? 'page' : undefined}>
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </DrawerBody>
          </DrawerPanel>
        </Drawer>
      </div>
    </>
  );
}
