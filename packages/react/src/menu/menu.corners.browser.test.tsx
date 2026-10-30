import { defineTheme, recipes, renderTheme } from '@slotted/theme';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import values from '../../../themes/src/default/values.json';
import { Menu } from './menu';
import { MenuContent, MenuTrigger } from './menu-parts';
import { MenuItem } from './menu-items';

const css = renderTheme(
  defineTheme({
    ...(values as object),
    name: 'menu-corners-test',
    seeds: {
      accent: '#1d4ed8',
      neutral: '#64748b',
      success: '#15803d',
      info: 'oklch(0.6 0.15 255)',
      warning: '#facc15',
      danger: '#dc2626',
    },
    recipe: recipes.standard,
  } as never),
);

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * An item read `--slotted-control-radius` against a panel at `radius-lg` and a
 * four-pixel inset: only `standard` was concentric. Under `round` an 8px item
 * sat inside a 16px panel whose concentric curve is 12px.
 */
describe('a menu item under each corner scale', () => {
  afterEach(() => {
    document.head.querySelector('style[data-menu-corners-test]')?.remove();
    document.documentElement.removeAttribute('data-slotted-theme');
    document.documentElement.removeAttribute('data-slotted-corners');
  });

  for (const corners of ['square', 'soft', 'standard', 'round'] as const) {
    it(`is concentric with its panel under ${corners}`, async () => {
      const style = document.createElement('style');
      style.setAttribute('data-menu-corners-test', '');
      style.textContent = css;
      document.head.append(style);
      document.documentElement.setAttribute('data-slotted-theme', 'menu-corners-test');
      document.documentElement.setAttribute('data-slotted-corners', corners);

      render(
        <Menu defaultOpen>
          <MenuTrigger>Document</MenuTrigger>
          <MenuContent>
            <MenuItem>Duplicate</MenuItem>
          </MenuContent>
        </Menu>,
      );
      await frame();
      const item = document.querySelector<HTMLElement>('[role="menuitem"]')!;
      const panel = item.closest<HTMLElement>('[data-part="content"]')!;
      const panelStyle = getComputedStyle(panel);
      const expected = Math.max(
        0,
        parseFloat(panelStyle.borderTopLeftRadius) - parseFloat(panelStyle.paddingInlineStart),
      );

      expect(parseFloat(getComputedStyle(item).borderTopLeftRadius)).toBe(expected);
    });
  }
});
