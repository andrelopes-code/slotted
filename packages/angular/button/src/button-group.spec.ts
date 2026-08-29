import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import { SlButton } from './button';
import { SlButtonGroup } from './button-group';

@Component({
  imports: [SlButton, SlButtonGroup],
  template: `
    <div slButtonGroup aria-label="Editing actions" [orientation]="orientation()">
      <button slButton>Save</button>
      <button slButton>Discard</button>
    </div>
  `,
})
class TestHost {
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
}

describe('SlButtonGroup', () => {
  it('renders a labeled horizontal group with native button descendants by default', async () => {
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();

    const group = fixture.nativeElement.querySelector('[role="group"]') as HTMLDivElement;
    expect(group.localName).toBe(contract.members.buttonGroup.nativeElement);
    expect(group.getAttribute('aria-label')).toBe('Editing actions');
    expect(group.dataset['slottedComponent']).toBe('button-group');
    expect(group.dataset['orientation']).toBe(contract.members.buttonGroup.defaults.orientation);
    expect([...group.querySelectorAll('button')]).toHaveLength(2);
  });

  it('reactively updates vertical orientation', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.orientation.set('vertical');
    await fixture.whenStable();

    expect(
      (fixture.nativeElement.querySelector('[role="group"]') as HTMLDivElement).dataset[
        'orientation'
      ],
    ).toBe('vertical');
  });
});
