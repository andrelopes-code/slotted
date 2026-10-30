import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlThemeScope, type ThemeSeedName } from './theme-scope';

@Component({
  selector: 'sl-test-theme-scope',
  imports: [SlThemeScope],
  template: `<div
    data-scope
    slThemeScope
    theme="default"
    [scheme]="scheme()"
    [corners]="corners()"
    [seeds]="seeds()"
  ></div>`,
})
class Host {
  readonly scheme = signal<'light' | 'dark'>('light');
  readonly corners = signal<'square' | 'round' | undefined>('round');
  readonly seeds = signal<Partial<Record<ThemeSeedName, string>> | undefined>({
    accent: '#e11d48',
  });
}

describe('SlThemeScope', () => {
  it('writes the theme axes and the seeds on its host, and follows them', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const scope = fixture.nativeElement.querySelector('[data-scope]') as HTMLElement;
    expect(scope.getAttribute('data-slotted-theme')).toBe('default');
    expect(scope.getAttribute('data-slotted-scheme')).toBe('light');
    expect(scope.getAttribute('data-slotted-corners')).toBe('round');
    expect(scope.hasAttribute('data-slotted-seeds')).toBe(true);
    expect(scope.style.getPropertyValue('--slotted-seed-accent')).toBe('#e11d48');

    fixture.componentInstance.scheme.set('dark');
    fixture.componentInstance.corners.set(undefined);
    fixture.componentInstance.seeds.set(undefined);
    fixture.detectChanges();
    expect(scope.getAttribute('data-slotted-scheme')).toBe('dark');
    expect(scope.hasAttribute('data-slotted-corners')).toBe(false);
    expect(scope.hasAttribute('data-slotted-seeds')).toBe(false);
    expect(scope.style.getPropertyValue('--slotted-seed-accent')).toBe('');
  });

  it('refuses an invalid seed before it reaches the DOM', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.seeds.set({ accent: 'banana' });
    expect(() => fixture.detectChanges()).toThrow();
  });
});
