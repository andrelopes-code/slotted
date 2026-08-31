import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlTab } from './tab';
import { SlTabList } from './tab-list';
import { SlTabPanel } from './tab-panel';
import { SlTabs } from './tabs';
import type { TabsActivation, TabsOrientation } from './tabs.constants';

@Component({
  imports: [SlTab, SlTabList, SlTabPanel, SlTabs],
  template: `
    <div
      slTabs
      id="report"
      [activation]="activation()"
      [orientation]="orientation()"
      [(value)]="value"
    >
      <div slTabList aria-label="Report sections">
        <button slTab value="overview">Overview</button>
        <button slTab disabled value="usage">Usage</button>
        <button slTab value="billing">Billing</button>
      </div>
      <div slTabPanel value="overview">Overview panel</div>
      <div slTabPanel value="usage">Usage panel</div>
      <div slTabPanel value="billing">Billing panel</div>
    </div>
  `,
})
class BoundHost {
  readonly value = signal('overview');
  readonly activation = signal<TabsActivation>('automatic');
  readonly orientation = signal<TabsOrientation>('horizontal');
}

function mount() {
  const fixture = TestBed.createComponent(BoundHost);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    element,
    fixture,
    panels: () => [...element.querySelectorAll<HTMLElement>('[role="tabpanel"]')],
    tabs: () => [...element.querySelectorAll<HTMLElement>('[role="tab"]')],
  };
}

const press = (element: Element, key: string) =>
  element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }));

describe('SlTabs', () => {
  it('wires every tab to its panel through derived identifiers', () => {
    const { panels, tabs } = mount();

    expect(tabs()[0]?.getAttribute('id')).toBe('report-tab-overview');
    expect(tabs()[0]?.getAttribute('aria-controls')).toBe('report-panel-overview');
    expect(panels()[0]?.getAttribute('id')).toBe('report-panel-overview');
    expect(panels()[0]?.getAttribute('aria-labelledby')).toBe('report-tab-overview');
  });

  it('exposes one tab stop and marks the selected tab', () => {
    const { tabs } = mount();

    expect(tabs().map((tab) => tab.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    expect(tabs()[0]?.getAttribute('aria-selected')).toBe('true');
    expect(tabs()[0]?.getAttribute('data-selected')).toBe('');
    expect(tabs()[2]?.getAttribute('aria-selected')).toBe('false');
  });

  it('hides unselected panels instead of removing them', () => {
    const { panels } = mount();

    expect(panels()).toHaveLength(3);
    expect(panels()[0]?.hasAttribute('hidden')).toBe(false);
    expect(panels()[2]?.hasAttribute('hidden')).toBe(true);
    expect(panels()[0]?.getAttribute('tabindex')).toBe('0');
  });

  it('selects on arrow movement in automatic activation, skipping disabled tabs', () => {
    const { fixture, panels, tabs } = mount();

    press(tabs()[0]!, 'ArrowRight');
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('billing');
    expect(panels()[2]?.hasAttribute('hidden')).toBe(false);
  });

  it('moves focus without selecting in manual activation', () => {
    const { fixture, tabs } = mount();
    fixture.componentInstance.activation.set('manual');
    fixture.detectChanges();

    press(tabs()[0]!, 'ArrowRight');
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('overview');

    press(tabs()[2]!, 'Enter');
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('billing');
  });

  it('answers the vertical keys when the orientation says so', () => {
    const { fixture, tabs } = mount();
    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();

    press(tabs()[0]!, 'ArrowRight');
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('overview');

    press(tabs()[0]!, 'ArrowDown');
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('billing');
  });

  it('selects on click and never on a disabled tab', () => {
    const { fixture, tabs } = mount();

    tabs()[1]?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('overview');

    tabs()[2]?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('billing');
  });

  it('marks a disabled tab and keeps it out of the tab stop', () => {
    const { tabs } = mount();

    expect(tabs()[1]?.getAttribute('data-disabled')).toBe('');
    expect(tabs()[1]?.getAttribute('tabindex')).toBe('-1');
  });

  it('follows a value set from outside', () => {
    const { fixture, panels } = mount();

    fixture.componentInstance.value.set('billing');
    fixture.detectChanges();

    expect(panels()[2]?.hasAttribute('hidden')).toBe(false);
    expect(panels()[0]?.hasAttribute('hidden')).toBe(true);
  });

  it('carries the orientation on the root and the list', () => {
    const { element, fixture } = mount();
    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();

    expect(element.querySelector('[role="tablist"]')?.getAttribute('aria-orientation')).toBe(
      'vertical',
    );
    expect(element.querySelector('.slotted-tabs')?.getAttribute('data-orientation')).toBe(
      'vertical',
    );
  });
});
