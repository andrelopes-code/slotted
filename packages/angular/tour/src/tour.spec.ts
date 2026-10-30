import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { SlDialog, SlDialogBody, SlDialogTitle } from '@slotted/angular/dialog';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/tour/contract.json';
import { SlTour } from './tour';
import type { TourOpenRequest, TourStep, TourStepRequest } from './tour-defaults';
import { SlTourCard, SlTourNext, SlTourStep, SlTourTitle } from './tour-parts';
import { SlTourContent } from './tour-parts';

const STEPS: TourStep[] = [
  { id: 'welcome', title: 'Welcome to Reports', description: 'Five stops, about a minute.' },
  { id: 'share', target: '#share', title: 'Share with your team' },
  { id: 'export', target: '#export', title: 'Export what you see' },
];

@Component({
  standalone: true,
  imports: [SlTour, SlTourStep],
  template: `
    <button id="opener" type="button">Help</button>
    <button id="share" type="button">Share</button>
    <button id="export" type="button">Export</button>
    <sl-tour
      #tour="slTour"
      [steps]="steps()"
      [(open)]="open"
      [(step)]="step"
      [missing]="missing()"
      [closeOnEscape]="closeOnEscape()"
      (openChangeRequest)="opens.push($event)"
      (stepChangeRequest)="onStep($event)"
    >
      <ng-template slTourStep="export"><em>Keeps your filters.</em></ng-template>
    </sl-tour>
  `,
})
class Host {
  readonly steps = signal<readonly TourStep[]>(STEPS);
  readonly open = signal(false);
  readonly step = signal<string | null>(null);
  readonly missing = signal<'center' | 'skip'>('center');
  readonly closeOnEscape = signal(true);
  readonly refuse = signal<string | null>(null);
  readonly opens: TourOpenRequest[] = [];
  readonly steps_: TourStepRequest[] = [];
  readonly tour = viewChild.required<SlTour>('tour');

  onStep(request: TourStepRequest) {
    this.steps_.push(request);
    if (request.value === this.refuse()) request.cancel();
  }
}

const root = () => document.querySelector<HTMLElement>('[data-ui="tour"]');
const card = () => document.querySelector<HTMLElement>('[data-ui="tour"] [data-part="content"]');
const part = (name: string) =>
  document.querySelector<HTMLElement>(`[data-ui="tour"] [data-part="${name}"]`);
const title = () => part('title')?.textContent?.trim();

async function settle(fixture: ComponentFixture<unknown>) {
  for (let round = 0; round < 6; round += 1) {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  fixture.detectChanges();
}

async function mount(configure?: (host: Host) => void) {
  const fixture = TestBed.createComponent(Host);
  document.body.append(fixture.nativeElement);
  configure?.(fixture.componentInstance);
  fixture.componentInstance.open.set(true);
  await settle(fixture);
  return fixture;
}

afterEach(() => {
  document.querySelectorAll('[data-ui="tour"]').forEach((node) => node.remove());
});

describe('SlTour', () => {
  it('renders the contract identity and the whole card', async () => {
    await mount();
    expect(root()?.getAttribute('data-ui')).toBe(contract.ui);
    expect(card()?.getAttribute('role')).toBe('dialog');
    expect(card()?.getAttribute('aria-labelledby')).toBe(part('title')?.id);
    expect(card()?.getAttribute('aria-describedby')).toBe(part('description')?.id);
    expect(part('progress')?.textContent?.trim()).toBe('1 of 3');
    expect(title()).toBe('Welcome to Reports');
    expect(root()?.getAttribute('data-placement')).toBe('centered');
  });

  it('speaks the language in force, under a step’s own words, and follows a change of it', async () => {
    const locale = signal('pt-BR');
    TestBed.configureTestingModule({
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });
    const fixture = await mount(
      (host) =>
        // language: pt-BR
        host.steps.set([{ ...STEPS[0]!, messages: { skip: 'Agora não' } }, ...STEPS.slice(1)]),
      // language: en-US
    );
    // language: pt-BR
    expect(part('progress')?.textContent?.trim()).toBe('1 de 3');
    expect(part('close')?.getAttribute('aria-label')).toBe('Fechar tour');
    expect(part('skip')?.textContent?.trim()).toBe('Agora não');
    expect(part('next')?.textContent?.trim()).toBe('Próximo');
    // language: en-US

    locale.set('en-US');
    await settle(fixture);
    expect(part('next')?.textContent?.trim()).toBe('Next');
  });

  it('moves on with Next, anchors the step, and asks with the reason', async () => {
    const fixture = await mount();
    part('next')?.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    await settle(fixture);
    expect(title()).toBe('Share with your team');
    expect(root()?.getAttribute('data-placement')).toBe('anchored');
    expect(part('spotlight')).not.toBeNull();
    expect(fixture.componentInstance.steps_.at(-1)).toMatchObject({
      value: 'share',
      reason: 'pointer',
    });
    expect(part('prev')?.hasAttribute('hidden')).toBe(false);
  });

  it('keeps the card where it is when a step request is cancelled', async () => {
    const fixture = await mount((host) => host.refuse.set('share'));
    part('next')?.click();
    await settle(fixture);
    expect(title()).toBe('Welcome to Reports');
  });

  it('reads Done on the last step, renders its template body, and closes as complete', async () => {
    const fixture = await mount((host) => host.step.set('export'));
    expect(part('next')?.textContent?.trim()).toBe('Done');
    expect(part('next')?.hasAttribute('data-last')).toBe(true);
    expect(part('body')?.querySelector('em')?.textContent).toBe('Keeps your filters.');
    expect(part('skip')?.hasAttribute('hidden')).toBe(true);
    part('next')?.click();
    await settle(fixture);
    expect(fixture.componentInstance.opens.at(-1)).toMatchObject({
      value: false,
      outcome: 'complete',
    });
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('tells skip, close and Escape apart', async () => {
    const fixture = await mount();
    /* The cross is the library's `Glyph` in an `icon`, not a painted mask. */
    expect(part('close')!.querySelector('[data-ui="icon"] > svg[data-glyph="x"]')).not.toBeNull();
    part('close')?.click();
    await settle(fixture);
    expect(fixture.componentInstance.opens.at(-1)).toMatchObject({
      outcome: 'close',
      reason: 'dismiss',
    });

    fixture.componentInstance.open.set(true);
    await settle(fixture);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle(fixture);
    expect(fixture.componentInstance.opens.at(-1)).toMatchObject({
      outcome: 'close',
      reason: 'escape',
    });

    fixture.componentInstance.open.set(true);
    await settle(fixture);
    part('skip')?.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    await settle(fixture);
    expect(fixture.componentInstance.opens.at(-1)).toMatchObject({
      outcome: 'skip',
      reason: 'pointer',
    });
    expect(fixture.componentInstance.step()).toBeNull();
  });

  it('goes on with ArrowRight and back with ArrowLeft', async () => {
    const fixture = await mount();
    card()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await settle(fixture);
    expect(title()).toBe('Share with your team');
    card()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await settle(fixture);
    expect(title()).toBe('Welcome to Reports');
  });

  it('passes over an unavailable step and centres a missing target', async () => {
    const fixture = await mount((host) =>
      host.steps.set([
        { id: 'a', title: 'First' },
        { id: 'b', title: 'Hidden', when: () => false },
        { id: 'c', target: '#nowhere', title: 'Lost' },
      ]),
    );
    expect(part('progress')?.textContent?.trim()).toBe('1 of 2');
    part('next')?.click();
    await settle(fixture);
    expect(title()).toBe('Lost');
    expect(root()?.hasAttribute('data-missing')).toBe(true);
  });

  it('makes the page inert on a modal step and not on an interactive one', async () => {
    const fixture = await mount((host) =>
      host.steps.set([
        { id: 'a', target: '#share', title: 'Look' },
        {
          id: 'b',
          target: '#export',
          title: 'Press Export',
          interactive: true,
          advanceOn: 'click',
        },
        { id: 'c', title: 'Exported' },
      ]),
    );
    expect(card()?.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById('opener')?.closest('[inert]')).not.toBeNull();
    part('next')?.click();
    await settle(fixture);
    expect(card()?.hasAttribute('aria-modal')).toBe(false);
    expect(document.getElementById('opener')?.closest('[inert]')).toBeNull();
    expect(part('next')?.hasAttribute('hidden')).toBe(true);
    document
      .getElementById('export')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    await settle(fixture);
    expect(title()).toBe('Exported');
  });

  it('closes with the outcome unavailable when no step can be shown', async () => {
    const fixture = await mount((host) =>
      host.steps.set([{ id: 'x', title: 'X', when: () => false }]),
    );
    expect(fixture.componentInstance.opens.at(-1)).toMatchObject({
      value: false,
      outcome: 'unavailable',
    });
    expect(root()).toBeNull();
  });

  it('turns a lateral side vertical and marks the root compact on a phone-width viewport', async () => {
    const width = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 });
    try {
      const fixture = await mount((host) =>
        host.steps.set([{ id: 'share', target: '#share', side: 'inline-end', title: 'Share' }]),
      );
      await settle(fixture);
      expect(root()?.hasAttribute('data-compact')).toBe(true);
      expect(part('surface')?.getAttribute('data-side')).toBe('bottom');
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    }
  });

  it('centres the card over a target that leaves it no room, and keeps the spotlight', async () => {
    const editor = document.createElement('div');
    editor.id = 'editor';
    document.body.append(editor);
    editor.getBoundingClientRect = () =>
      ({
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        width: 1024,
        height: 768,
        right: 1024,
        bottom: 768,
      }) as DOMRect;
    const fixture = await mount((host) =>
      host.steps.set([{ id: 'e', target: '#editor', title: 'The whole editor' }]),
    );
    await settle(fixture);
    expect(root()?.getAttribute('data-placement')).toBe('centered');
    expect(root()?.hasAttribute('data-spotlight')).toBe(true);
    expect(part('arrow')).toBeNull();
    editor.remove();
  });

  it('starts at a named step through exportAs', async () => {
    const fixture = TestBed.createComponent(Host);
    document.body.append(fixture.nativeElement);
    await settle(fixture);
    fixture.componentInstance.tour().start('export');
    await settle(fixture);
    expect(title()).toBe('Export what you see');
  });
});

@Component({
  standalone: true,
  imports: [SlTour, SlTourCard, SlTourContent, SlTourTitle, SlTourNext],
  providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
  template: `
    <sl-tour #tour="slTour" [steps]="steps" [(open)]="open">
      <ng-template slTourCard>
        <div slTourContent aria-label="Guia">
          <h3 slTourTitle></h3>
          <span data-testid="dots">{{ tour.position() }}/{{ tour.total() }}</span>
          <button slTourNext type="button">{{ tour.t('next') }}</button>
        </div>
      </ng-template>
    </sl-tour>
  `,
})
class Composed {
  readonly steps = STEPS;
  readonly open = signal(true);
}

describe('SlTour composition', () => {
  it('renders the consumer’s card with the parts and the words of the language in force', async () => {
    const fixture = TestBed.createComponent(Composed);
    document.body.append(fixture.nativeElement);
    await settle(fixture);
    expect(card()?.getAttribute('aria-label')).toBe('Guia');
    expect(card()?.hasAttribute('aria-labelledby')).toBe(false);
    expect(document.querySelector('h3')?.textContent?.trim()).toBe('Welcome to Reports');
    expect(document.querySelector('[data-testid="dots"]')?.textContent).toBe('1/3');
    // language: pt-BR
    expect(part('next')?.textContent?.trim()).toBe('Próximo');
    // language: en-US
    expect(part('progress')).toBeNull();
  });
});

@Component({
  standalone: true,
  imports: [SlTour, SlDialog, SlDialogBody, SlDialogTitle],
  template: `
    <sl-dialog [(open)]="dialog">
      <h2 slDialogTitle>Invite people</h2>
      <div slDialogBody><input aria-label="Emails" id="email" /></div>
    </sl-dialog>
    <sl-tour [steps]="steps" [(open)]="open" />
  `,
})
class DialogFlow {
  readonly dialog = signal(false);
  readonly open = signal(true);
  readonly steps: TourStep[] = [
    { id: 'start', title: 'Invite your team' },
    {
      id: 'email',
      target: '#email',
      title: 'Type their emails',
      prepare: () =>
        new Promise<void>((resolve) => {
          this.dialog.set(true);
          setTimeout(resolve, 50);
        }),
    },
  ];
}

describe('SlTour over a dialog a step opened', () => {
  it('is raised back on top, keeps focus in its card, and leaves the dialog inert', async () => {
    const fixture = TestBed.createComponent(DialogFlow);
    document.body.append(fixture.nativeElement);
    await settle(fixture);
    card()?.focus();
    part('next')?.click();
    for (let round = 0; round < 4; round += 1) {
      await new Promise((resolve) => setTimeout(resolve, 40));
      await settle(fixture);
    }
    expect(title()).toBe('Type their emails');
    expect(root()?.closest('[inert]')).toBeNull();
    expect(document.activeElement).toBe(card());
    expect(document.querySelector('[data-ui="dialog"]')?.closest('[inert]')).not.toBeNull();
  });
});

/**
 * As an application runs it: the scheduler checks what the signals marked,
 * and nothing forces a check of the whole tree. The frame was an embedded
 * view created by hand, drawn once and never again — the tour opened with no
 * scrim and no card — and its layer was made again on every step, which gave
 * its history entry back and read the browser's answer as the way back. The
 * specs above force a check on every round and saw neither.
 */
describe('SlTour, checked the way an application checks it', () => {
  async function idle(fixture: ComponentFixture<unknown>, ms = 120) {
    await new Promise((resolve) => setTimeout(resolve, ms));
    await fixture.whenStable();
  }

  it('draws its state and walks two steps without closing', async () => {
    const fixture = TestBed.createComponent(Host);
    document.body.append(fixture.nativeElement);
    fixture.autoDetectChanges();
    await idle(fixture);
    fixture.componentInstance.open.set(true);
    await idle(fixture, 200);

    expect(root()?.hasAttribute('data-open')).toBe(true);
    expect(part('surface')?.hasAttribute('data-ready')).toBe(true);

    part('next')?.click();
    await idle(fixture, 300);
    part('next')?.click();
    await idle(fixture, 300);

    expect(title()).toBe('Export what you see');
    expect(root()?.hasAttribute('data-open')).toBe(true);
    expect(fixture.componentInstance.opens.filter((request) => request.value === false)).toEqual(
      [],
    );
  });
});
