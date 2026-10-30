import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/container/contract.json';
import { SlContainer } from './container';
import type { ContainerAlign, ContainerInset, ContainerSize } from './container';
import { SlContainerBreakout } from './container-breakout';
import { provideContainerDefaults } from './container-defaults';

const defaults = contract.members.container.defaults;

@Component({
  imports: [SlContainer, SlContainerBreakout],
  template: `
    <main slContainer id="page" lang="pt-BR" aria-label="Settings">
      <p>Bounded</p>
      <figure slContainerBreakout id="strip">
        <div slContainer id="inner" size="full">
          <p>Bounded again</p>
        </div>
      </figure>
    </main>

    <div slContainer id="stated" [size]="size()" [inset]="inset()" [align]="align()"></div>
  `,
})
class Host {
  readonly size = signal<ContainerSize | undefined>(undefined);
  readonly inset = signal<ContainerInset | undefined>(undefined);
  readonly align = signal<ContainerAlign | undefined>(undefined);
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const byId = (id: string) => element.querySelector<HTMLElement>(`#${id}`)!;
  return { byId, fixture };
}

describe('SlContainer', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const { byId } = mount();

    expect(byId('page').getAttribute('data-ui')).toBe('container');
    expect(byId('page').getAttribute('data-part')).toBe('root');
    expect(byId('strip').getAttribute('data-part')).toBe('breakout');
  });

  it('is written on the element the page chose, and keeps its semantics', () => {
    const { byId } = mount();

    expect(byId('page').tagName).toBe('MAIN');
    expect(byId('strip').tagName).toBe('FIGURE');
    expect(byId('page').getAttribute('role')).toBeNull();
  });

  it('leaves the attributes the consumer wrote alone', () => {
    const { byId } = mount();

    expect(byId('page').getAttribute('lang')).toBe('pt-BR');
    expect(byId('page').getAttribute('aria-label')).toBe('Settings');
  });

  it('writes the contract defaults when the template states nothing', () => {
    const { byId } = mount();
    const page = byId('page');

    expect(page.getAttribute('data-size')).toBe(defaults.size);
    expect(page.getAttribute('data-inset')).toBe(defaults.inset);
    expect(page.getAttribute('data-align')).toBe(defaults.align);
  });

  it('writes each axis the template states, and reacts to a later change', () => {
    const { byId, fixture } = mount();
    const host = fixture.componentInstance;

    host.size.set('measure');
    host.inset.set(0);
    host.align.set('start');
    fixture.detectChanges();

    const stated = byId('stated');
    expect(stated.getAttribute('data-size')).toBe('measure');
    expect(stated.getAttribute('data-inset')).toBe('0');
    expect(stated.getAttribute('data-align')).toBe('start');
  });

  it('nests, so bounded content returns inside a breakout', () => {
    const { byId } = mount();

    expect(byId('inner').getAttribute('data-size')).toBe('full');
    expect(byId('strip').contains(byId('inner'))).toBe(true);
  });

  it('offers every step the contract declares', () => {
    const { byId, fixture } = mount();

    for (const size of contract.axes.size) {
      fixture.componentInstance.size.set(size as ContainerSize);
      fixture.detectChanges();
      expect(byId('stated').getAttribute('data-size')).toBe(size);
    }
  });
});

describe('provideContainerDefaults', () => {
  it('sets the family defaults once for an application', () => {
    TestBed.configureTestingModule({
      providers: [provideContainerDefaults({ align: 'end', inset: 9, size: 'wide' })],
    });

    const { byId } = mount();
    const page = byId('page');

    expect(page.getAttribute('data-size')).toBe('wide');
    expect(page.getAttribute('data-inset')).toBe('9');
    expect(page.getAttribute('data-align')).toBe('end');
  });

  it('lets an explicit input win over the token, never the other way round', () => {
    TestBed.configureTestingModule({
      providers: [provideContainerDefaults({ inset: 9, size: 'wide' })],
    });

    const { byId } = mount();

    expect(byId('inner').getAttribute('data-size')).toBe('full');
    expect(byId('inner').getAttribute('data-inset')).toBe('9');
  });

  it('falls back to the library default for anything it does not state', () => {
    TestBed.configureTestingModule({ providers: [provideContainerDefaults({ size: 'measure' })] });

    const { byId } = mount();

    expect(byId('page').getAttribute('data-size')).toBe('measure');
    expect(byId('page').getAttribute('data-inset')).toBe(defaults.inset);
    expect(byId('page').getAttribute('data-align')).toBe(defaults.align);
  });
});
