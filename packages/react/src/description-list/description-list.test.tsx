import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DescriptionDetails, DescriptionList, DescriptionTerm } from './index';

const setup = (orientation?: 'horizontal' | 'vertical') =>
  render(
    <DescriptionList data-testid="list" orientation={orientation}>
      <DescriptionTerm>Owner</DescriptionTerm>
      <DescriptionDetails>Ada Lovelace</DescriptionDetails>
    </DescriptionList>,
  );

describe('DescriptionList', () => {
  it('uses the native list elements, which carry the pairing themselves', () => {
    setup();

    expect(screen.getByTestId('list').tagName).toBe('DL');
    expect(screen.getByText('Owner').tagName).toBe('DT');
    expect(screen.getByText('Ada Lovelace').tagName).toBe('DD');
  });

  it('names each part so the stylesheet can lay them out', () => {
    setup();

    expect(screen.getByTestId('list')).toHaveAttribute('data-part', 'root');
    expect(screen.getByText('Owner')).toHaveAttribute('data-part', 'term');
    expect(screen.getByText('Ada Lovelace')).toHaveAttribute('data-part', 'details');
  });

  it('stacks the pair unless told to lay it out in columns', () => {
    setup();

    expect(screen.getByTestId('list')).toHaveAttribute('data-orientation', 'vertical');
  });

  it('states the orientation it was given', () => {
    setup('horizontal');

    expect(screen.getByTestId('list')).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('adds no role, because dl, dt and dd already say what they are', () => {
    setup();

    for (const element of [
      screen.getByTestId('list'),
      screen.getByText('Owner'),
      screen.getByText('Ada Lovelace'),
    ]) {
      expect(element).not.toHaveAttribute('role');
    }
  });

  it('carries the class the stylesheet paints, beside the consumer class', () => {
    render(<DescriptionList className="app-list" data-testid="list" />);

    const list = screen.getByTestId('list');
    expect(list).toHaveClass('slotted-description-list');
    expect(list).toHaveClass('app-list');
  });

  it('keeps several details under one term', () => {
    render(
      <DescriptionList data-testid="list" orientation="horizontal">
        <DescriptionTerm>Maintainers</DescriptionTerm>
        <DescriptionDetails>Ada Lovelace</DescriptionDetails>
        <DescriptionDetails>Grace Hopper</DescriptionDetails>
      </DescriptionList>,
    );

    const details = screen.getByTestId('list').querySelectorAll('[data-part="details"]');
    expect(details).toHaveLength(2);
  });
});
