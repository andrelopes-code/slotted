import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApiTable } from './api-table';
import { WorkbenchMatrix } from './matrix';
import { createReferencePage } from './reference-page';

vi.mock('@storybook/addon-docs/blocks', () => ({ Canvas: () => null }));

describe('workbench data tables', () => {
  it('links matrix headers and cells through native table semantics in a focusable named region', () => {
    render(<WorkbenchMatrix columns={['Accent']} rows={[{ label: 'Solid', cells: ['Save'] }]} />);

    const region = screen.getByRole('region', { name: 'Component comparison' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('columnheader', { name: 'Accent' })).toHaveAttribute('scope', 'col');
    expect(screen.getByRole('rowheader', { name: 'Solid' })).toHaveAttribute('scope', 'row');
    expect(screen.getByRole('cell', { name: 'Save' })).toBeInTheDocument();
  });

  it('makes API and token overflow regions named and keyboard focusable', () => {
    const Page = createReferencePage({
      accessibility: [],
      api: [],
      description: 'Reference',
      framework: 'React',
      snippets: [],
      stories: () => ({ essential: {} as never }),
      title: 'Button',
      tokens: [{ name: '--button-bg', purpose: 'Background' }],
    });

    render(<><ApiTable rows={[{ name: 'tone', type: 'string', defaultValue: 'accent', appliesTo: 'Button', description: 'Color' }]} /><Page /></>);

    for (const name of ['Component API', 'Public tokens']) {
      expect(screen.getByRole('region', { name })).toHaveAttribute('tabindex', '0');
    }
  });
});
