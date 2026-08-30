/** @vitest-environment jsdom */

import { isValidElement, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import preview from './preview';

describe('React Storybook preview', () => {
  it('maps toolbar globals to a readable full-viewport theme wrapper', () => {
    const decorators = Array.isArray(preview.decorators)
      ? preview.decorators
      : preview.decorators
        ? [preview.decorators]
        : [];
    const decorator = decorators[0];

    expect(decorator).toBeTypeOf('function');

    const rendered = decorator?.(() => <span>Probe</span>, {
      globals: {
        density: 'compact',
        scheme: 'dark',
        theme: 'default',
      },
    } as never) as ReactElement<Record<string, unknown>>;

    expect(isValidElement(rendered)).toBe(true);
    expect(rendered.props).toMatchObject({
      'data-slotted-density': 'compact',
      'data-slotted-scheme': 'dark',
      'data-slotted-theme': 'default',
      style: {
        background: 'var(--slotted-button-outline-background)',
        boxSizing: 'border-box',
        color: 'var(--slotted-tone-neutral-text)',
        colorScheme: 'dark',
        minHeight: '100dvh',
      },
    });
    expect(preview.parameters).toMatchObject({
      backgrounds: { disable: true },
      layout: 'fullscreen',
    });
    expect(document.documentElement.dataset['slottedScheme']).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });
});
