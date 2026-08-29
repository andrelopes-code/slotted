import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { Button } from './button';
import { ButtonGroup } from './button-group';

describe('ButtonGroup', () => {
  it('renders a labeled horizontal group by default', () => {
    render(
      <ButtonGroup aria-label="Editing actions">
        <Button>Save</Button>
        <Button>Discard</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole('group', { name: 'Editing actions' });
    expect(group).toHaveAttribute('data-orientation', 'horizontal');
    expect(group).toHaveAttribute('data-slotted-component', 'button-group');
  });

  it('preserves vertical orientation and native div props', () => {
    render(<ButtonGroup orientation="vertical" data-testid="group" />);
    expect(screen.getByTestId('group')).toHaveAttribute('data-orientation', 'vertical');
  });

  it('forwards native div refs, classes, and attributes', () => {
    const ref = createRef<HTMLDivElement>();
    render(<ButtonGroup ref={ref} className="actions" data-testid="group" title="Edit actions" />);

    const group = screen.getByTestId('group');
    expect(ref.current).toBe(group);
    expect(group).toHaveClass('slotted-button-group', 'actions');
    expect(group).toHaveAttribute('title', 'Edit actions');
  });

  it('renders children unchanged without injecting appearance props', () => {
    render(
      <ButtonGroup>
        <span data-testid="child" data-probe="original">
          Custom child
        </span>
      </ButtonGroup>,
    );

    const child = screen.getByTestId('child');
    expect(child).toHaveAttribute('data-probe', 'original');
    expect(child).not.toHaveAttribute('data-variant');
    expect(child).not.toHaveAttribute('data-tone');
  });
});
