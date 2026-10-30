import { defineTheme, recipes, renderTheme } from '@slotted/theme';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import values from '../../../themes/src/default/values.json';
import { ThemeScope } from './theme-scope';

const css = renderTheme(
  defineTheme({
    ...(values as object),
    name: 'corners-test',
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

/**
 * The reader chooses how round the corners are, as the density: below an
 * element that names a corner the scale, and what reads it, take that
 * corner's values; outside it they keep the base.
 */
describe('data-slotted-corners', () => {
  afterEach(() => {
    document.head.querySelector('style[data-corners-test]')?.remove();
  });

  it('scopes the radius scale and the tokens that read it to a subtree', () => {
    const style = document.createElement('style');
    style.setAttribute('data-corners-test', '');
    style.textContent = css;
    document.head.append(style);
    render(
      <ThemeScope theme="corners-test">
        <div data-testid="outside" />
        <ThemeScope corners="round">
          <div data-testid="inside" />
          <ThemeScope corners="standard">
            <div data-testid="nested" />
          </ThemeScope>
        </ThemeScope>
      </ThemeScope>,
    );
    const read = (id: string, name: string) =>
      getComputedStyle(document.querySelector(`[data-testid="${id}"]`)!)
        .getPropertyValue(name)
        .trim();

    expect(read('outside', '--slotted-radius-lg')).toBe('8px');
    expect(read('outside', '--slotted-control-radius')).toBe('4px');
    expect(read('inside', '--slotted-radius-lg')).toBe('16px');
    expect(read('inside', '--slotted-control-radius')).toBe('8px');
    expect(read('inside', '--slotted-radius-full')).toBe(read('outside', '--slotted-radius-full'));
    expect(read('nested', '--slotted-radius-lg')).toBe('8px');
    expect(read('nested', '--slotted-control-radius')).toBe('4px');
  });
});
