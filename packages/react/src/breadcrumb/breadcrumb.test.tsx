import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from './index';

const setup = () =>
  render(
    <Breadcrumb>
      <BreadcrumbList data-testid="list">
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Workspace</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="/invoices">Invoices</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink current href="/invoices/42">
            INV-0042
          </BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>,
  );

describe('Breadcrumb', () => {
  it('is a named navigation landmark', () => {
    setup();

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('takes the name the consumer gave it', () => {
    render(<Breadcrumb aria-label="You are here" />);

    expect(screen.getByRole('navigation', { name: 'You are here' })).toBeInTheDocument();
  });

  it('leaves the label off when the consumer pointed at visible text instead', () => {
    render(
      <>
        <h2 id="where">Location</h2>
        <Breadcrumb aria-labelledby="where" data-testid="nav" />
      </>,
    );

    expect(screen.getByTestId('nav')).not.toHaveAttribute('aria-label');
    expect(screen.getByRole('navigation', { name: 'Location' })).toBeInTheDocument();
  });

  it('is an ordered list, because the order is the information', () => {
    setup();

    expect(screen.getByTestId('list').tagName).toBe('OL');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('marks the page the reader is on, and only that one', () => {
    setup();

    const links = screen.getAllByRole('link');
    expect(links[2]).toHaveAttribute('aria-current', 'page');
    expect(links[2]).toHaveAttribute('data-current', '');
    expect(links[0]).not.toHaveAttribute('aria-current');
    expect(links[0]).not.toHaveAttribute('data-current');
  });

  it('leaves the current page reachable, rather than dropping the link', () => {
    setup();

    const links = screen.getAllByRole('link');
    expect(links[2]).toHaveAttribute('href', '/invoices/42');
  });

  it('keeps an aria-current the consumer set rather than replacing it', () => {
    render(<BreadcrumbLink aria-current="step" current href="/step-2" />);

    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'step');
  });

  it('ships no separator element for a consumer to hide', () => {
    setup();

    expect(screen.getByTestId('list').querySelectorAll('[aria-hidden]')).toHaveLength(0);
  });
});
