import { defineTheme, recipes, renderTheme } from '@slotted/theme';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import values from '../../../themes/src/default/values.json';
import { ThemeScope } from './theme-scope';

const css = renderTheme(
  defineTheme({
    ...(values as object),
    name: 'text-test',
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
 * Text no family draws inherits the body step from the theme root, so a bare
 * paragraph and a family's body text are one size.
 */
describe('the theme root', () => {
  afterEach(() => {
    document.head.querySelector('style[data-text-test]')?.remove();
  });

  it('gives text outside every family the body size and line height', () => {
    const style = document.createElement('style');
    style.setAttribute('data-text-test', '');
    style.textContent = css;
    document.head.append(style);
    render(
      <ThemeScope theme="text-test">
        <p data-testid="bare">Plain text</p>
        <span
          data-testid="probe"
          style={{
            fontSize: 'var(--slotted-font-size-md)',
            lineHeight: 'var(--slotted-line-height-md)',
          }}
        />
      </ThemeScope>,
    );
    const computed = (id: string) =>
      getComputedStyle(document.querySelector(`[data-testid="${id}"]`)!);

    expect(computed('bare').fontSize).toBe(computed('probe').fontSize);
    expect(computed('bare').fontSize).not.toBe('16px');
    expect(computed('bare').lineHeight).toBe(computed('probe').lineHeight);
  });
});
