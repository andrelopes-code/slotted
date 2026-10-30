import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Menu } from './menu';
import { MenuContent, MenuTrigger } from './menu-parts';
import { MenuItemDescription, MenuItemLabel, MenuRadioGroup, MenuRadioItem } from './menu-items';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

describe('a radio item written from its parts', () => {
  it('sets the description under the label', async () => {
    render(
      <Menu defaultOpen>
        <MenuTrigger>Document</MenuTrigger>
        <MenuContent>
          <MenuRadioGroup value="a" onValueChange={() => undefined}>
            <MenuRadioItem value="a">
              <MenuItemLabel>Trade</MenuItemLabel>
              <MenuItemDescription>Buy or sell an asset</MenuItemDescription>
            </MenuRadioItem>
          </MenuRadioGroup>
        </MenuContent>
      </Menu>,
    );
    await frame();

    const item = document.querySelector<HTMLElement>('[role="menuitemradio"]')!;
    const label = item.querySelector<HTMLElement>(':scope > [data-part="label"]')!;
    const description = item.querySelector<HTMLElement>(':scope > [data-part="description"]')!;

    expect(description.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      label.getBoundingClientRect().bottom,
    );
  });
});
