import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Stepper, StepperLabel, StepperMarker, StepperStep } from './index';

const setup = (orientation?: 'horizontal' | 'vertical') =>
  render(
    <Stepper
      aria-label="Set up your workspace"
      {...(orientation === undefined ? {} : { orientation })}
    >
      <StepperStep data-testid="one" status="complete">
        <StepperMarker data-testid="marker-one">1</StepperMarker>
        <StepperLabel>Account</StepperLabel>
      </StepperStep>
      <StepperStep data-testid="two" status="current">
        <StepperMarker>2</StepperMarker>
        <StepperLabel>Members</StepperLabel>
      </StepperStep>
      <StepperStep data-testid="three">
        <StepperMarker>3</StepperMarker>
        <StepperLabel>Billing</StepperLabel>
      </StepperStep>
    </Stepper>,
  );

describe('Stepper', () => {
  it('is an ordered list, because the order is the information', () => {
    setup();

    expect(screen.getByRole('list').tagName).toBe('OL');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('states each status to the stylesheet, defaulting to upcoming', () => {
    setup();

    expect(screen.getByTestId('one')).toHaveAttribute('data-status', 'complete');
    expect(screen.getByTestId('two')).toHaveAttribute('data-status', 'current');
    expect(screen.getByTestId('three')).toHaveAttribute('data-status', 'upcoming');
  });

  it('marks the step in progress, and only that one', () => {
    setup();

    expect(screen.getByTestId('two')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByTestId('one')).not.toHaveAttribute('aria-current');
    expect(screen.getByTestId('three')).not.toHaveAttribute('aria-current');
  });

  it('keeps an aria-current the consumer set rather than replacing it', () => {
    render(<StepperStep aria-current="page" data-testid="step" status="current" />);

    expect(screen.getByTestId('step')).toHaveAttribute('aria-current', 'page');
  });

  it('hides the marker, because the label already names the step', () => {
    setup();

    expect(screen.getByTestId('marker-one')).toHaveAttribute('aria-hidden', 'true');
  });

  it('arranges the steps along the axis it was given', () => {
    const { unmount } = setup();
    expect(screen.getByRole('list')).toHaveAttribute('data-orientation', 'horizontal');
    unmount();

    setup('vertical');
    expect(screen.getByRole('list')).toHaveAttribute('data-orientation', 'vertical');
  });

  it('adds no role of its own, because a list of steps is a list', () => {
    setup();

    expect(screen.getByRole('list')).not.toHaveAttribute('role');
    expect(screen.getByTestId('one')).not.toHaveAttribute('role');
  });

  it('carries the class the stylesheet paints, beside the consumer class', () => {
    render(<Stepper className="app-stepper" data-testid="stepper" />);

    const stepper = screen.getByTestId('stepper');
    expect(stepper).toHaveClass('slotted-stepper');
    expect(stepper).toHaveClass('app-stepper');
  });
});
