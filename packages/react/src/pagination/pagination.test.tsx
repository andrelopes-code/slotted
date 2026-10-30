import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/pagination/contract.json';
import { SlottedProvider } from '../i18n';
import { Pagination } from './pagination';
import { PaginationDefaultsProvider } from './pagination-defaults';
import {
  PaginationFirst,
  PaginationItems,
  PaginationLast,
  PaginationNext,
  PaginationPageSize,
  PaginationPrevious,
  PaginationStatus,
} from './pagination-parts';
import type { PaginationProps } from './pagination.types';

function Numbered(props: Partial<PaginationProps>) {
  return (
    <Pagination count={482} {...props}>
      <PaginationFirst />
      <PaginationPrevious />
      <PaginationItems />
      <PaginationNext />
      <PaginationLast />
      <PaginationStatus />
    </Pagination>
  );
}

const root = () => screen.getByRole('navigation');
const control = (part: string) => root().querySelector(`[data-part="${part}"]`) as HTMLElement;
const pages = () =>
  [...root().querySelectorAll('[data-part="page"]')].map((page) => page.textContent);
const current = () => root().querySelector('[aria-current="page"]') as HTMLElement;

describe('Pagination', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(<Numbered className="table-pager" />);

    expect(root().tagName).toBe('NAV');
    expect(root()).toHaveAttribute('data-ui', 'pagination');
    expect(root()).toHaveAttribute('data-part', 'root');
    expect(root()).toHaveClass('table-pager');
    expect(root()).toHaveAttribute('aria-label', 'Pagination');
    expect(control('list').tagName).toBe('UL');
  });

  /** The row and its arithmetic come from the module both bindings share. */
  it('draws the row the shared arithmetic produced', () => {
    render(<Numbered defaultPage={7} pageSize={20} />);

    expect(pages()).toEqual(['1', '6', '7', '8', '25']);
    expect(root().querySelectorAll('[data-part="ellipsis"]')).toHaveLength(2);
    expect(contract.arithmetic).toBe('@slotted/core/pagination');
  });

  it('marks the current page with the value the specification names', () => {
    render(<Numbered defaultPage={3} />);

    expect(current()).toHaveTextContent('3');
    expect(current()).toHaveAttribute('aria-current', 'page');
    expect(contract.currentValue).toBe('page');
  });

  it('names every control so a reader hears which page it moves to', () => {
    render(<Numbered defaultPage={3} />);

    expect(control('first')).toHaveAccessibleName('First page');
    expect(control('previous')).toHaveAccessibleName('Previous page');
    expect(control('next')).toHaveAccessibleName('Next page');
    expect(control('last')).toHaveAccessibleName('Last page');
    expect(current()).toHaveAccessibleName('Page 3');
  });

  it('draws one chevron for a step and two for an end, each mirrored with the text', () => {
    render(<Numbered defaultPage={3} />);

    const glyphs = (['first', 'previous', 'next', 'last'] as const).map((name) => {
      const box = control(name).querySelector('[data-ui="icon"]');
      expect(box).toHaveAttribute('data-directional');
      return box?.querySelector('svg[data-glyph]')?.getAttribute('data-glyph');
    });
    expect(glyphs).toEqual(['chevrons-right', 'chevron-right', 'chevron-right', 'chevrons-right']);
  });

  describe('the page', () => {
    it('moves when a page is pressed, and carries the reason', () => {
      const onPageChange = vi.fn();
      render(<Numbered defaultPage={1} onPageChange={onPageChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));

      expect(onPageChange).toHaveBeenCalledWith(
        2,
        expect.objectContaining({ previous: 1, reason: 'pointer' }),
      );
      expect(current()).toHaveTextContent('2');
    });

    it('never moves state the consumer owns', () => {
      const onPageChange = vi.fn();
      render(<Numbered onPageChange={onPageChange} page={4} />);

      fireEvent.click(control('next'));

      expect(onPageChange).toHaveBeenCalledWith(5, expect.objectContaining({ reason: 'pointer' }));
      expect(current()).toHaveTextContent('4');
    });

    it('follows the consumer once they accept the request', () => {
      function Controlled() {
        const [page, setPage] = useState(1);
        return <Numbered onPageChange={setPage} page={page} />;
      }
      render(<Controlled />);

      fireEvent.click(control('next'));
      expect(current()).toHaveTextContent('2');
    });

    it('commits nothing when the request is cancelled', () => {
      render(<Numbered defaultPage={2} onPageChange={(_, request) => request.cancel()} />);

      fireEvent.click(control('next'));
      expect(current()).toHaveTextContent('2');
    });

    /**
     * The collection shrinks under a reader on page forty. The family clamps
     * and says so, so a consumer holding the value follows instead of
     * rendering an empty page.
     */
    it('clamps a page the collection no longer has, and reports the clamp', () => {
      const onPageChange = vi.fn();
      render(<Numbered count={40} onPageChange={onPageChange} page={40} />);

      expect(current()).toHaveTextContent('2');
      expect(onPageChange).toHaveBeenCalledWith(
        2,
        expect.objectContaining({ reason: 'programmatic' }),
      );
    });
  });

  describe('the page size', () => {
    it('is a native select named by the label that wraps it', () => {
      render(
        <Pagination count={482}>
          <PaginationPageSize />
        </Pagination>,
      );

      const select = screen.getByRole('combobox');
      expect(select.tagName).toBe('SELECT');
      expect(select).toHaveAttribute('data-part', 'page-size');
      expect(select).toHaveAccessibleName('Rows per page');
      expect(select.closest('[data-part="page-size-label"]')).not.toBeNull();
      expect(
        select.parentElement?.querySelector(
          ':scope > [data-ui="icon"] > svg[data-glyph="chevron-down"]',
        ),
      ).not.toBeNull();
    });

    it('moves the size, carries the reason, and takes the page with it', () => {
      const onPageSizeChange = vi.fn();
      render(
        <Pagination count={482} defaultPage={7} onPageSizeChange={onPageSizeChange}>
          <PaginationPageSize />
          <PaginationStatus />
        </Pagination>,
      );

      fireEvent.change(screen.getByRole('combobox'), { target: { value: '100' } });

      expect(onPageSizeChange).toHaveBeenCalledWith(
        100,
        expect.objectContaining({ previous: 20, reason: 'select' }),
      );
      /* Item 121 was the first on page seven of twenty; at a hundred a page it
         is on page two, and that is where the reader stays. */
      expect(control('status')).toHaveTextContent('101–200 of 482');
    });
  });

  describe('the two sentences', () => {
    it('says which items this page holds, politely', () => {
      render(<Numbered defaultPage={7} />);

      expect(control('status')).toHaveTextContent('121–140 of 482');
      expect(control('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('says which page it is, for the width where the row is not drawn', () => {
      render(<Numbered defaultPage={7} />);
      expect(control('summary')).toHaveTextContent('Page 7 of 25');
    });

    it('lets an application silence the announcement', () => {
      render(<Numbered live="off" />);
      expect(control('status')).toHaveAttribute('aria-live', 'off');
    });

    it('says so when the collection is empty', () => {
      render(<Numbered count={0} />);
      expect(control('status')).toHaveTextContent('No results');
    });
  });

  describe('a total the server does not know', () => {
    it('draws no page numbers and invents no total', () => {
      render(
        <Pagination>
          <PaginationPrevious />
          <PaginationStatus>Showing the first 20 results</PaginationStatus>
          <PaginationNext />
        </Pagination>,
      );

      expect(control('list')).toBeNull();
      expect(control('previous')).toBeDisabled();
      expect(control('next')).not.toBeDisabled();
    });

    it('still moves forward, one page at a time', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination onPageChange={onPageChange}>
          <PaginationNext />
        </Pagination>,
      );

      fireEvent.click(control('next'));
      expect(onPageChange).toHaveBeenCalledWith(2, expect.objectContaining({ reason: 'pointer' }));
    });
  });

  describe('states', () => {
    it('disables the triggers at each bound', () => {
      const { rerender } = render(<Numbered defaultPage={1} />);
      expect(control('first')).toBeDisabled();
      expect(control('previous')).toBeDisabled();
      expect(control('next')).not.toBeDisabled();

      rerender(<Numbered defaultPage={25} key="last" />);
      expect(control('next')).toBeDisabled();
      expect(control('last')).toBeDisabled();
    });

    it('refuses every move while a page change is in flight', () => {
      const onPageChange = vi.fn();
      render(<Numbered defaultPage={3} loading onPageChange={onPageChange} />);

      fireEvent.click(control('next'));

      expect(onPageChange).not.toHaveBeenCalled();
      expect(root()).toHaveAttribute('aria-busy', 'true');
      expect(root()).toHaveAttribute('data-loading', '');
    });

    it('takes every control away while the family is disabled', () => {
      render(
        <Pagination count={100} disabled>
          <PaginationNext />
          <PaginationItems />
          <PaginationPageSize />
        </Pagination>,
      );

      expect(root()).toHaveAttribute('data-disabled', '');
      expect(control('next')).toBeDisabled();
      expect(screen.getByRole('combobox')).toBeDisabled();
      expect(current()).toHaveAttribute('data-disabled', '');
    });
  });

  describe('link mode', () => {
    it('gives every control a real destination', () => {
      render(<Numbered defaultPage={3} itemHref={(page) => `/invoices?page=${page}`} />);

      expect(control('next').tagName).toBe('A');
      expect(control('next')).toHaveAttribute('href', '/invoices?page=4');
      expect(current().tagName).toBe('A');
      expect(current()).toHaveAttribute('href', '/invoices?page=3');
    });

    /** An anchor has no `disabled`, and one that kept its destination would
        still navigate on a middle click. */
    it('withholds the destination from a trigger at a bound', () => {
      render(<Numbered defaultPage={1} itemHref={(page) => `/p/${page}`} />);

      expect(control('previous')).not.toHaveAttribute('href');
      expect(control('previous')).toHaveAttribute('aria-disabled', 'true');
      expect(control('previous')).toHaveAttribute('data-disabled', '');
    });
  });

  describe('composition', () => {
    it('takes the application defaults, and yields to an explicit prop', () => {
      render(
        <PaginationDefaultsProvider siblingCount={2}>
          <Numbered defaultPage={10} />
        </PaginationDefaultsProvider>,
      );

      expect(pages()).toEqual(['1', '8', '9', '10', '11', '12', '25']);
    });

    it('speaks the language in force, and lays its own messages over it', () => {
      render(
        <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
          {/* language: pt-BR */}
          <Numbered defaultPage={10} messages={{ previous: 'Voltar' }} />
          {/* language: en-US */}
        </SlottedProvider>,
      );

      // language: pt-BR
      expect(control('next')).toHaveAccessibleName('Próxima página');
      expect(control('previous')).toHaveAccessibleName('Voltar');
      expect(screen.getByRole('navigation')).toHaveAccessibleName('Paginação');
      // language: en-US
    });

    it('merges one message with the eight it did not touch', () => {
      render(<Numbered messages={{ next: 'Next' }} />);

      expect(control('next')).toHaveAccessibleName('Next');
      expect(control('previous')).toHaveAccessibleName('Previous page');
    });

    it('composes the consumer handler rather than replacing it', () => {
      const onClick = vi.fn();
      const onPageChange = vi.fn();
      render(
        <Pagination count={100} onPageChange={onPageChange}>
          <PaginationNext onClick={onClick} />
        </Pagination>,
      );

      fireEvent.click(control('next'));
      expect(onClick).toHaveBeenCalledOnce();
      expect(onPageChange).toHaveBeenCalledOnce();
    });

    it('refuses to render a part outside the paginator it belongs to', () => {
      const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      expect(() => render(<PaginationNext />)).toThrow(/inside a Pagination/);
      quiet.mockRestore();
    });
  });
});
