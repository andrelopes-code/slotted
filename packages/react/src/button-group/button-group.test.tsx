import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { Button, ButtonDefaultsProvider } from '../button';
import { ButtonGroup, ButtonGroupSeparator } from './index';

describe('ButtonGroup', () => {
  it('carries the identifier a consumer selects the family by', () => {
    render(<ButtonGroup data-testid="group">actions</ButtonGroup>);

    const group = screen.getByTestId('group');
    expect(group.tagName).toBe('DIV');
    expect(group).toHaveAttribute('data-ui', 'button-group');
    expect(group).toHaveAttribute('data-part', 'root');
  });

  /**
   * A group of buttons is several tab stops. The arrow-key model belongs to
   * `toolbar`, so the role that promises it is never written by accident.
   */
  it('is a group, and says so', () => {
    render(<ButtonGroup data-testid="group">actions</ButtonGroup>);

    expect(screen.getByTestId('group')).toHaveAttribute('role', 'group');
  });

  it('lets the consumer state a role of their own', () => {
    render(
      <ButtonGroup data-testid="group" role="toolbar">
        actions
      </ButtonGroup>,
    );

    expect(screen.getByTestId('group')).toHaveAttribute('role', 'toolbar');
  });

  it('names itself with the attributes the element already accepts', () => {
    render(<ButtonGroup aria-label="Record actions">actions</ButtonGroup>);

    expect(screen.getByRole('group', { name: 'Record actions' })).toBeInTheDocument();
  });

  /**
   * One shape and no other. The group used to join its controls when asked and
   * space them by a step on the space scale otherwise, which was two families
   * under one name; a spaced row of buttons is `inline` or `stack`. So there
   * is nothing to switch on, nothing to space and nothing to reflow — the
   * stylesheet's base rule is the bar, and the root says nothing about it.
   */
  it('writes no axis the consumer did not decide, because the base rule holds the defaults', () => {
    render(<ButtonGroup data-testid="group">actions</ButtonGroup>);

    const group = screen.getByTestId('group');
    for (const axis of ['align', 'justify', 'orientation', 'attached', 'collapse', 'gap']) {
      expect(group).not.toHaveAttribute(`data-${axis}`);
    }
    expect(group).not.toHaveAttribute('data-full-width');
  });

  it('states each axis the consumer decided', () => {
    render(
      <ButtonGroup
        align="stretch"
        data-testid="group"
        fullWidth
        justify="end"
        orientation="vertical"
      >
        actions
      </ButtonGroup>,
    );

    const group = screen.getByTestId('group');
    expect(group).toHaveAttribute('data-align', 'stretch');
    expect(group).toHaveAttribute('data-full-width', '');
    expect(group).toHaveAttribute('data-justify', 'end');
    expect(group).toHaveAttribute('data-orientation', 'vertical');
  });

  it('renders another element when a div is the wrong claim', () => {
    render(
      <ButtonGroup aria-label="Actions" data-testid="group" render={(props) => <nav {...props} />}>
        actions
      </ButtonGroup>,
    );

    expect(screen.getByTestId('group').tagName).toBe('NAV');
  });

  /**
   * A substituted element keeps the group role, because a group of actions is
   * what the family is whatever tag carries it. An element whose own semantics
   * are the point says so by asking for no role at all: an explicit value
   * wins, and `undefined` is a value the consumer can state.
   */
  it('gives up the role to an element whose own semantics are the point', () => {
    render(
      <ButtonGroup aria-label="Pagination" render={(props) => <nav {...props} />} role={undefined}>
        actions
      </ButtonGroup>,
    );

    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });

  it('hands the consumer the element it rendered', () => {
    const ref = createRef<HTMLDivElement>();
    render(<ButtonGroup ref={ref}>actions</ButtonGroup>);

    expect(ref.current).toHaveAttribute('data-ui', 'button-group');
  });

  it('keeps every button in the tab sequence, because a group is not a toolbar', () => {
    render(
      <ButtonGroup>
        <Button>Day</Button>
        <Button>Week</Button>
      </ButtonGroup>,
    );

    for (const button of screen.getAllByRole('button')) {
      expect(button).not.toHaveAttribute('tabindex');
    }
  });
});

describe('ButtonGroup paint', () => {
  it('paints the buttons under it', () => {
    render(
      <ButtonGroup size="sm" tone="danger" variant="outline">
        <Button>Delete</Button>
      </ButtonGroup>,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-tone', 'danger');
    expect(button).toHaveAttribute('data-variant', 'outline');
    expect(button).toHaveAttribute('data-size', 'sm');
  });

  /**
   * How a group is laid out and how its buttons are painted are two questions,
   * and only the second one belongs to `button` — so the group travels through
   * that family's own defaults, and the rule an explicit prop always wins is
   * the rule `button` already implements.
   */
  it('loses to a button that states the axis itself', () => {
    render(
      <ButtonGroup tone="danger">
        <Button tone="accent">Publish</Button>
      </ButtonGroup>,
    );

    expect(screen.getByRole('button')).toHaveAttribute('data-tone', 'accent');
  });

  it('leaves each button its own default for an axis the group did not state', () => {
    render(
      <ButtonGroup size="sm">
        <Button>Publish</Button>
      </ButtonGroup>,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-size', 'sm');
    expect(button).toHaveAttribute('data-tone', 'accent');
    expect(button).toHaveAttribute('data-variant', 'solid');
  });

  it('overrules the application-wide button defaults it sits inside', () => {
    render(
      <ButtonDefaultsProvider tone="secondary">
        <ButtonGroup tone="success">
          <Button>Approve</Button>
        </ButtonGroup>
      </ButtonDefaultsProvider>,
    );

    expect(screen.getByRole('button')).toHaveAttribute('data-tone', 'success');
  });

  it('inherits the axes it does not state from the provider above it', () => {
    render(
      <ButtonDefaultsProvider size="lg">
        <ButtonGroup tone="success">
          <Button>Approve</Button>
        </ButtonGroup>
      </ButtonDefaultsProvider>,
    );

    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'lg');
  });
});

describe('ButtonGroupSeparator', () => {
  it('is a part of the group and not a family of its own', () => {
    render(
      <ButtonGroup>
        <ButtonGroupSeparator data-testid="rule" />
      </ButtonGroup>,
    );

    const rule = screen.getByTestId('rule');
    expect(rule).toHaveAttribute('data-part', 'separator');
    expect(rule).not.toHaveAttribute('data-ui');
  });

  it('turns across the group it divides', () => {
    render(
      <>
        <ButtonGroup>
          <ButtonGroupSeparator data-testid="across-a-row" />
        </ButtonGroup>
        <ButtonGroup orientation="vertical">
          <ButtonGroupSeparator data-testid="across-a-column" />
        </ButtonGroup>
      </>,
    );

    expect(screen.getByTestId('across-a-row')).toHaveAttribute('aria-orientation', 'vertical');
    expect(screen.getByTestId('across-a-column')).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('leaves the accessibility tree when the boundary is only cosmetic', () => {
    render(
      <ButtonGroup>
        <ButtonGroupSeparator data-testid="rule" decorative />
      </ButtonGroup>,
    );

    const rule = screen.getByTestId('rule');
    expect(rule).toHaveAttribute('role', 'none');
    expect(rule).toHaveAttribute('aria-hidden', 'true');
    expect(rule).not.toHaveAttribute('aria-orientation');
  });

  it('renders another element when a div is the wrong claim', () => {
    render(
      <ButtonGroup>
        <ButtonGroupSeparator render={(props) => <hr {...props} />} />
      </ButtonGroup>,
    );

    expect(screen.getByRole('separator')).toHaveAttribute('data-part', 'separator');
  });
});
