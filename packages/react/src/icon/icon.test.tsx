import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { Icon } from './index';

const glyph = (
  <svg data-testid="glyph" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

describe('Icon', () => {
  it('renders a span carrying the family identity, with the artwork inside it', () => {
    render(<Icon>{glyph}</Icon>);

    const box = screen.getByTestId('glyph').parentElement;
    expect(box?.tagName).toBe('SPAN');
    expect(box).toHaveAttribute('data-ui', 'icon');
    expect(box).toHaveAttribute('data-part', 'root');
  });

  it('writes no axis the consumer did not decide, so the base rule paints the default', () => {
    render(<Icon data-testid="box">{glyph}</Icon>);

    const box = screen.getByTestId('box');
    expect(box).not.toHaveAttribute('data-size');
    expect(box).not.toHaveAttribute('data-tone');
    expect(box).not.toHaveAttribute('data-directional');
  });

  it('states each axis the consumer decided', () => {
    render(
      <Icon data-testid="box" directional size="lg" tone="danger">
        {glyph}
      </Icon>,
    );

    const box = screen.getByTestId('box');
    expect(box).toHaveAttribute('data-size', 'lg');
    expect(box).toHaveAttribute('data-tone', 'danger');
    expect(box).toHaveAttribute('data-directional', '');
  });

  it('treats an inherited tone as the absence of a colour', () => {
    render(
      <Icon data-testid="box" tone="inherit">
        {glyph}
      </Icon>,
    );

    expect(screen.getByTestId('box')).not.toHaveAttribute('data-tone');
  });

  it('leaves an unnamed icon out of the accessibility tree', () => {
    render(<Icon data-testid="box">{glyph}</Icon>);

    const box = screen.getByTestId('box');
    expect(box).toHaveAttribute('aria-hidden', 'true');
    expect(box).not.toHaveAttribute('role');
  });

  it('gives a named icon the role that requires a name', () => {
    render(<Icon label="Payment failed">{glyph}</Icon>);

    const box = screen.getByRole('img', { name: 'Payment failed' });
    expect(box).not.toHaveAttribute('aria-hidden');
  });

  it('reads a name the consumer wrote as aria-label, rather than hiding it', () => {
    render(<Icon aria-label="Export ready">{glyph}</Icon>);

    expect(screen.getByRole('img', { name: 'Export ready' })).toBeInTheDocument();
  });

  it('reads a name the consumer wrote as aria-labelledby', () => {
    render(
      <>
        <span id="caption">Export ready</span>
        <Icon aria-labelledby="caption">{glyph}</Icon>
      </>,
    );

    expect(screen.getByRole('img', { name: 'Export ready' })).toBeInTheDocument();
  });

  it('keeps a role the consumer chose over the one it would have written', () => {
    render(
      <Icon data-testid="box" label="Loading" role="status">
        {glyph}
      </Icon>,
    );

    expect(screen.getByTestId('box')).toHaveAttribute('role', 'status');
  });

  it('passes native attributes and the ref through to the box', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Icon ref={ref} data-testid="box" id="status-icon" title="Paid">
        {glyph}
      </Icon>,
    );

    const box = screen.getByTestId('box');
    expect(box).toHaveAttribute('id', 'status-icon');
    expect(box).toHaveAttribute('title', 'Paid');
    expect(ref.current).toBe(box);
  });
});
