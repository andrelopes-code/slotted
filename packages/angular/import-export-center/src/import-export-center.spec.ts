import { Component, signal, viewChild } from '@angular/core';
import type { WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideSlotted } from '@slotted/angular/i18n';
import { SlToastService } from '@slotted/angular/toast';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ImportExportJob } from '@slotted/core/import-export-center';
import type { ChangeRequest } from '@slotted/core/state';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/import-export-center/contract.json';
import {
  SlImportExportCenter,
  SlImportExportCenterActions,
  SlImportExportJobActions,
} from './import-export-center';
import { provideImportExportCenterDefaults } from './import-export-center-defaults';
import type {
  ImportExportDownloadRequest,
  ImportExportJobRequest,
  ImportExportRemoveRequest,
} from './import-export-center-defaults';
import { jobToasts } from './job-toasts';

const NOW = Date.parse('2026-09-25T14:00:00Z');

const JOBS: ImportExportJob[] = [
  {
    createdAt: '2026-09-25T13:58:00Z',
    direction: 'import',
    format: 'CSV',
    key: 'crm',
    progress: { max: 5000, value: 1204 },
    source: { name: 'crm-contacts.csv', size: 4_200_000 },
    stage: 'Writing records',
    status: 'running',
    title: 'CRM Contacts',
  },
  {
    counts: { created: 2210, failed: 12, processed: 2988, total: 3000, updated: 778 },
    direction: 'import',
    errorCount: 12,
    errors: [
      { column: 'SKU', message: 'Required field is empty', row: 14 },
      { column: 'Price', message: 'Not a number', row: 208, value: '12.5O' },
    ],
    errorsFile: { href: '#errors', name: 'catalog-errors.csv' },
    key: 'catalog',
    status: 'succeeded',
    // language: pt-BR
    title: 'Catálogo de produtos',
    // language: en-US
  },
  {
    direction: 'export',
    format: 'CSV',
    key: 'invoices',
    result: { expiresAt: '2026-10-02T09:40:00Z', href: '#invoices', name: 'invoices.csv' },
    status: 'succeeded',
    title: 'Q3 invoices',
  },
  {
    direction: 'export',
    key: 'debtors',
    message: 'The reporting service did not respond.',
    status: 'failed',
    title: 'Delinquent customers',
  },
];

@Component({
  standalone: true,
  imports: [SlImportExportCenter, SlImportExportCenterActions, SlImportExportJobActions],
  template: `<section
    slImportExportCenter
    locale="pt-BR"
    timeZone="UTC"
    [jobs]="jobs()"
    [now]="now"
    [status]="status()"
    [loading]="loading()"
    [growing]="growing()"
    [hasMore]="hasMore()"
    [(view)]="view"
    [(expanded)]="expanded"
    (viewRequest)="viewRequests.push($event)"
    (expandedRequest)="expandedRequests.push($event); onExpanded($event)"
    (cancelRequest)="cancelRequests.push($event)"
    (retryRequest)="retryRequests.push($event)"
    (removeRequest)="removeRequests.push($event)"
    (downloadRequest)="downloadRequests.push($event); onDownload($event)"
    (loadMoreRequest)="loadRequests.push($event)"
    (reloadRequest)="reloadRequests.push($event)"
  >
    <div slImportExportCenterActions><button type="button">Exportar</button></div>
    <ng-template slImportExportJobActions let-job>
      @if (job.key === 'invoices') {
        <a href="#share">Partilhar</a>
      }
    </ng-template>
  </section>`,
})
class Host {
  readonly center = viewChild.required(SlImportExportCenter);
  readonly jobs = signal<readonly ImportExportJob[]>(JOBS);
  readonly status = signal<'ready' | 'error'>('ready');
  readonly loading = signal(false);
  readonly growing = signal<'none' | 'button'>('none');
  readonly hasMore = signal(false);
  readonly view = signal<string | undefined>(undefined);
  readonly expanded = signal<readonly string[] | undefined>(undefined);
  readonly now = NOW;
  readonly viewRequests: ChangeRequest<string | undefined>[] = [];
  readonly expandedRequests: ChangeRequest<readonly string[] | undefined>[] = [];
  readonly cancelRequests: ImportExportJobRequest[] = [];
  readonly retryRequests: ImportExportJobRequest[] = [];
  readonly removeRequests: ImportExportRemoveRequest[] = [];
  readonly downloadRequests: ImportExportDownloadRequest[] = [];
  readonly loadRequests: unknown[] = [];
  readonly reloadRequests: unknown[] = [];
  onExpanded: (request: ChangeRequest<readonly string[] | undefined>) => void = () => undefined;
  onDownload: (request: ImportExportDownloadRequest) => void = () => undefined;
}

@Component({
  standalone: true,
  template: ``,
})
class ToastHost {
  readonly jobs = signal<readonly ImportExportJob[]>([
    { direction: 'export', key: 'x', status: 'queued', title: 'Invoices' },
  ]);
  constructor() {
    jobToasts(this.jobs);
  }
}

describe('SlImportExportCenter', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const query = (selector: string) =>
    fixture.nativeElement.querySelector(selector) as HTMLElement | null;
  const root = () => query('[data-ui="import-export-center"]') as HTMLElement;
  const job = (key: string) => query(`[data-part="job"][data-key="${key}"]`) as HTMLElement;
  const buttonIn = (element: HTMLElement, name: RegExp) =>
    [...element.querySelectorAll<HTMLElement>('button, a')].find((each) => {
      const labelled = each.getAttribute('aria-labelledby');
      const text = labelled
        ? labelled
            .split(' ')
            .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
            .join(' ')
        : (each.getAttribute('aria-label') ?? each.textContent?.trim() ?? '');
      return name.test(text);
    }) as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  /** The jobs are Brazilian, so the center speaks Brazilian Portuguese around them. */
  let language: WritableSignal<string>;

  beforeEach(async () => {
    language = signal('pt-BR');
    await TestBed.configureTestingModule({
      imports: [Host, ToastHost],
      providers: [provideSlotted({ locale: language, catalogs: { 'pt-BR': PT_BR } })],
    }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
  });

  it('carries the identity the contract declares and names itself by the title', () => {
    expect(root().dataset['ui']).toBe(contract.ui);
    const title = query('[data-part="title"]') as HTMLElement;
    expect(root().getAttribute('aria-labelledby')).toBe(title.id);
    expect(query('ul[data-part="list"]')?.getAttribute('aria-labelledby')).toBe(title.id);
    expect(query('[data-part="count"]')?.textContent?.trim()).toBe('1 em andamento');
  });

  it('follows a change of the language in force without being created again', async () => {
    // language: pt-BR
    expect(query('[data-part="title"]')?.textContent).toContain('Importações e exportações');
    // language: en-US
    language.set('en-US');
    await settle();
    expect(query('[data-part="title"]')?.textContent).toContain('Imports and exports');
    expect(query('[data-part="count"]')?.textContent?.trim()).toBe('1 in progress');
    expect(job('catalog').querySelector('[data-part="status-label"]')?.textContent).toContain(
      'Completed with 12 errors',
    );
  });

  it('derives the outcome and draws spinner for a running job', () => {
    expect(job('catalog').dataset['outcome']).toBe('partial');
    expect(job('invoices').dataset['outcome']).toBe('success');
    expect(job('crm').querySelector('[data-part="mark"] [data-ui="spinner"]')).toBeTruthy();
    expect(job('catalog').querySelector('[data-part="status-label"]')?.textContent).toContain(
      // language: pt-BR
      'Concluído com 12 erros',
      // language: en-US
    );
  });

  it('names every control by its words and the job title', () => {
    // language: pt-BR
    expect(buttonIn(job('crm'), /^Cancelar CRM Contacts$/)).toBeTruthy();
    expect(buttonIn(job('invoices'), /^Baixar Q3 invoices$/)).toBeTruthy();
    expect(buttonIn(job('catalog'), /^Baixar erros Catálogo de produtos$/)).toBeTruthy();
    // language: en-US
  });

  it('writes the deadline, and asks before a download, which the consumer may refuse', async () => {
    expect(job('invoices').querySelector('[data-part="message"]')?.textContent).toMatch(
      // language: pt-BR
      /^Disponível até 2 de out/,
      // language: en-US
    );
    host.onDownload = (request) => request.cancel();
    // language: pt-BR
    const link = buttonIn(job('invoices'), /^Baixar Q3 invoices/);
    // language: en-US
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 });
    link.dispatchEvent(event);
    expect(host.downloadRequests[0]).toMatchObject({
      file: 'result',
      key: 'invoices',
      reason: 'pointer',
    });
    expect(event.defaultPrevented).toBe(true);
  });

  it('asks to cancel, retry, remove and clear, with the reason', async () => {
    buttonIn(job('crm'), /^Cancelar/).dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    );
    buttonIn(job('debtors'), /^Tentar de novo/).dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 0 }),
    );
    (job('debtors').querySelector('[data-part="remove"]') as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    );
    (query('[data-part="clear"] button') as HTMLElement).click();
    expect(host.cancelRequests[0]).toMatchObject({ key: 'crm', reason: 'pointer' });
    expect(host.retryRequests[0]).toMatchObject({ key: 'debtors', reason: 'keyboard' });
    expect(host.removeRequests[0]).toMatchObject({ keys: ['debtors'], reason: 'pointer' });
    expect(host.removeRequests[1]).toMatchObject({
      keys: ['catalog', 'invoices', 'debtors'],
      reason: 'clear',
    });
  });

  it('opens the details on the toggle with the expanded model, keeping its words', async () => {
    const toggle = buttonIn(job('catalog'), /^Detalhes/);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    await settle();
    expect(host.expandedRequests[0]).toMatchObject({ reason: 'pointer', value: ['catalog'] });
    expect(host.expanded()).toEqual(['catalog']);
    const again = buttonIn(job('catalog'), /^Detalhes/);
    expect(again.getAttribute('aria-expanded')).toBe('true');
    expect(again.textContent?.trim()).toBe('Detalhes');
    const details = query(`#${again.getAttribute('aria-controls')}`) as HTMLElement;
    expect(details.getAttribute('role')).toBe('region');
    expect(details.querySelector('table')).toBeTruthy();
    expect(details.querySelector('[data-part="errors-note"]')?.textContent?.trim()).toBe(
      'Mostrando 2 de 12',
    );
  });

  it('refuses an expanded request the consumer cancels', async () => {
    host.onExpanded = (request) => request.cancel();
    buttonIn(job('catalog'), /^Detalhes/).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle();
    expect(job('catalog').dataset['expanded']).toBeUndefined();
  });

  it('filters the built-in views through the view model', async () => {
    const tabs = [...fixture.nativeElement.querySelectorAll('[role="tab"]')] as HTMLElement[];
    // language: pt-BR
    tabs.find((tab) => tab.textContent?.includes('Exportações'))?.click();
    // language: en-US
    await settle();
    expect(host.viewRequests[0]).toMatchObject({ value: 'export' });
    expect(root().dataset['view']).toBe('export');
    const keys = [...fixture.nativeElement.querySelectorAll('[data-part="job"]')].map(
      (each) => (each as HTMLElement).dataset['key'],
    );
    expect(keys).toEqual(['invoices', 'debtors']);
  });

  it('draws the error page that asks to reload, and skeleton jobs while nothing has arrived', async () => {
    host.status.set('error');
    await settle();
    (query('[data-part="error"] button') as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    );
    expect(host.reloadRequests).toHaveLength(1);
    host.status.set('ready');
    host.jobs.set([]);
    host.loading.set(true);
    await settle();
    expect(query('ul[data-part="list"]')?.getAttribute('aria-busy')).toBe('true');
    expect(
      fixture.nativeElement.querySelectorAll('[data-part="job"][aria-hidden="true"]'),
    ).toHaveLength(3);
  });

  it('asks for the next page from the more control', async () => {
    host.growing.set('button');
    host.hasMore.set(true);
    await settle();
    (query('[data-part="more"]') as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    );
    expect(host.loadRequests).toHaveLength(1);
  });

  it("renders the consumer's own job actions and header actions", () => {
    expect(job('invoices').querySelector('[data-part="job-actions"] a')?.textContent).toBe(
      'Partilhar',
    );
    expect(query('[data-part="tools"] [data-part="actions"] button')?.textContent).toBe('Exportar');
  });

  it('keeps focus in a job whose control the status took away', async () => {
    buttonIn(job('crm'), /^Cancelar/).focus();
    host.jobs.set(
      JOBS.map((each) =>
        each.key === 'crm'
          ? {
              ...each,
              counts: { total: 5000 },
              result: { href: '#r', name: 'r.csv' },
              status: 'succeeded',
            }
          : each,
      ),
    );
    await settle();
    expect(document.activeElement?.closest('[data-part="download"]')).toBeTruthy();
    expect(document.activeElement?.closest('[data-part="job"]')).toBe(job('crm'));
  });

  it('moves focus to the same control of the next job when a job leaves', async () => {
    (job('catalog').querySelector('[data-part="remove"]') as HTMLElement).focus();
    host.jobs.set(JOBS.filter((each) => each.key !== 'catalog'));
    await settle();
    expect(document.activeElement?.closest('[data-part="job"]')).toBe(job('invoices'));
    expect(document.activeElement?.getAttribute('data-part')).toBe('remove');
  });

  it('reveals a job: shows its details and focuses its title', async () => {
    host.view.set('export');
    await settle();
    host.center().reveal('catalog');
    await settle();
    expect(root().dataset['view']).toBe('all');
    expect(job('catalog').dataset['expanded']).toBe('');
    expect(document.activeElement?.getAttribute('data-part')).toBe('job-title');
  });
});

describe('provideImportExportCenterDefaults', () => {
  it('sets the defaults once, and an explicit input still wins', async () => {
    @Component({
      standalone: true,
      imports: [SlImportExportCenter],
      template: `<section
        slImportExportCenter
        size="md"
        [jobs]="[]"
        [messages]="{ title: 'Jobs' }"
      ></section>`,
    })
    class Provided {}
    await TestBed.configureTestingModule({
      imports: [Provided],
      providers: [provideImportExportCenterDefaults({ level: '3', size: 'sm' })],
    }).compileComponents();
    const fixture = TestBed.createComponent(Provided);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h3[data-part="title"]') as HTMLElement;
    expect(heading.textContent?.trim()).toBe('Jobs');
    expect(
      (fixture.nativeElement.querySelector('[data-ui="import-export-center"]') as HTMLElement)
        .dataset['size'],
    ).toBe('md');
  });
});

describe('jobToasts', () => {
  it('points one toast at a job under its key, and replaces it when the job finishes', async () => {
    await TestBed.configureTestingModule({ imports: [ToastHost] }).compileComponents();
    const toasts = TestBed.inject(SlToastService);
    const show = vi.spyOn(toasts, 'show');
    const fixture = TestBed.createComponent(ToastHost);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(show).not.toHaveBeenCalled();
    fixture.componentInstance.jobs.set([
      { direction: 'export', key: 'x', status: 'running', title: 'Invoices' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.jobs.set([
      { direction: 'export', key: 'x', status: 'succeeded', title: 'Invoices' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(show).toHaveBeenCalledTimes(2);
    expect(show.mock.calls[0]?.[0]).toMatchObject({ id: 'import-export-center:x', loading: true });
    expect(show.mock.calls[1]?.[0]).toMatchObject({
      announcement: 'Export Invoices completed',
      data: { key: 'x' },
      tone: 'success',
    });
  });
});
