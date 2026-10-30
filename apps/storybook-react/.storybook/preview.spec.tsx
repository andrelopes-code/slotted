/** @vitest-environment jsdom */

import { dataGridMessages } from '@slotted/core/i18n';
import { useMessages } from '@slotted/react/i18n';
import { act, isValidElement, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
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
        background: 'var(--slotted-workbench-canvas)',
        boxSizing: 'border-box',
        color: 'var(--slotted-workbench-text)',
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

  /** Every family is read in each published language without a story of its own. */
  it('renders the story in the toolbar language and writes it onto the document', () => {
    const decorators = Array.isArray(preview.decorators) ? preview.decorators : [];
    function Rows() {
      const t = useMessages(dataGridMessages);
      return <span data-testid="rows">{t('groupCount', { count: 2 })}</span>;
    }
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    act(() =>
      root.render(
        decorators[0]!(() => <Rows />, { globals: { locale: 'pt-BR' } } as never) as ReactElement,
      ),
    );

    expect(host.querySelector('[data-testid="rows"]')?.textContent).toBe('2 linhas');
    expect(document.documentElement.lang).toBe('pt-BR');
    act(() => root.unmount());
    host.remove();
  });
});
