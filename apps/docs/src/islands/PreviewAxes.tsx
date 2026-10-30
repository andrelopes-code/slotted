import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import { IconButton } from '@slotted/react/button';
import { Icon } from '@slotted/react/icon';
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from '@slotted/react/menu';

interface Props {
  /** The id of the preview element whose theme axes this menu sets. */
  target: string;
}

type Axis = 'scheme' | 'density';

/**
 * One preview, re-scoped: the theme's axes are attributes, so setting them on
 * the preview element gives it its own scheme and density without touching
 * the page around it.
 */
function setAxis(target: string, axis: Axis, value: string): void {
  const element = document.getElementById(target);
  if (!element) return;
  element.setAttribute('data-slotted-theme', 'default');
  if (value === 'page') element.removeAttribute(`data-slotted-${axis}`);
  else element.setAttribute(`data-slotted-${axis}`, value);
}

export default function PreviewAxes({ target }: Props) {
  const [scheme, setScheme] = useState('page');
  const [density, setDensity] = useState('page');

  return (
    <Menu size="sm">
      <MenuTrigger
        render={(props) => (
          <IconButton {...props} aria-label="Preview settings" size="sm" variant="ghost">
            <Icon size="sm">
              <SlidersHorizontal strokeWidth={1.75} />
            </Icon>
          </IconButton>
        )}
      />
      <MenuContent>
        <MenuGroup label="Scheme">
          <MenuRadioGroup
            value={scheme}
            onValueChange={(value) => {
              setScheme(value);
              setAxis(target, 'scheme', value);
            }}
          >
            <MenuRadioItem value="page">Same as page</MenuRadioItem>
            <MenuRadioItem value="light">Light</MenuRadioItem>
            <MenuRadioItem value="dark">Dark</MenuRadioItem>
            <MenuRadioItem value="high-contrast">High contrast</MenuRadioItem>
          </MenuRadioGroup>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup label="Density">
          <MenuRadioGroup
            value={density}
            onValueChange={(value) => {
              setDensity(value);
              setAxis(target, 'density', value);
            }}
          >
            <MenuRadioItem value="page">Same as page</MenuRadioItem>
            <MenuRadioItem value="comfortable">Comfortable</MenuRadioItem>
            <MenuRadioItem value="compact">Compact</MenuRadioItem>
            <MenuRadioItem value="dense">Dense</MenuRadioItem>
          </MenuRadioGroup>
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
}
