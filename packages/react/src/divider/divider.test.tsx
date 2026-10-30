import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Divider } from './index';

describe('Divider', () => {
  it('is a separator by default, without being told to be one', () => {
    render(<Divider data-testid="divider" />);

    const divider = screen.getByTestId('divider');
    expect(divider.tagName).toBe('HR');
    expect(divider).not.toHaveAttribute('role');
    expect(screen.getByRole('separator')).toBe(divider);
  });

  it('leaves the accessibility tree when it is decorative', () => {
    render(<Divider data-testid="divider" decorative />);

    expect(screen.getByTestId('divider')).toHaveAttribute('role', 'none');
    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('announces a vertical separator as vertical', () => {
    render(<Divider data-testid="divider" orientation="vertical" />);

    expect(screen.getByTestId('divider')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('leaves aria-orientation off a horizontal separator, which is the default', () => {
    render(<Divider data-testid="divider" />);

    expect(screen.getByTestId('divider')).not.toHaveAttribute('aria-orientation');
  });

  it('says nothing about orientation once it is out of the tree', () => {
    render(<Divider data-testid="divider" decorative orientation="vertical" />);

    expect(screen.getByTestId('divider')).not.toHaveAttribute('aria-orientation');
  });

  it('states its orientation to the stylesheet in both directions', () => {
    render(
      <>
        <Divider data-testid="horizontal" />
        <Divider data-testid="vertical" orientation="vertical" />
      </>,
    );

    expect(screen.getByTestId('horizontal')).toHaveAttribute('data-orientation', 'horizontal');
    expect(screen.getByTestId('vertical')).toHaveAttribute('data-orientation', 'vertical');
  });

  it('is selected by the identifier the contract declares, not by a class', () => {
    render(<Divider className="app-rule" data-testid="divider" />);

    const divider = screen.getByTestId('divider');
    expect(divider).toHaveAttribute('data-ui', 'divider');
    expect(divider).toHaveAttribute('data-part', 'root');
    expect(divider.className).toBe('app-rule');
  });

  it('keeps the role the consumer set rather than replacing it', () => {
    render(<Divider data-testid="divider" decorative role="presentation" />);

    expect(screen.getByTestId('divider')).toHaveAttribute('role', 'presentation');
  });

  it('stops short of both ends when it is inset', () => {
    render(<Divider data-testid="divider" inset />);

    expect(screen.getByTestId('divider')).toHaveAttribute('data-inset', '');
  });

  describe('with a label', () => {
    it('changes the element, because an hr takes no content', () => {
      render(<Divider data-testid="divider" label="Or" />);

      const divider = screen.getByTestId('divider');
      expect(divider.tagName).toBe('DIV');
      expect(divider).toHaveAttribute('role', 'separator');
      expect(divider).toHaveAttribute('data-labelled', '');
    });

    /**
     * The separator role makes its children presentational, so the visible
     * label never reaches the accessibility tree. Without a name the rule is
     * announced as an empty separator, which is why the name is written.
     */
    it('is announced by the name, and shows the same string', () => {
      render(<Divider label="Or" />);

      const divider = screen.getByRole('separator', { name: 'Or' });
      expect(divider.querySelector('[data-part="label"]')).toHaveTextContent('Or');
    });

    it('carries no name once it is decoration, because role="none" prohibits one', () => {
      render(<Divider data-testid="divider" decorative label="Or" />);

      const divider = screen.getByTestId('divider');
      expect(divider).toHaveAttribute('role', 'none');
      expect(divider).not.toHaveAttribute('aria-label');
      expect(divider.querySelector('[data-part="label"]')).toHaveTextContent('Or');
    });

    it('places the label in the middle until it is asked for an end', () => {
      render(
        <>
          <Divider data-testid="middle" label="Or" />
          <Divider align="start" data-testid="start" label="Archived" />
        </>,
      );

      expect(screen.getByTestId('middle')).toHaveAttribute('data-align', 'center');
      expect(screen.getByTestId('start')).toHaveAttribute('data-align', 'start');
    });

    it('states no alignment when there is nothing to align', () => {
      render(<Divider align="start" data-testid="divider" />);

      expect(screen.getByTestId('divider')).not.toHaveAttribute('data-align');
    });
  });

  describe('rendered into another element', () => {
    it('writes the separator role, because the element is no longer an hr', () => {
      render(
        <ul>
          <Divider render={(props) => <li {...props} data-testid="divider" />} />
        </ul>,
      );

      const divider = screen.getByTestId('divider');
      expect(divider.tagName).toBe('LI');
      expect(divider).toHaveAttribute('role', 'separator');
      expect(divider).toHaveAttribute('data-ui', 'divider');
    });

    it('hands the label over as children, so the consumer renders it once', () => {
      render(
        <ul>
          <Divider
            label="Danger zone"
            render={(props) => <li {...props} data-testid="divider" />}
          />
        </ul>,
      );

      const divider = screen.getByTestId('divider');
      expect(divider).toHaveAttribute('aria-label', 'Danger zone');
      expect(divider.querySelector('[data-part="label"]')).toHaveTextContent('Danger zone');
    });

    it('keeps the orientation the consumer asked for', () => {
      render(
        <Divider
          orientation="vertical"
          render={(props) => <div {...props} data-testid="divider" />}
        />,
      );

      expect(screen.getByTestId('divider')).toHaveAttribute('aria-orientation', 'vertical');
    });
  });
});
