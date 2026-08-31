import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlAlert } from './alert';
import type { AlertFill, AlertLive, AlertSize, AlertVariant } from './alert';
import { SlAlertActions } from './alert-actions';
import { SlAlertDescription } from './alert-description';
import { SlAlertIcon } from './alert-icon';
import { SlAlertTitle } from './alert-title';

@Component({
  imports: [SlAlert, SlAlertActions, SlAlertDescription, SlAlertIcon, SlAlertTitle],
  template: `
    <div slAlert id="alert" [fill]="fill()" [live]="live()" [size]="size()" [variant]="variant()">
      <span slAlertIcon id="icon">!</span>
      <div slAlertTitle id="title">Payment failed</div>
      <p slAlertDescription id="description">Try another card.</p>
      <div slAlertActions id="actions">Retry</div>
    </div>
    <div slAlert id="kept-role" live="assertive" role="region">Connection lost</div>
    <div slAlert id="shown-icon"><span slAlertIcon aria-hidden="false">!</span></div>
  `,
})
class Host {
  readonly fill = signal<AlertFill>('subtle');
  readonly live = signal<AlertLive>('off');
  readonly size = signal<AlertSize>('md');
  readonly variant = signal<AlertVariant>('accent');
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    alert: () => element.querySelector<HTMLElement>('#alert')!,
    fixture,
    keptRole: () => element.querySelector<HTMLElement>('#kept-role')!,
    part: (id: string) => element.querySelector<HTMLElement>(`#${id}`)!,
    shownIcon: () => element.querySelector<HTMLElement>('#shown-icon span')!,
  };
}

describe('SlAlert', () => {
  it('says nothing to assistive technology unless it is told to', () => {
    const { alert } = mount();

    expect(alert().hasAttribute('role')).toBe(false);
  });

  it('becomes a polite status when it appears after an action', () => {
    const { alert, fixture } = mount();

    fixture.componentInstance.live.set('polite');
    fixture.detectChanges();

    expect(alert().getAttribute('role')).toBe('status');
  });

  it('interrupts only when it is told to', () => {
    const { alert, fixture } = mount();

    fixture.componentInstance.live.set('assertive');
    fixture.detectChanges();

    expect(alert().getAttribute('role')).toBe('alert');
  });

  it('keeps a role the consumer set rather than replacing it', () => {
    const { keptRole } = mount();

    expect(keptRole().getAttribute('role')).toBe('region');
  });

  it('states the quietest appearance when it is given none', () => {
    const { alert } = mount();

    expect(alert().getAttribute('data-variant')).toBe('accent');
    expect(alert().getAttribute('data-fill')).toBe('subtle');
    expect(alert().getAttribute('data-size')).toBe('md');
  });

  it('states every axis it was given to the stylesheet', () => {
    const { alert, fixture } = mount();

    fixture.componentInstance.variant.set('danger');
    fixture.componentInstance.fill.set('solid');
    fixture.componentInstance.size.set('sm');
    fixture.detectChanges();

    expect(alert().getAttribute('data-variant')).toBe('danger');
    expect(alert().getAttribute('data-fill')).toBe('solid');
    expect(alert().getAttribute('data-size')).toBe('sm');
  });

  it('names each region so the stylesheet can place it', () => {
    const { part } = mount();

    for (const name of ['icon', 'title', 'description', 'actions']) {
      expect(part(name).getAttribute('data-part')).toBe(name);
    }
  });

  it('hides the icon, because the words already carry the tone', () => {
    const { part } = mount();

    expect(part('icon').getAttribute('aria-hidden')).toBe('true');
  });

  it('lets the consumer put the icon back in the accessibility tree', () => {
    const { shownIcon } = mount();

    expect(shownIcon().getAttribute('aria-hidden')).toBe('false');
  });
});
