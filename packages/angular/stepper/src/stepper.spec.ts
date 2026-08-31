import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlStepper } from './stepper';
import type { StepperOrientation } from './stepper';
import { SlStepperLabel } from './stepper-label';
import { SlStepperMarker } from './stepper-marker';
import { SlStepperStep } from './stepper-step';

@Component({
  imports: [SlStepper, SlStepperLabel, SlStepperMarker, SlStepperStep],
  template: `
    <ol slStepper id="stepper" aria-label="Set up your workspace" [orientation]="orientation()">
      <li slStepperStep id="one" status="complete">
        <span slStepperMarker id="marker-one">1</span>
        <span slStepperLabel>Account</span>
      </li>
      <li slStepperStep id="two" status="current">
        <span slStepperMarker>2</span>
        <span slStepperLabel>Members</span>
      </li>
      <li slStepperStep id="three">
        <span slStepperMarker>3</span>
        <span slStepperLabel>Billing</span>
      </li>
    </ol>
    <li slStepperStep id="kept" aria-current="page" status="current"></li>
  `,
})
class Host {
  readonly orientation = signal<StepperOrientation>('horizontal');
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    byId: (id: string) => element.querySelector<HTMLElement>(`#${id}`)!,
    fixture,
  };
}

describe('SlStepper', () => {
  it('is an ordered list, because the order is the information', () => {
    const { byId } = mount();

    expect(byId('stepper').tagName).toBe('OL');
    expect(byId('stepper').querySelectorAll('li')).toHaveLength(3);
  });

  it('states each status to the stylesheet, defaulting to upcoming', () => {
    const { byId } = mount();

    expect(byId('one').getAttribute('data-status')).toBe('complete');
    expect(byId('two').getAttribute('data-status')).toBe('current');
    expect(byId('three').getAttribute('data-status')).toBe('upcoming');
  });

  it('marks the step in progress, and only that one', () => {
    const { byId } = mount();

    expect(byId('two').getAttribute('aria-current')).toBe('step');
    expect(byId('one').hasAttribute('aria-current')).toBe(false);
    expect(byId('three').hasAttribute('aria-current')).toBe(false);
  });

  it('keeps an aria-current the consumer set rather than replacing it', () => {
    const { byId } = mount();

    expect(byId('kept').getAttribute('aria-current')).toBe('page');
  });

  it('hides the marker, because the label already names the step', () => {
    const { byId } = mount();

    expect(byId('marker-one').getAttribute('aria-hidden')).toBe('true');
  });

  it('arranges the steps along the axis it was given', () => {
    const { byId, fixture } = mount();

    expect(byId('stepper').getAttribute('data-orientation')).toBe('horizontal');

    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();

    expect(byId('stepper').getAttribute('data-orientation')).toBe('vertical');
  });

  it('adds no role of its own, because a list of steps is a list', () => {
    const { byId } = mount();

    expect(byId('stepper').hasAttribute('role')).toBe(false);
    expect(byId('one').hasAttribute('role')).toBe(false);
  });

  it('carries the class the stylesheet paints', () => {
    const { byId } = mount();

    expect(byId('stepper').classList.contains('slotted-stepper')).toBe(true);
  });
});
