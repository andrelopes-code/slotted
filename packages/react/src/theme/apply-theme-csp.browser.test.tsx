import { applyTheme, defineTheme, recipes } from '@slotted/theme';
import { describe, expect, it } from 'vitest';

import values from '../../../themes/src/default/values.json';

/**
 * Under a policy without 'unsafe-inline', a `<style>` the page writes is
 * refused and the theme never reached the page. The policy stays on this
 * file's document.
 */
describe("applyTheme under default-src 'self'", () => {
  it('puts the theme on the page, and its disposer takes it off', () => {
    const policy = document.createElement('meta');
    policy.httpEquiv = 'Content-Security-Policy';
    policy.content = "default-src 'self'";
    document.head.append(policy);
    document.documentElement.setAttribute('data-slotted-theme', 'csp-red');
    const seed = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--slotted-seed-accent').trim();

    const dispose = applyTheme(red('csp-red'));

    expect(seed()).toBe('rgb(255, 0, 0)');

    dispose();

    expect(seed()).not.toBe('rgb(255, 0, 0)');
  });

  it('keeps one adopted sheet per name, owned by the latest call', () => {
    const first = applyTheme(red('csp-shared'));
    const second = applyTheme(red('csp-shared'));
    const adopted = () => document.adoptedStyleSheets.length;

    expect(adopted()).toBe(1);

    first();

    expect(adopted()).toBe(1);

    second();
    second();

    expect(adopted()).toBe(0);
  });
});

function red(name: string) {
  return defineTheme({
    ...(values as object),
    name,
    seeds: {
      accent: '#ff0000',
      neutral: '#64748b',
      success: '#15803d',
      info: 'oklch(0.6 0.15 255)',
      warning: '#facc15',
      danger: '#dc2626',
    },
    recipe: recipes.standard,
  } as Parameters<typeof defineTheme>[0]);
}
