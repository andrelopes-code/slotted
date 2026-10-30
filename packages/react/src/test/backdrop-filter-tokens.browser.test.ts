import '@slotted/styles/action-bar/action-bar.css';
import '@slotted/styles/combobox/combobox.css';
import '@slotted/styles/date-picker/date-picker.css';
import '@slotted/styles/drawer/drawer.css';
import '@slotted/styles/entity-picker/entity-picker.css';
import '@slotted/styles/menu/menu.css';
import '@slotted/styles/popover/popover.css';
import '@slotted/styles/select/select.css';
import '@slotted/styles/tooltip/tooltip.css';

import { cdp } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * Each surface a theme can paint as a translucent material exposes a
 * `--slotted-<name>-backdrop-filter`, `none` unless set, and `none` again for
 * a reader who asked for less transparency.
 */
const SURFACES: [token: string, outer: string, inner: string | null][] = [
  ['menu', 'data-ui-menu', 'data-part-content'],
  ['popover', 'data-ui-popover', 'data-part-content'],
  ['tooltip', 'data-ui-tooltip', 'data-part-content'],
  ['drawer', 'data-ui-drawer', 'data-part-panel'],
  ['action-bar', 'data-ui-action-bar data-variant="raised"', null],
  ['select-content', 'data-ui-select', 'data-part-content'],
  ['combobox-content', 'data-ui-combobox', 'data-part-content'],
  ['entity-picker-content', 'data-ui-entity-picker', 'data-part-content'],
  ['date-picker-content', 'data-ui-date-picker', 'data-part-content'],
];

function surface(outer: string, inner: string | null) {
  const root = document.createElement('div');
  for (const attribute of outer.split(' ')) {
    const [name, value] = attribute.split('=');
    root.setAttribute(name!, value?.replaceAll('"', '') ?? '');
  }
  document.body.append(root);
  if (inner === null) return root;
  const child = document.createElement('div');
  child.setAttribute(inner, '');
  root.append(child);
  return child;
}

describe('the backdrop-filter tokens of the floating surfaces', () => {
  afterEach(async () => {
    document.body.replaceChildren();
    document.documentElement.removeAttribute('style');
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
  });

  it.each(SURFACES)(
    '%s: none by default, the token when a theme sets it',
    (token, outer, inner) => {
      const element = surface(outer, inner);
      expect(getComputedStyle(element).backdropFilter).toBe('none');
      document.documentElement.style.setProperty(`--slotted-${token}-backdrop-filter`, 'blur(7px)');
      expect(getComputedStyle(element).backdropFilter).toBe('blur(7px)');
    },
  );

  it.each(SURFACES)(
    '%s: none for a reader who asked for less transparency',
    async (token, outer, inner) => {
      document.documentElement.style.setProperty(`--slotted-${token}-backdrop-filter`, 'blur(7px)');
      await cdp().send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
      });
      expect(getComputedStyle(surface(outer, inner)).backdropFilter).toBe('none');
    },
  );
});
