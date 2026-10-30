import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { beforeEach, describe, expect, it } from 'vitest';

import { SlCascader, SlCascaderPanel } from './cascader';
import type { CascaderValue } from './cascader-defaults';
import { provideCascaderDefaults } from './cascader-defaults';
import type { CascaderLoadRequest } from './cascader-engine';

interface Place {
  id: string;
  name: string;
  children?: Place[];
  lazy?: boolean;
  disabled?: boolean;
}

const PLACES: Place[] = [
  {
    id: 'pt',
    name: 'Portugal',
    children: [
      {
        id: 'lis',
        name: 'Lisboa',
        children: [
          { id: 'alf', name: 'Fremont' },
          { id: 'bel', name: 'Bellevue' },
        ],
      },
      { id: 'opo', name: 'Porto', children: [{ id: 'rib', name: 'Ribeira' }] },
    ],
  },
  { id: 'es', name: 'España', children: [{ id: 'mad', name: 'Madrid' }] },
  { id: 'fr', name: 'France', lazy: true },
  { id: 'ad', name: 'Andorra', disabled: true },
];

@Component({
  standalone: true,
  imports: [SlCascader, ReactiveFormsModule],
  template: `
    <sl-cascader
      aria-label="Location"
      layout="columns"
      [portal]="false"
      [nodes]="places"
      [getKey]="getKey"
      [getLabel]="getLabel"
      [getChildren]="getChildren"
      [hasChildren]="hasChildren"
      [isNodeDisabled]="isDisabled"
      [selectionMode]="mode()"
      [checkedStrategy]="strategy()"
      [search]="search()"
      [formControl]="control"
      (loadChildren)="loads.push($event)"
    />
  `,
})
class Host {
  readonly places = PLACES;
  readonly getKey = (place: Place) => place.id;
  readonly getLabel = (place: Place) => place.name;
  readonly getChildren = (place: Place) => place.children;
  readonly hasChildren = (place: Place) => place.lazy === true || (place.children?.length ?? 0) > 0;
  readonly isDisabled = (place: Place) => place.disabled === true;
  readonly mode = signal<'single' | 'multiple'>('single');
  readonly strategy = signal<'all' | 'parent' | 'child'>('all');
  readonly search = signal(false);
  readonly control = new FormControl<CascaderValue>(null);
  readonly loads: CascaderLoadRequest[] = [];
}

const trigger = () =>
  document.querySelector<HTMLButtonElement>("[data-part='trigger']") as HTMLButtonElement;
const node = (label: string) =>
  [...document.querySelectorAll<HTMLElement>("[data-part='node']")].find(
    (element) => element.querySelector("[data-part='label']")?.textContent?.trim() === label,
  );
const press = (key: string, target: Element = trigger()) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }));
const click = (element: Element | undefined | null, detail = 1) =>
  element?.dispatchEvent(new MouseEvent('click', { bubbles: true, detail }));

describe('SlCascader', () => {
  let fixture: ComponentFixture<Host>;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    await settle();
  });

  it('carries the identifier the contract declares, on the control and on the layer', async () => {
    const root = fixture.nativeElement.querySelector('sl-cascader') as HTMLElement;
    expect(root.getAttribute('data-ui')).toBe('cascader');
    expect(root.getAttribute('data-part')).toBe('root');
    press('ArrowDown');
    await settle();
    expect(document.querySelector("[data-part='positioner']")?.getAttribute('data-ui')).toBe(
      'cascader',
    );
  });

  it('is a combobox with a tree popup', async () => {
    expect(trigger().getAttribute('aria-haspopup')).toBe('tree');
    press('ArrowDown');
    await settle();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector("[role='tree']")).not.toBeNull();
  });

  it('enters a branch on the inline end and goes back on the inline start', async () => {
    press('ArrowDown');
    await settle();
    expect(trigger().getAttribute('aria-activedescendant')).toBe(node('Portugal')?.id);
    press('ArrowRight');
    await settle();
    expect(trigger().getAttribute('aria-activedescendant')).toBe(node('Lisboa')?.id);
    expect(document.querySelectorAll("[data-part='column']")).toHaveLength(2);
    press('ArrowLeft');
    await settle();
    expect(document.querySelectorAll("[data-part='column']")).toHaveLength(1);
  });

  it('commits a leaf, closes, and hands the value to the form', async () => {
    press('ArrowDown');
    await settle();
    press('ArrowRight');
    await settle();
    press('ArrowRight');
    await settle();
    press('Enter');
    await settle();
    await Promise.resolve();
    expect(fixture.componentInstance.control.value).toBe('alf');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    const segments = trigger().querySelectorAll("[data-part='value-segment']");
    expect([...segments].map((segment) => segment.textContent?.trim())).toEqual([
      'Portugal',
      'Lisboa',
      'Fremont',
    ]);
  });

  it('writes the form value into the control', async () => {
    fixture.componentInstance.control.setValue('bel');
    await settle();
    expect(trigger().textContent).toContain('Bellevue');
  });

  it('toggles a branch with everything below it and emits the parent under parent', async () => {
    fixture.componentInstance.mode.set('multiple');
    fixture.componentInstance.strategy.set('parent');
    fixture.componentInstance.control.setValue([]);
    await settle();
    press('ArrowDown');
    await settle();
    click(node('Portugal'));
    await settle();
    click(node('Lisboa')?.querySelector("[data-part='indicator']"));
    await settle();
    await Promise.resolve();
    expect(fixture.componentInstance.control.value).toEqual(['lis']);
    expect(node('Portugal')?.getAttribute('aria-checked')).toBe('mixed');
  });

  it('refuses a disabled node', async () => {
    press('ArrowDown');
    await settle();
    click(node('Andorra'));
    await settle();
    expect(fixture.componentInstance.control.value).toBeNull();
    expect(node('Andorra')?.getAttribute('aria-disabled')).toBe('true');
  });

  it('asks for a level it does not hold', async () => {
    press('ArrowDown');
    await settle();
    click(node('France'));
    await settle();
    expect(fixture.componentInstance.loads.map((request) => request.key)).toEqual(['fr']);
    expect(document.querySelectorAll("[data-part='loader']")).toHaveLength(3);
    click(node('Portugal'));
    await settle();
    expect(fixture.componentInstance.loads[0]?.signal.aborted).toBe(true);
  });

  it('finds a node at any depth and prints the road to it', async () => {
    fixture.componentInstance.search.set(true);
    await settle();
    press('ArrowDown');
    await settle();
    const field = document.querySelector<HTMLInputElement>("[data-part='search-input']");
    expect(field).not.toBeNull();
    (field as HTMLInputElement).value = 'bel';
    field?.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    expect(node('Bellevue')?.querySelector("[data-part='description']")?.textContent?.trim()).toBe(
      'Portugal / Lisboa',
    );
    expect(
      node('Bellevue')?.querySelector("[data-ui='highlight'] [data-part='match']")?.textContent,
    ).toBe('Bel');
  });

  it('reports required when nothing is chosen', async () => {
    TestBed.resetTestingModule();
    @Component({
      standalone: true,
      imports: [SlCascader, ReactiveFormsModule],
      template: `<sl-cascader
        aria-label="Location"
        [required]="true"
        [nodes]="places"
        [getKey]="getKey"
        [getLabel]="getLabel"
        [formControl]="control"
      />`,
    })
    class Required {
      readonly places = PLACES;
      readonly getKey = (place: Place) => place.id;
      readonly getLabel = (place: Place) => place.name;
      readonly control = new FormControl<CascaderValue>(null);
    }
    TestBed.configureTestingModule({ imports: [Required] });
    const required = TestBed.createComponent(Required);
    required.detectChanges();
    await required.whenStable();
    expect(required.componentInstance.control.errors).toEqual({ required: true });
  });

  it('takes the defaults an application set once', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideCascaderDefaults({ size: 'lg' })],
    });
    const scoped = TestBed.createComponent(Host);
    scoped.detectChanges();
    await scoped.whenStable();
    const root = scoped.nativeElement.querySelector('sl-cascader') as HTMLElement;
    expect(root.getAttribute('data-size')).toBe('lg');
  });

  it('speaks the language in force, and follows a change of it in place', async () => {
    TestBed.resetTestingModule();
    const locale = signal('pt-BR');
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });
    const scoped = TestBed.createComponent(Host);
    scoped.detectChanges();
    await scoped.whenStable();
    const placeholder = () =>
      scoped.nativeElement.querySelector("[data-part='placeholder']")?.textContent?.trim();
    expect(placeholder()).toBe('Escolher…');

    locale.set('en-US');
    scoped.detectChanges();
    expect(placeholder()).toBe('Choose…');
  });
});

@Component({
  standalone: true,
  imports: [SlCascaderPanel],
  template: `
    <sl-cascader-panel
      aria-label="Places"
      layout="columns"
      [nodes]="places"
      [getKey]="getKey"
      [getLabel]="getLabel"
      [getChildren]="getChildren"
    />
  `,
})
class PanelHost {
  readonly places = PLACES;
  readonly getKey = (place: Place) => place.id;
  readonly getLabel = (place: Place) => place.name;
  readonly getChildren = (place: Place) => place.children;
}

describe('SlCascaderPanel', () => {
  it('is a tree on the page that takes focus and walks by key', async () => {
    TestBed.configureTestingModule({ imports: [PanelHost] });
    const fixture = TestBed.createComponent(PanelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const tree = document.querySelector<HTMLElement>("[role='tree']") as HTMLElement;
    expect(tree.getAttribute('tabindex')).toBe('0');
    expect(tree.getAttribute('aria-activedescendant')).toBe(node('Portugal')?.id);
    press('ArrowDown', tree);
    fixture.detectChanges();
    expect(tree.getAttribute('aria-activedescendant')).toBe(node('España')?.id);
  });
});
