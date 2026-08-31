import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Tag, TagRemove } from './index';

describe('Tag', () => {
  it('states the quietest appearance when it is given none', () => {
    render(<Tag>Design</Tag>);

    const tag = screen.getByText('Design');
    expect(tag).toHaveAttribute('data-variant', 'secondary');
    expect(tag).toHaveAttribute('data-fill', 'solid');
    expect(tag).toHaveAttribute('data-size', 'md');
  });

  it('states every axis it was given to the stylesheet', () => {
    render(
      <Tag fill="subtle" size="sm" variant="accent">
        Design
      </Tag>,
    );

    const tag = screen.getByText('Design');
    expect(tag).toHaveAttribute('data-fill', 'subtle');
    expect(tag).toHaveAttribute('data-size', 'sm');
    expect(tag).toHaveAttribute('data-variant', 'accent');
  });

  it('carries the class the stylesheet paints, beside the consumer class', () => {
    render(<Tag className="app-tag">Design</Tag>);

    const tag = screen.getByText('Design');
    expect(tag).toHaveClass('slotted-tag');
    expect(tag).toHaveClass('app-tag');
  });
});

describe('TagRemove', () => {
  it('is a button that does not submit the form around it', () => {
    render(<TagRemove aria-label="Remove design" />);

    expect(screen.getByRole('button', { name: 'Remove design' })).toHaveAttribute('type', 'button');
  });

  it('names the part the stylesheet draws the cross on', () => {
    render(<TagRemove aria-label="Remove design" />);

    expect(screen.getByRole('button')).toHaveAttribute('data-part', 'remove');
  });

  it('calls back when it is pressed', () => {
    const onClick = vi.fn();
    render(<TagRemove aria-label="Remove design" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('states disabled both to the platform and to the stylesheet', () => {
    render(<TagRemove aria-label="Remove design" disabled />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('data-disabled', '');
  });

  it('warns in development when nothing names it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<TagRemove />);

    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('sits inside the tag it removes', () => {
    render(
      <Tag data-testid="tag">
        Design
        <TagRemove aria-label="Remove design" />
      </Tag>,
    );

    expect(screen.getByTestId('tag')).toContainElement(screen.getByRole('button'));
  });
});
