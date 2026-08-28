import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import { BUTTON_SIZES, BUTTON_TONES, BUTTON_VARIANTS } from './button.constants';
import { SlButton } from './button';

@Component({
  imports: [SlButton],
  template: `
    <button
      slButton
      [variant]="variant()"
      [tone]="tone()"
      [size]="size()"
      [type]="type()"
      [disabled]="disabled()"
      (click)="onClick()"
    >
      <span slButtonLeading>L</span>
      Save
      <span slButtonTrailing>T</span>
    </button>
  `,
})
class TestHost {
  readonly variant = signal<'solid' | 'outline' | 'ghost'>('solid');
  readonly tone = signal<'accent' | 'neutral' | 'danger'>('accent');
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly type = signal<'button' | 'submit' | 'reset'>('button');
  readonly disabled = signal(false);
  readonly clickSpy = vi.fn();
  onClick() {
    this.clickSpy();
  }
}

describe('SlButton', () => {
  it('renders native safe defaults and logical parts', async () => {
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.localName).toBe(contract.nativeElement);
    expect(button.dataset['slottedComponent']).toBe(contract.component);
    expect(button.type).toBe(contract.defaults.type);
    expect(button.dataset['variant']).toBe(contract.defaults.variant);
    expect(button.dataset['tone']).toBe(contract.defaults.tone);
    expect(button.dataset['size']).toBe(contract.defaults.size);
    const parts = [...button.querySelectorAll('[data-part]')].map((part) =>
      part.getAttribute('data-part'),
    );
    expect(parts).toEqual(contract.parts);
  });

  it('updates inputs and preserves native events', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.variant.set('outline');
    fixture.componentInstance.type.set('submit');
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(button.dataset['variant']).toBe('outline');
    expect(button.type).toBe('submit');
    expect(fixture.componentInstance.clickSpy).toHaveBeenCalledOnce();
  });

  it('preserves native disabled behavior', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(button.disabled).toBe(true);
    expect(button.dataset['state']).toBe('disabled');
    expect(fixture.componentInstance.clickSpy).not.toHaveBeenCalled();
  });

  it('matches the shared contract axes', () => {
    expect(BUTTON_VARIANTS).toEqual(contract.axes.variant);
    expect(BUTTON_TONES).toEqual(contract.axes.tone);
    expect(BUTTON_SIZES).toEqual(contract.axes.size);
  });
});
