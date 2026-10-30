import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/import-export-center/contract.json';
import { SlottedProvider } from '../i18n';
import { createToaster } from '../toast';
import { ImportExportCenter } from './import-export-center';
import { ImportExportCenterDefaultsProvider } from './import-export-center-defaults';
import type { ImportExportCenterHandle, ImportExportCenterProps, ImportExportJob } from './index';
import { useJobToasts } from './use-job-toasts';

const NOW = Date.parse('2026-09-25T14:00:00Z');

const JOBS: ImportExportJob[] = [
  {
    createdAt: '2026-09-25T13:58:00Z',
    direction: 'import',
    format: 'CSV',
    key: 'crm',
    progress: { max: 5000, value: 1204 },
    source: { name: 'crm-contacts.csv', size: 4_200_000 },
    stage: 'Gravando registros',
    status: 'running',
    title: 'CRM contacts',
  },
  {
    counts: { created: 2210, failed: 12, processed: 2988, total: 3000, updated: 778 },
    direction: 'import',
    errorCount: 12,
    errors: [
      // language: pt-BR
      { column: 'SKU', message: 'Campo obrigatório vazio', row: 14 },
      { column: 'Preço', message: 'Não é um número', row: 208, value: '12,5O' },
      // language: en-US
    ],
    errorsFile: { href: '#erros', name: 'catalog-errors.csv' },
    key: 'catalog',
    status: 'succeeded',
    title: 'Product catalog',
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
    // language: pt-BR
    message: 'O serviço de relatórios não respondeu.',
    // language: en-US
    status: 'failed',
    title: 'Delinquent customers',
  },
];

/** The jobs are Brazilian, so the center speaks Brazilian Portuguese around them. */
function Center(props: Partial<ImportExportCenterProps>) {
  return (
    <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
      <ImportExportCenter jobs={JOBS} now={NOW} {...props} />
    </SlottedProvider>
  );
}

const root = () => document.querySelector('[data-ui="import-export-center"]') as HTMLElement;
const job = (key: string) =>
  root().querySelector(`[data-part="job"][data-key="${key}"]`) as HTMLElement;

describe('ImportExportCenter', () => {
  it('names itself and its list by the title, and carries the identity the contract declares', () => {
    render(<Center />);
    expect(root().dataset['ui']).toBe(contract.ui);
    // language: pt-BR
    expect(screen.getByRole('region', { name: /Importações e exportações/ })).toBe(root());
    expect(screen.getByRole('list', { name: /Importações e exportações/ })).toBeTruthy();
    // language: en-US
    expect(root().dataset['size']).toBe('md');
    expect(root().dataset['view']).toBe('all');
  });

  it('draws the count of active jobs beside the title', () => {
    render(<Center />);
    expect(root().querySelector('[data-part="count"]')?.textContent).toBe('1 em andamento');
  });

  it('speaks English without a language in force, and lays its own messages over it', () => {
    render(
      <ImportExportCenter
        defaultExpanded={['catalog']}
        jobs={JOBS}
        messages={{ title: 'Jobs' }}
        now={NOW}
      />,
    );
    expect(screen.getByRole('region', { name: /^Jobs/ })).toBe(root());
    expect(job('catalog').querySelector('[data-part="status-label"]')?.textContent).toContain(
      'Completed with 12 errors',
    );
    expect(job('catalog').querySelector('[data-part="errors-note"]')?.textContent).toBe(
      'Showing 2 of 12',
    );
    expect(within(job('crm')).getByRole('button', { name: 'Cancel CRM contacts' })).toBeTruthy();
  });

  it('derives the partial outcome from the counts and paints the status it declares', () => {
    render(<Center />);
    expect(job('catalog').dataset['outcome']).toBe('partial');
    expect(job('catalog').querySelector('[data-part="status-label"]')?.textContent).toContain(
      // language: pt-BR
      'Concluído com 12 erros',
      // language: en-US
    );
    expect(job('invoices').dataset['outcome']).toBe('success');
    expect(job('debtors').dataset['outcome']).toBe('failed');
    expect(job('crm').dataset['outcome']).toBeUndefined();
  });

  it('draws the ring of spinner for a running job and a glyph otherwise', () => {
    render(<Center />);
    expect(job('crm').querySelector('[data-part="mark"] [data-ui="spinner"]')).toBeTruthy();
    expect(
      job('invoices').querySelector('[data-part="mark"] [data-glyph="circle-check"]'),
    ).toBeTruthy();
    expect(
      job('catalog').querySelector('[data-part="mark"] [data-glyph="circle-alert"]'),
    ).toBeTruthy();
  });

  it('names every control by its words and the job title', () => {
    render(<Center />);
    // language: pt-BR
    const cancel = within(job('crm')).getByRole('button', { name: 'Cancelar CRM contacts' });
    // language: en-US
    expect(cancel).toBeTruthy();
    expect(
      // language: pt-BR
      within(job('invoices')).getByRole('link', { name: 'Baixar Q3 invoices' }),
      // language: en-US
    ).toBeTruthy();
    expect(
      // language: pt-BR
      within(job('catalog')).getByRole('link', { name: 'Baixar erros Product catalog' }),
      // language: en-US
    ).toBeTruthy();
  });

  it('shows progress with its value text and says the stage without wrapping it away', () => {
    render(<Center />);
    const bar = within(job('crm')).getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('1204');
    expect(job('crm').querySelector('[data-part="stage"]')?.getAttribute('title')).toBe(
      'Gravando registros',
    );
    const text = [...job('crm').querySelectorAll('[data-part="progress-text"] > span')].map(
      (item) => item.textContent,
    );
    expect(text[0]).toMatch(/1\.204 de 5\.000 linhas|1,204 de 5,000 linhas/);
  });

  it('writes the deadline of an export and asks before a download', () => {
    const onDownload = vi.fn((_download, request) => request.cancel());
    render(<Center locale="pt-BR" onDownload={onDownload} timeZone="UTC" />);
    expect(job('invoices').querySelector('[data-part="message"]')?.textContent).toMatch(
      // language: pt-BR
      /^Disponível até 2 de out/,
      // language: en-US
    );
    // language: pt-BR
    const link = within(job('invoices')).getByRole('link', { name: /^Baixar/ });
    // language: en-US
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 });
    link.dispatchEvent(event);
    expect(onDownload).toHaveBeenCalledWith(
      { file: 'result', key: 'invoices' },
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(event.defaultPrevented).toBe(true);
  });

  it('asks to cancel, retry and remove, with the reason', () => {
    const onCancel = vi.fn();
    const onRetry = vi.fn();
    const onRemove = vi.fn();
    render(<Center onCancel={onCancel} onRemove={onRemove} onRetry={onRetry} />);
    fireEvent.click(within(job('crm')).getByRole('button', { name: /^Cancelar/ }), { detail: 1 });
    fireEvent.click(within(job('debtors')).getByRole('button', { name: /^Tentar de novo/ }), {
      detail: 0,
    });
    // language: pt-BR
    fireEvent.click(within(job('debtors')).getByRole('button', { name: 'Remover do histórico' }), {
      // language: en-US
      detail: 1,
    });
    expect(onCancel).toHaveBeenCalledWith('crm', expect.objectContaining({ reason: 'pointer' }));
    expect(onRetry).toHaveBeenCalledWith(
      'debtors',
      expect.objectContaining({ reason: 'keyboard' }),
    );
    expect(onRemove).toHaveBeenCalledWith(
      { keys: ['debtors'] },
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('clears every finished job with the reason clear', () => {
    const onRemove = vi.fn();
    render(<Center onRemove={onRemove} />);
    // language: pt-BR
    fireEvent.click(screen.getByRole('button', { name: 'Limpar concluídos' }));
    // language: en-US
    expect(onRemove).toHaveBeenCalledWith(
      { keys: ['catalog', 'invoices', 'debtors'] },
      expect.objectContaining({ reason: 'clear' }),
    );
  });

  it('opens the details on the toggle, keeping its words, and holds the set uncontrolled', () => {
    const onExpandedChange = vi.fn();
    render(<Center onExpandedChange={onExpandedChange} />);
    const toggle = within(job('catalog')).getByRole('button', { name: /^Detalhes/ });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle, { detail: 1 });
    expect(onExpandedChange).toHaveBeenCalledWith(
      ['catalog'],
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.textContent).toBe('Detalhes');
    const details = screen.getByRole('region', { name: /^Detalhes/ });
    expect(toggle.getAttribute('aria-controls')).toBe(details.id);
    expect(within(details).getByRole('table')).toBeTruthy();
    expect(details.querySelector('[data-part="errors-note"]')?.textContent).toBe(
      'Mostrando 2 de 12',
    );
    expect(within(details).getAllByRole('row')).toHaveLength(3);
  });

  it('writes the note when the failed rows are a sample', () => {
    render(
      <Center
        defaultExpanded={['catalog']}
        jobs={JOBS.map((each) => (each.key === 'catalog' ? { ...each, errorCount: 1284 } : each))}
      />,
    );
    expect(job('catalog').querySelector('[data-part="errors-note"]')?.textContent).toMatch(
      /Mostrando 2 de 1.284/,
    );
  });

  it('refuses an expanded request the consumer cancels, and follows a controlled set', () => {
    const { rerender } = render(<Center expanded={[]} onExpandedChange={() => {}} />);
    fireEvent.click(within(job('catalog')).getByRole('button', { name: /^Detalhes/ }));
    expect(job('catalog').dataset['expanded']).toBeUndefined();
    rerender(<Center expanded={['catalog']} onExpandedChange={() => {}} />);
    expect(job('catalog').dataset['expanded']).toBe('');
  });

  it('filters the built-in views and asks with the view model', () => {
    const onViewChange = vi.fn();
    render(<Center onViewChange={onViewChange} />);
    // language: pt-BR
    fireEvent.click(screen.getByRole('tab', { name: 'Exportações' }));
    // language: en-US
    expect(onViewChange).toHaveBeenCalledWith(
      'export',
      expect.objectContaining({ value: 'export' }),
    );
    expect(root().dataset['view']).toBe('export');
    expect(
      [...root().querySelectorAll('[data-part="job"]')].map(
        (each) => (each as HTMLElement).dataset['key'],
      ),
    ).toEqual(['invoices', 'debtors']);
  });

  it('draws the empty page of the view, and the error page that asks to reload', () => {
    const onReload = vi.fn();
    const { rerender } = render(<Center defaultView="import" jobs={[]} />);
    // language: pt-BR
    expect(root().querySelector('[data-part="empty"]')?.textContent).toContain(
      'Nenhuma importação',
    );
    // language: en-US
    rerender(<Center jobs={[]} onReload={onReload} status="error" />);
    fireEvent.click(
      within(root().querySelector('[data-part="error"]') as HTMLElement).getByRole('button'),
      { detail: 1 },
    );
    expect(onReload).toHaveBeenCalledWith(expect.objectContaining({ reason: 'pointer' }));
    expect(root().dataset['status']).toBe('error');
  });

  it('stands skeleton jobs in while nothing has arrived, and marks the list busy', () => {
    render(<Center jobs={[]} loading />);
    const list = screen.getByRole('list', { hidden: true });
    expect(list.getAttribute('aria-busy')).toBe('true');
    expect(list.querySelectorAll('[data-part="job"][aria-hidden="true"]')).toHaveLength(3);
  });

  it('asks for the next page from the more control', () => {
    const onLoadMore = vi.fn();
    render(<Center growing="button" hasMore onLoadMore={onLoadMore} />);
    // language: pt-BR
    fireEvent.click(screen.getByRole('button', { name: 'Carregar mais' }), { detail: 1 });
    // language: en-US
    expect(onLoadMore).toHaveBeenCalledWith(expect.objectContaining({ reason: 'pointer' }));
  });

  it('announces a transition once, and nothing on the first render', () => {
    vi.useFakeTimers();
    const { rerender } = render(<Center />);
    const region = () =>
      [...document.querySelectorAll('[data-slotted-live-announcer] [aria-live="polite"]')]
        .map((node) => node.textContent)
        .join('');
    act(() => vi.advanceTimersByTime(500));
    expect(region()).not.toContain('CRM contacts');
    rerender(
      <Center
        jobs={JOBS.map((each) => (each.key === 'crm' ? { ...each, status: 'succeeded' } : each))}
      />,
    );
    act(() => vi.advanceTimersByTime(500));
    // language: pt-BR
    expect(region()).toContain('Importação CRM contacts concluída');
    // language: en-US
    vi.useRealTimers();
  });

  it('keeps focus in a job whose control the status took away', () => {
    const { rerender } = render(<Center />);
    const cancel = within(job('crm')).getByRole('button', { name: /^Cancelar/ });
    cancel.focus();
    rerender(
      <Center
        jobs={JOBS.map((each) =>
          each.key === 'crm'
            ? {
                ...each,
                counts: { total: 5000 },
                result: { href: '#r', name: 'r.csv' },
                status: 'succeeded',
              }
            : each,
        )}
      />,
    );
    expect(document.activeElement?.closest('[data-part="download"]')).toBeTruthy();
    expect(document.activeElement?.closest('[data-part="job"]')).toBe(job('crm'));
  });

  it('moves focus to the same control of the next job when a job leaves', () => {
    const { rerender } = render(<Center />);
    // language: pt-BR
    within(job('catalog')).getByRole('button', { name: 'Remover do histórico' }).focus();
    // language: en-US
    rerender(<Center jobs={JOBS.filter((each) => each.key !== 'catalog')} />);
    expect(document.activeElement?.closest('[data-part="job"]')).toBe(job('invoices'));
    // language: pt-BR
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Remover do histórico');
    // language: en-US
  });

  it('reveals a job from the handle: shows its details and focuses its title', () => {
    function Revealing() {
      const ref = useRef<ImportExportCenterHandle>(null);
      return (
        <>
          <button onClick={() => ref.current?.reveal('catalog')} type="button">
            ver
          </button>
          <Center defaultView="export" ref={ref} />
        </>
      );
    }
    render(<Revealing />);
    fireEvent.click(screen.getByRole('button', { name: 'ver' }));
    expect(root().dataset['view']).toBe('all');
    expect(job('catalog').dataset['expanded']).toBe('');
    expect(document.activeElement?.getAttribute('data-part')).toBe('job-title');
    expect(document.activeElement?.closest('[data-part="job"]')).toBe(job('catalog'));
  });

  it('takes its defaults from the provider, and an explicit prop still wins', () => {
    render(
      <ImportExportCenterDefaultsProvider level="3" size="sm">
        <Center messages={{ title: 'Jobs' }} size="md" />
      </ImportExportCenterDefaultsProvider>,
    );
    expect(screen.getByRole('heading', { level: 3 }).textContent).toContain('Jobs');
    expect(root().dataset['size']).toBe('md');
  });

  it("passes native props through and renders the consumer's own job actions", () => {
    render(
      <Center
        data-testid="center"
        id="jobs"
        renderJobActions={(each) =>
          each.key === 'invoices' ? <a href="#share">Partilhar</a> : null
        }
      />,
    );
    expect(screen.getByTestId('center').id).toBe('jobs');
    expect(job('invoices').querySelector('[data-part="job-actions"] a')?.textContent).toBe(
      'Partilhar',
    );
    expect(job('crm').querySelector('[data-part="job-actions"]')).toBeNull();
  });
});

describe('useJobToasts', () => {
  function Shell({
    jobs,
    onView,
  }: {
    jobs: readonly ImportExportJob[];
    onView: (key: string) => void;
  }) {
    const [toaster] = useState(() => createToaster());
    useJobToasts(jobs, { onView, toaster });
    return <output data-testid="count">{toaster.store.snapshot.visible.length}</output>;
  }

  it('points one toast at a job, under its key, and replaces it when the job finishes', () => {
    const toaster = createToaster();
    const show = vi.spyOn(toaster, 'show');
    function Probe({ jobs }: { jobs: readonly ImportExportJob[] }) {
      useJobToasts(jobs, { onView: () => {}, toaster });
      return null;
    }
    const queued: ImportExportJob = {
      direction: 'export',
      key: 'x',
      status: 'queued',
      title: 'Invoices',
    };
    const { rerender } = render(<Probe jobs={[queued]} />);
    expect(show).not.toHaveBeenCalled();
    rerender(<Probe jobs={[{ ...queued, status: 'running' }]} />);
    rerender(<Probe jobs={[{ ...queued, status: 'succeeded' }]} />);
    expect(show).toHaveBeenCalledTimes(2);
    expect(show.mock.calls[0]?.[0]).toMatchObject({
      id: 'import-export-center:x',
      loading: true,
      title: 'Export Invoices started',
    });
    expect(show.mock.calls[1]?.[0]).toMatchObject({
      announcement: 'Export Invoices completed',
      id: 'import-export-center:x',
      loading: false,
      tone: 'success',
    });
  });

  it('renders nothing for a job that arrives already finished', () => {
    render(<Shell jobs={[]} onView={() => {}} />);
    expect(screen.getByTestId('count').textContent).toBe('0');
  });
});
