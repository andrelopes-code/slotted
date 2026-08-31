import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationList,
  PaginationPage,
} from './index';

const setup = () =>
  render(
    <Pagination>
      <PaginationList data-testid="list">
        <PaginationItem>
          <PaginationPage disabled>Previous</PaginationPage>
        </PaginationItem>
        <PaginationItem>
          <PaginationPage current>1</PaginationPage>
        </PaginationItem>
        <PaginationItem>
          <PaginationPage>2</PaginationPage>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis data-testid="ellipsis" />
        </PaginationItem>
        <PaginationItem>
          <PaginationPage>Next</PaginationPage>
        </PaginationItem>
      </PaginationList>
    </Pagination>,
  );

describe('Pagination', () => {
  it('is a named navigation landmark', () => {
    setup();

    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });

  it('leaves the label off when the consumer pointed at visible text instead', () => {
    render(
      <>
        <h2 id="pages">Results</h2>
        <Pagination aria-labelledby="pages" data-testid="nav" />
      </>,
    );

    expect(screen.getByTestId('nav')).not.toHaveAttribute('aria-label');
  });

  it('is an unordered list, because the pages are siblings', () => {
    setup();

    expect(screen.getByTestId('list').tagName).toBe('UL');
  });

  it('marks the page the reader is on, and only that one', () => {
    setup();

    expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: '2' })).not.toHaveAttribute('aria-current');
  });

  it('states disabled both to the platform and to the stylesheet', () => {
    setup();

    const previous = screen.getByRole('button', { name: 'Previous' });
    expect(previous).toBeDisabled();
    expect(previous).toHaveAttribute('data-disabled', '');
  });

  it('hides the gap, because it is not a destination', () => {
    setup();

    const ellipsis = screen.getByTestId('ellipsis');
    expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
    expect(ellipsis).toHaveTextContent('…');
  });

  it('does not submit the form around it', () => {
    setup();

    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('type', 'button');
  });

  it('becomes a link when the pages have addresses', () => {
    render(
      <PaginationPage current render={(props) => <a {...props} href="?page=3" />}>
        3
      </PaginationPage>,
    );

    const link = screen.getByRole('link', { name: '3' });
    expect(link).toHaveAttribute('href', '?page=3');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('keeps an aria-current the consumer set rather than replacing it', () => {
    render(
      <PaginationPage aria-current="true" current>
        3
      </PaginationPage>,
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'true');
  });
});
