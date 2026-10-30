import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import type { ChangeRequest } from '@slotted/core/state';
import { SlAppShell, SlAppShellNav, SlAppShellNavBody } from '@slotted/angular/app-shell';
import contract from '../../../../specs/components/side-navigation/contract.json';
import { SlSideNavigation } from './side-navigation';
import { provideSideNavigationDefaults } from './side-navigation-defaults';
import type {
  SideNavigationMode,
  SideNavigationSize,
  SideNavigationTruncate,
} from './side-navigation-defaults';
import {
  SlSideNavigationActions,
  SlSideNavigationCount,
  SlSideNavigationDescription,
  SlSideNavigationDivider,
  SlSideNavigationEnd,
  SlSideNavigationGroup,
  SlSideNavigationIcon,
  SlSideNavigationItem,
  SlSideNavigationLabel,
  SlSideNavigationLink,
  SlSideNavigationList,
  SlSideNavigationSection,
  SlSideNavigationSectionLabel,
  SlSideNavigationSkeleton,
  SlSideNavigationTrigger,
} from './side-navigation-parts';

const PARTS = [
  SlSideNavigation,
  SlSideNavigationSection,
  SlSideNavigationSectionLabel,
  SlSideNavigationList,
  SlSideNavigationItem,
  SlSideNavigationLink,
  SlSideNavigationTrigger,
  SlSideNavigationIcon,
  SlSideNavigationLabel,
  SlSideNavigationDescription,
  SlSideNavigationCount,
  SlSideNavigationEnd,
  SlSideNavigationActions,
  SlSideNavigationGroup,
  SlSideNavigationDivider,
  SlSideNavigationSkeleton,
];

const COLUMN = `<div slSideNavigationSection>
  <div slSideNavigationSectionLabel>Operations</div>
  <ul slSideNavigationList>
    <li slSideNavigationItem value="dashboard">
      <a slSideNavigationLink href="#dashboard">
        <span slSideNavigationIcon><svg></svg></span>
        <span slSideNavigationLabel>Dashboard</span>
      </a>
    </li>
    <li slSideNavigationItem value="loads">
      <a slSideNavigationLink href="#loads">
        <span slSideNavigationLabel>Loads</span>
        <span slSideNavigationCount>12</span>
      </a>
    </li>
    <li slSideNavigationItem value="deliveries">
      <button slSideNavigationTrigger>
        <span slSideNavigationLabel>Deliveries</span>
        <span slSideNavigationEnd>38</span>
      </button>
      <ul slSideNavigationGroup>
        <li slSideNavigationItem value="today">
          <a slSideNavigationLink href="#today"><span slSideNavigationLabel>Today</span></a>
        </li>
        <li slSideNavigationItem value="late">
          <a slSideNavigationLink href="#late">
            <span slSideNavigationLabel>Late</span>
            <span slSideNavigationDescription>3 fora do prazo</span>
          </a>
        </li>
      </ul>
    </li>
    <li slSideNavigationItem value="config">
      <button slSideNavigationTrigger><span slSideNavigationLabel>Settings</span></button>
      <ul slSideNavigationGroup>
        <li slSideNavigationItem value="org">
          <a slSideNavigationLink href="#org"><span slSideNavigationLabel>Organization</span></a>
        </li>
      </ul>
    </li>
    <li slSideNavigationDivider></li>
    <li slSideNavigationItem value="billing" disabled>
      <a slSideNavigationLink href="#billing"><span slSideNavigationLabel>Billing</span></a>
      <div slSideNavigationActions><button type="button">Request</button></div>
    </li>
    <li slSideNavigationSkeleton></li>
  </ul>
</div>`;

@Component({
  standalone: true,
  imports: PARTS,
  template: `<nav
    slSideNavigation
    [(value)]="value"
    [(expanded)]="expanded"
    [(flyout)]="flyout"
    [mode]="mode()"
    [compactAt]="compactAt()"
    [size]="size()"
    [truncate]="truncate()"
    [multiple]="multiple()"
    [autoExpand]="autoExpand()"
    [landmark]="landmark()"
    (valueChangeRequest)="valueRequests.push($event)"
    (expandedChangeRequest)="expandedRequests.push($event)"
    (flyoutChangeRequest)="flyoutRequests.push($event)"
  >
    ${COLUMN}
  </nav>`,
})
class Host {
  readonly value = signal<string | null>(null);
  readonly expanded = signal<readonly string[]>([]);
  readonly flyout = signal<string | null>(null);
  readonly mode = signal<SideNavigationMode | undefined>(undefined);
  readonly compactAt = signal<number | undefined>(undefined);
  readonly size = signal<SideNavigationSize | undefined>(undefined);
  readonly truncate = signal<SideNavigationTruncate | undefined>(undefined);
  readonly multiple = signal<boolean | undefined>(undefined);
  readonly autoExpand = signal<boolean | undefined>(undefined);
  readonly landmark = signal<boolean | undefined>(undefined);
  readonly valueRequests: ChangeRequest<string | null>[] = [];
  readonly expandedRequests: ChangeRequest<readonly string[]>[] = [];
  readonly flyoutRequests: ChangeRequest<string | null>[] = [];
}

@Component({
  standalone: true,
  imports: [...PARTS, SlAppShell, SlAppShellNav, SlAppShellNavBody],
  template: `<div slAppShell navMode="inline">
    <nav slAppShellNav>
      <div slAppShellNavBody>
        <div slSideNavigation>${COLUMN}</div>
      </div>
    </nav>
  </div>`,
})
class InShell {}

describe('SlSideNavigation', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const root = () =>
    fixture.nativeElement.querySelector('[data-ui="side-navigation"]') as HTMLElement;
  const item = (value: string) =>
    fixture.nativeElement.querySelector(`[data-part="item"][data-value="${value}"]`) as HTMLElement;
  const link = (value: string) => item(value).querySelector('[data-part="link"]') as HTMLElement;
  const trigger = (value: string) =>
    item(value).querySelector(':scope > [data-part="trigger"]') as HTMLElement;
  const click = (element: HTMLElement, detail = 1) => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
    fixture.detectChanges();
  };
  const key = (element: HTMLElement, key: string) => {
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host, InShell] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders every part the contract declares, and the flyout only in the rail', () => {
    for (const part of contract.members.sideNavigation.parts) {
      if (part === 'flyout') continue;
      expect(fixture.nativeElement.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(root().getAttribute('aria-label')).toBe('Navigation');
    expect(root().getAttribute('data-mode')).toBe('auto');
    expect(root().getAttribute('data-truncate')).toBe('end');
  });

  /** The shell's nav region is already the navigation landmark. */
  it('writes no name inside app-shell, and none when landmark is off', () => {
    const shell = TestBed.createComponent(InShell);
    shell.detectChanges();
    const inside = shell.nativeElement.querySelector('[data-ui="side-navigation"]') as HTMLElement;
    expect(inside.hasAttribute('aria-label')).toBe(false);

    host.landmark.set(false);
    fixture.detectChanges();
    expect(root().hasAttribute('aria-label')).toBe(false);
  });

  it('wires each trigger to its group, and names the group by the row', () => {
    const group = item('deliveries').querySelector('[data-part="group"]') as HTMLElement;
    const label = trigger('deliveries').querySelector('[data-part="label"]') as HTMLElement;
    expect(trigger('deliveries').getAttribute('aria-expanded')).toBe('false');
    expect(trigger('deliveries').getAttribute('aria-controls')).toBe(group.id);
    expect(group.getAttribute('aria-labelledby')).toBe(label.id);
    expect(
      trigger('deliveries').querySelector('[data-part="indicator"]')?.getAttribute('aria-hidden'),
    ).toBe('true');
    const box = trigger('deliveries').querySelector('[data-part="indicator"] > [data-ui="icon"]');
    expect(box?.hasAttribute('data-directional')).toBe(true);
    expect(box?.querySelector('svg[data-glyph="chevron-right"]')).not.toBeNull();
  });

  it('opens and closes a group with the reason the device gave', () => {
    click(trigger('deliveries'));
    expect(item('deliveries').hasAttribute('data-expanded')).toBe(true);
    expect(host.expanded()).toEqual(['deliveries']);
    expect(host.expandedRequests.at(-1)?.reason).toBe('pointer');
    click(trigger('deliveries'), 0);
    expect(item('deliveries').hasAttribute('data-expanded')).toBe(false);
    expect(host.expandedRequests.at(-1)?.reason).toBe('keyboard');
  });

  it('closes a sibling under multiple=false', () => {
    host.multiple.set(false);
    host.expanded.set(['deliveries']);
    fixture.detectChanges();
    click(trigger('config'));
    expect(host.expanded()).toEqual(['config']);
    expect(item('deliveries').hasAttribute('data-expanded')).toBe(false);
  });

  it('marks the current destination on the link and asks value to move on a press', () => {
    host.value.set('dashboard');
    fixture.detectChanges();
    expect(link('dashboard').getAttribute('aria-current')).toBe('page');
    expect(item('dashboard').hasAttribute('data-current')).toBe(true);
    click(link('loads'));
    expect(host.value()).toBe('loads');
    expect(host.valueRequests.at(-1)?.reason).toBe('pointer');
    expect(link('dashboard').hasAttribute('aria-current')).toBe(false);
  });

  it('marks the parent of the current destination only while its group is closed', () => {
    host.autoExpand.set(false);
    host.value.set('today');
    fixture.detectChanges();
    expect(item('deliveries').hasAttribute('data-current')).toBe(true);
    click(trigger('deliveries'));
    expect(item('deliveries').hasAttribute('data-current')).toBe(false);
    expect(link('today').getAttribute('aria-current')).toBe('page');
  });

  it('opens the ancestors of the current destination with the reason select', () => {
    host.value.set('org');
    fixture.detectChanges();
    expect(host.expanded()).toEqual(['config']);
    expect(host.expandedRequests.at(-1)?.reason).toBe('select');
  });

  it('refuses a disabled link and keeps its destination in the DOM', () => {
    expect(link('billing').getAttribute('aria-disabled')).toBe('true');
    expect(link('billing').getAttribute('href')).toBe('#billing');
    click(link('billing'));
    expect(host.valueRequests).toHaveLength(0);
  });

  it('walks the visible rows with the arrow keys, Home and End, skipping a closed group', () => {
    host.expanded.set(['deliveries']);
    fixture.detectChanges();
    link('dashboard').focus();
    key(link('dashboard'), 'ArrowDown');
    expect(document.activeElement).toBe(link('loads'));
    key(link('loads'), 'ArrowDown');
    expect(document.activeElement).toBe(trigger('deliveries'));
    key(trigger('deliveries'), 'ArrowDown');
    expect(document.activeElement).toBe(link('today'));
    key(link('today'), 'End');
    expect(document.activeElement).toBe(link('billing'));
    key(link('billing'), 'Home');
    expect(document.activeElement).toBe(link('dashboard'));
    host.expanded.set([]);
    fixture.detectChanges();
    key(trigger('deliveries'), 'ArrowDown');
    expect(document.activeElement).toBe(trigger('config'));
  });

  it('closes the group holding focus on Escape and lands on its trigger', () => {
    host.expanded.set(['deliveries']);
    fixture.detectChanges();
    link('today').focus();
    key(link('today'), 'Escape');
    expect(host.expanded()).toEqual([]);
    expect(host.expandedRequests.at(-1)?.reason).toBe('escape');
    expect(document.activeElement).toBe(trigger('deliveries'));
  });

  it('is a rail under mode=compact, where a trigger opens the flyout', () => {
    host.mode.set('compact');
    fixture.detectChanges();
    expect(root().hasAttribute('data-compact')).toBe(true);
    click(trigger('deliveries'));
    expect(host.flyout()).toBe('deliveries');
    expect(host.flyoutRequests.at(-1)?.reason).toBe('pointer');
    expect(item('deliveries').hasAttribute('data-open')).toBe(true);
    expect(item('deliveries').hasAttribute('data-expanded')).toBe(false);
    const layer = document.querySelector('[data-ui="side-navigation"][data-part="flyout"]');
    expect(layer).not.toBeNull();
    expect(layer?.querySelector('[data-part="group"]')).not.toBeNull();
    click(layer?.querySelector('[data-part="link"]') as HTMLElement);
    expect(host.flyout()).toBeNull();
    expect(host.flyoutRequests.at(-1)?.reason).toBe('select');
  });

  it('reads its defaults from the provider, and an input still wins', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideSideNavigationDefaults({ guides: false, size: 'sm', truncate: 'none' })],
    }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    host.size.set('lg');
    fixture.detectChanges();
    expect(root().getAttribute('data-size')).toBe('lg');
    expect(root().getAttribute('data-truncate')).toBe('none');
    expect(root().hasAttribute('data-guides')).toBe(false);
  });

  it('speaks the language in force, and follows a change of it in place', async () => {
    const locale = signal('pt-BR');
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    // language: pt-BR
    expect(root().getAttribute('aria-label')).toBe('Navegação');
    // language: en-US

    locale.set('en-US');
    fixture.detectChanges();
    expect(root().getAttribute('aria-label')).toBe('Navigation');
  });

  describe('measuring the room', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('measures after the first render, against a bound compactAt', () => {
      vi.stubGlobal(
        'ResizeObserver',
        class {
          observe() {}
          disconnect() {}
        },
      );
      /* A read during construction would force a style pass before the
         bindings exist: inside app-shell it drew the column at rail width. */
      const reads: boolean[] = [];
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
        this: HTMLElement,
      ) {
        reads.push(this.hasAttribute('data-mode'));
        return { width: 300 } as DOMRect;
      });
      fixture = TestBed.createComponent(Host);
      host = fixture.componentInstance;
      host.mode.set('auto');
      host.compactAt.set(500);
      fixture.detectChanges();
      expect(reads.length).toBeGreaterThan(0);
      expect(reads.every(Boolean)).toBe(true);
      expect(root().hasAttribute('data-compact')).toBe(true);
    });
  });
});
