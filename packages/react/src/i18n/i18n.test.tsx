import { dataGridMessages, paginationMessages } from '@slotted/core/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { render, screen } from '@testing-library/react';
import { memo, useState } from 'react';
import { describe, expect, it } from 'vitest';

import { SlottedProvider, useLocale, useMessages } from './index';

function GroupCount({ count, testId }: { count: number; testId: string }) {
  const t = useMessages(dataGridMessages);
  return <span data-testid={testId}>{t('groupCount', { count })}</span>;
}

function Locale() {
  return <span data-testid="locale">{useLocale()}</span>;
}

describe('SlottedProvider', () => {
  it('writes English with no provider at all', () => {
    render(
      <>
        <GroupCount count={2} testId="rows" />
        <Locale />
      </>,
    );
    expect(screen.getByTestId('rows').textContent).toBe('2 rows');
    expect(screen.getByTestId('locale').textContent).toBe('en-US');
  });

  it('writes the catalog of the locale it is given', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <GroupCount count={1} testId="rows" />
      </SlottedProvider>,
    );
    expect(screen.getByTestId('rows').textContent).toBe('1 linha');
  });

  it('lets two subtrees speak two languages in one render, the inner inheriting the catalogs', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <GroupCount count={2} testId="outer" />
        <SlottedProvider locale="en-US">
          <GroupCount count={2} testId="inner" />
        </SlottedProvider>
        <SlottedProvider locale="pt-BR">
          <GroupCount count={3} testId="inherited" />
        </SlottedProvider>
      </SlottedProvider>,
    );
    expect(screen.getByTestId('outer').textContent).toBe('2 linhas');
    expect(screen.getByTestId('inner').textContent).toBe('2 rows');
    expect(screen.getByTestId('inherited').textContent).toBe('3 linhas');
  });

  it('lets an instance override replace a key over the catalog', () => {
    function Range() {
      const t = useMessages(paginationMessages, { label: 'Report pages' });
      return <span data-testid="label">{t('label')}</span>;
    }
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Range />
      </SlottedProvider>,
    );
    expect(screen.getByTestId('label').textContent).toBe('Report pages');
  });

  it("asks the application's resolve first", () => {
    render(
      <SlottedProvider
        locale="en-US"
        resolve={(path, slots) =>
          path === 'dataGrid.groupCount' ? `${slots['count']} lines` : undefined
        }
      >
        <GroupCount count={4} testId="rows" />
      </SlottedProvider>,
    );
    expect(screen.getByTestId('rows').textContent).toBe('4 lines');
  });

  it('changes language when the locale changes, without remounting', () => {
    let mounts = 0;
    function Counted() {
      useState(() => mounts++);
      return <GroupCount count={2} testId="rows" />;
    }
    function App({ locale }: { locale: string }) {
      return (
        <SlottedProvider locale={locale} catalogs={{ 'pt-BR': PT_BR }}>
          <Counted />
        </SlottedProvider>
      );
    }
    const { rerender } = render(<App locale="en-US" />);
    expect(screen.getByTestId('rows').textContent).toBe('2 rows');
    rerender(<App locale="pt-BR" />);
    expect(screen.getByTestId('rows').textContent).toBe('2 linhas');
    expect(mounts).toBe(1);
  });

  /** The shape the spec shows, `catalogs={{ 'pt-BR': PT_BR }}`, is a new object on every render. */
  it('keeps the same words for the same catalogs and resolve written inline', () => {
    let renders = 0;
    const Counted = memo(function Counted() {
      const t = useMessages(dataGridMessages);
      renders++;
      return <span data-testid="rows">{t('groupCount', { count: 2 })}</span>;
    });
    function App() {
      return (
        <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }} resolve={() => undefined}>
          <Counted />
        </SlottedProvider>
      );
    }
    const { rerender } = render(<App />);
    rerender(<App />);
    rerender(<App />);
    expect(screen.getByTestId('rows').textContent).toBe('2 linhas');
    expect(renders).toBe(1);
  });
});
