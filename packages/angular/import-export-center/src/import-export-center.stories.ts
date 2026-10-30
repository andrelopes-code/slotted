import { Component, computed, inject, input, signal, TemplateRef, viewChild } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDialog,
  SlDialogBody,
  SlDialogClose,
  SlDialogDescription,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
} from '@slotted/angular/dialog';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlLink } from '@slotted/angular/link';
import {
  SlPopover,
  SlPopoverContent,
  SlPopoverLayer,
  SlPopoverTrigger,
} from '@slotted/angular/popover';
import { SlRadio, SlRadioGroup } from '@slotted/angular/radio-group';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlToastRegion, SlToastService } from '@slotted/angular/toast';
import type { ToastContent, ToastMessage } from '@slotted/angular/toast';
import { SlUpload } from '@slotted/angular/upload';
import type { ImportExportJob } from '@slotted/core/import-export-center';
import type { ChangeRequest } from '@slotted/core/state';
import type { UploadContext } from '@slotted/core/upload';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import {
  SlImportExportCenter,
  SlImportExportCenterActions,
  SlImportExportCenterFooter,
  SlImportExportJobActions,
} from './import-export-center';
import {
  provideImportExportCenterDefaults,
  type ImportExportCenterGrowing,
  type ImportExportCenterLevel,
  type ImportExportCenterSize,
  type ImportExportCenterStatus,
  type ImportExportCenterTimeFormat,
  type ImportExportView,
} from './import-export-center-defaults';
import { FILE_JOBS, JobStore, JOBS, jobsOf, NOW } from './import-export-center.demo';
import {
  ANGULAR_IMPORT_EXPORT_CENTER_DOCS,
  ANGULAR_IMPORT_EXPORT_CENTER_TOKENS,
} from './import-export-center.docs';
import { jobToasts } from './job-toasts';
import type { JobToastData } from './job-toasts';

/* ── Fixtures a scene picks by name ─────────────────────────────────────── */

const PROGRESS_JOBS: readonly ImportExportJob[] = [
  {
    direction: 'import',
    eta: new Date(NOW + 170_000).toISOString(),
    format: 'CSV',
    key: 'rows',
    progress: { max: 5000, value: 1204 },
    stage: 'Writing records',
    status: 'running',
    title: 'CRM Contacts — rows and server deadline',
  },
  {
    direction: 'import',
    format: 'ZIP',
    key: 'bytes',
    progress: { max: 10_000_000, unit: 'bytes', value: 2_500_000 },
    stage: 'Recebendo o arquivo',
    status: 'running',
    title: 'Fotografias dos produtos — bytes',
  },
  {
    direction: 'export',
    format: 'XLSX',
    key: 'percent',
    progress: { max: 100, unit: 'percent', value: 64 },
    status: 'running',
    title: 'Margin report — percentage',
  },
  {
    direction: 'export',
    format: 'XLSX',
    key: 'waiting',
    progress: {},
    stage: 'Preparing the file',
    status: 'running',
    title: 'Open orders — no value',
  },
];

const SAMPLED: readonly ImportExportJob[] = jobsOf(['catalog-autumn']).map((job) => ({
  ...job,
  counts: { ...job.counts, failed: 1284 },
  errorCount: 1284,
}));

const LONG: readonly ImportExportJob[] = [
  {
    direction: 'import',
    format: 'CSV',
    key: 'long',
    progress: { max: 1_250_000, value: 912_400 },
    source: {
      name: 'consolidated_accounting_entries_northeast_midwest_branches_2025_final_revised_version.csv',
      size: 184_000_000,
    },
    stage: 'Validating cross-references between cost centers and the chart of accounts',
    status: 'running',
    title: 'Annual consolidation of accounting entries from the Northeast and Midwest branches',
  },
  {
    direction: 'export',
    format: 'DOCX',
    key: 'arabic',
    result: { href: '#r', name: 'تقرير-المبيعات-سبتمبر.docx', size: 88_000 },
    status: 'succeeded',
    title: 'تقرير المبيعات الشهري',
  },
];

const SEEDS: Record<string, readonly ImportExportJob[]> = {
  all: JOBS,
  none: [],
  files: FILE_JOBS,
  long: LONG,
  pair: jobsOf(['crm-contacts', 'invoices-q3']),
  finished: jobsOf(['invoices-q3', 'debtors']),
  progress: PROGRESS_JOBS,
  sampled: SAMPLED,
};

/* ── Template helpers ───────────────────────────────────────────────────── */

function scene(label: string, note: string, body: string) {
  return `<section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;
}

function grid(scenes: string) {
  return `<div class="slotted-demo-grid" data-columns="1">${scenes}</div>`;
}

function jobs(attributes: string) {
  return `<sl-iec-jobs ${attributes}></sl-iec-jobs>`;
}

/* ── The center over a store ────────────────────────────────────────────── */

@Component({
  selector: 'sl-iec-jobs',
  standalone: true,
  imports: [
    SlButton,
    SlImportExportCenter,
    SlImportExportCenterActions,
    SlImportExportCenterFooter,
    SlImportExportJobActions,
    SlLink,
  ],
  template: `<section
    slImportExportCenter
    [locale]="locale()"
    timeZone="America/Sao_Paulo"
    [jobs]="store.jobs()"
    [now]="now"
    [size]="size()"
    [level]="level()"
    [growing]="growing()"
    [hasMore]="hasMore()"
    [loading]="loading()"
    [status]="status()"
    [timeFormat]="timeFormat()"
    [views]="viewList()"
    [defaultExpanded]="expanded()"
    [defaultView]="startView()"
    (cancelRequest)="store.cancel($event.key)"
    (removeRequest)="store.remove($event.keys)"
    (retryRequest)="store.retry($event.key)"
  >
    @if (actions()) {
      <div slImportExportCenterActions>
        <button slButton size="sm" tone="secondary" variant="outline" type="button">
          Importar
        </button>
        <button slButton size="sm" tone="secondary" variant="outline" type="button">
          Exportar
        </button>
      </div>
    }
    @if (share()) {
      <ng-template slImportExportJobActions let-job>
        @if (job.direction === 'export') {
          <a slLink href="#partilhar" underline="hover">Partilhar</a>
        }
      </ng-template>
    }
    @if (footer()) {
      <div slImportExportCenterFooter>
        <a slLink href="#jobs" underline="hover">Ver todos os jobs</a>
      </div>
    }
  </section>`,
})
class JobsDemo {
  readonly seed = input('all');
  readonly live = input(true);
  readonly size = input<ImportExportCenterSize | undefined>(undefined);
  readonly level = input<ImportExportCenterLevel | undefined>(undefined);
  readonly growing = input<ImportExportCenterGrowing | undefined>(undefined);
  readonly timeFormat = input<ImportExportCenterTimeFormat | undefined>(undefined);
  readonly hasMore = input(false);
  readonly loading = input(false);
  readonly status = input<ImportExportCenterStatus>('ready');
  readonly strip = input(true);
  readonly expanded = input<readonly string[] | undefined>(undefined);
  readonly startView = input<string | undefined>(undefined);
  readonly actions = input(false);
  readonly footer = input(false);
  readonly share = input(false);
  readonly locale = input('pt-BR');

  readonly now = NOW;
  readonly store = new JobStore([], { live: () => this.live() });
  readonly viewList = computed<readonly ImportExportView[] | undefined>(() =>
    this.strip() ? undefined : [],
  );

  constructor() {
    queueMicrotask(() => this.store.reseed(SEEDS[this.seed()] ?? JOBS));
  }
}

@Component({
  selector: 'sl-iec-views',
  standalone: true,
  imports: [SlImportExportCenter],
  template: `<section
    slImportExportCenter
    locale="pt-BR"
    [jobs]="view() === 'mine' ? mine : all"
    [now]="now"
    [views]="views"
    [(view)]="view"
    (viewRequest)="refuseArchived($event)"
  ></section>`,
})
class ViewsDemo {
  readonly now = NOW;
  readonly all = JOBS;
  readonly mine = JOBS.filter((job) => job.actor === 'Marina Duarte');
  readonly view = signal<string | undefined>('all');
  readonly views: readonly ImportExportView[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Minhas', value: 'mine' },
    { label: 'Arquivados', value: 'archived' },
  ];

  refuseArchived(request: ChangeRequest<string | undefined>) {
    if (request.value === 'archived') request.cancel();
  }
}

@Component({
  selector: 'sl-iec-intake',
  standalone: true,
  imports: [
    SlButton,
    SlDialog,
    SlDialogBody,
    SlDialogClose,
    SlDialogDescription,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogTrigger,
    SlField,
    SlFieldLabel,
    SlImportExportCenter,
    SlImportExportCenterActions,
    SlRadio,
    SlRadioGroup,
    SlStack,
    SlTextField,
    SlTextFieldInput,
    SlUpload,
  ],
  template: `<section
      slImportExportCenter
      locale="pt-BR"
      [jobs]="store.jobs()"
      [views]="[]"
      (removeRequest)="store.remove($event.keys)"
      (retryRequest)="store.retry($event.key)"
    >
      <div slImportExportCenterActions>
        <button
          slButton
          size="sm"
          tone="secondary"
          variant="outline"
          type="button"
          [slDialogTrigger]="importer"
        >
          Importar
        </button>
        <button
          slButton
          size="sm"
          tone="secondary"
          variant="outline"
          type="button"
          [slDialogTrigger]="exporter"
        >
          Exportar
        </button>
      </div>
    </section>
    <sl-dialog #importer="slDialog">
      <header slDialogHeader>
        <h2 slDialogTitle>Import contacts</h2>
        <p slDialogDescription>
          CSV or XLSX, up to 20 MB. The file uploads and the job appears in the list.
        </p>
        <button slDialogClose></button>
      </header>
      <div slDialogBody>
        <div slUpload accept=".csv,.xlsx" label="Contacts file" [adapter]="send"></div>
      </div>
    </sl-dialog>
    <sl-dialog #exporter="slDialog">
      <header slDialogHeader>
        <h2 slDialogTitle>Export active customers</h2>
        <p slDialogDescription>The file stays available for seven days.</p>
        <button slDialogClose></button>
      </header>
      <div slDialogBody>
        <div slStack [gap]="5">
          <div
            slRadioGroup
            aria-label="Formato"
            orientation="horizontal"
            [value]="format()"
            (valueChange)="format.set($event.value ?? 'csv')"
          >
            <div slRadio value="csv">CSV</div>
            <div slRadio value="xlsx">XLSX</div>
          </div>
          <div slField>
            <label slFieldLabel>Nome do arquivo</label>
            <div slTextField>
              <input slTextFieldInput [value]="name()" (input)="rename($event)" />
            </div>
          </div>
        </div>
      </div>
      <footer slDialogFooter>
        <button slButton size="sm" type="button" (click)="queueExport(); exporter.close()">
          Exportar
        </button>
      </footer>
    </sl-dialog>`,
})
class IntakeDemo {
  readonly store = new JobStore(jobsOf(['invoices-q3', 'debtors']));
  readonly format = signal('csv');
  readonly name = signal('active-customers');
  private sequence = 0;

  readonly send = (file: File, context: UploadContext) =>
    new Promise<void>((resolve, reject) => {
      let loaded = 0;
      const timer = setInterval(() => {
        if (context.signal.aborted) {
          clearInterval(timer);
          reject(context.signal.reason);
          return;
        }
        loaded = Math.min(file.size, loaded + Math.max(1, file.size / 6));
        context.progress(loaded, file.size);
        if (loaded >= file.size) {
          clearInterval(timer);
          this.store.add({
            createdAt: new Date().toISOString(),
            direction: 'import',
            format: file.name.split('.').pop()?.toUpperCase(),
            key: this.next(),
            progress: { max: 1200, value: 0 },
            source: { name: file.name, size: file.size },
            stage: 'Validating rows',
            status: 'running',
            title: 'Imported contacts',
          });
          resolve();
        }
      }, 250);
    });

  rename(event: Event) {
    this.name.set((event.target as HTMLInputElement).value);
  }

  queueExport() {
    this.store.add({
      createdAt: new Date().toISOString(),
      direction: 'export',
      format: this.format().toUpperCase(),
      key: this.next(),
      status: 'queued',
      title: `Active customers (${this.name()}.${this.format()})`,
    });
  }

  private next() {
    this.sequence += 1;
    return `job-${this.sequence}-${Date.now()}`;
  }
}

@Component({
  selector: 'sl-iec-toasts',
  standalone: true,
  imports: [SlButton, SlImportExportCenter, SlStack, SlToastRegion],
  providers: [SlToastService],
  template: `<div slStack [gap]="5">
      <div class="slotted-demo-viewport" data-size="tall">
        <sl-toast-region attach="inline" placement="bottom-end" />
      </div>
      <section
        slImportExportCenter
        #center="slImportExportCenter"
        locale="pt-BR"
        [jobs]="store.jobs()"
        [views]="[]"
      ></section>
    </div>
    <ng-template #view let-message>
      <button
        slButton
        size="sm"
        tone="secondary"
        variant="outline"
        type="button"
        (click)="reveal(message)"
      >
        Ver
      </button>
    </ng-template>`,
})
class ToastsDemo {
  readonly store = new JobStore(jobsOf(['stock-september', 'invoices-q3']));
  private readonly center = viewChild.required<SlImportExportCenter>('center');
  private readonly view =
    viewChild.required<TemplateRef<{ $implicit: ToastMessage<ToastContent> }>>('view');
  private readonly toasts = inject(SlToastService);

  constructor() {
    jobToasts(this.store.jobs, { actions: () => this.view() });
  }

  reveal(message: ToastMessage<ToastContent>) {
    const key = (message.data.data as JobToastData | undefined)?.key;
    if (key === undefined) return;
    this.toasts.dismiss(message.id, 'pointer');
    this.center().reveal(key);
  }
}

@Component({
  selector: 'sl-iec-popover',
  standalone: true,
  imports: [
    SlButton,
    SlImportExportCenter,
    SlImportExportCenterFooter,
    SlLink,
    SlPopover,
    SlPopoverContent,
    SlPopoverLayer,
    SlPopoverTrigger,
  ],
  template: `<ng-container slPopover side="bottom" align="end" size="lg" [portal]="false">
    <button slButton slPopoverTrigger tone="secondary" variant="outline" type="button">
      {{ active() > 0 ? 'Jobs (' + active() + ')' : 'Jobs' }}
    </button>
    <ng-template slPopoverLayer>
      <div slPopoverContent aria-label="Imports and exports">
        <section
          slImportExportCenter
          level="3"
          locale="pt-BR"
          size="sm"
          [jobs]="store.jobs()"
          [views]="[]"
          (cancelRequest)="store.cancel($event.key)"
          (removeRequest)="store.remove($event.keys)"
          (retryRequest)="store.retry($event.key)"
        >
          <div slImportExportCenterFooter>
            <a slLink href="#jobs" underline="hover">Ver todos os jobs</a>
          </div>
        </section>
      </div>
    </ng-template>
  </ng-container>`,
})
class PopoverDemo {
  readonly store = new JobStore(jobsOf(['crm-contacts', 'invoices-q3', 'debtors']));
  readonly active = computed(
    () =>
      this.store.jobs().filter((job) => job.status === 'running' || job.status === 'queued').length,
  );
}

@Component({
  selector: 'sl-iec-provided',
  standalone: true,
  imports: [SlImportExportCenter],
  providers: [
    provideImportExportCenterDefaults({ level: '3', size: 'sm', timeFormat: 'absolute' }),
  ],
  template: `<section slImportExportCenter [size]="size()" [jobs]="jobs" [now]="now"></section>`,
})
class ProvidedDemo {
  readonly size = input<ImportExportCenterSize | undefined>(undefined);
  readonly jobs = jobsOf(['invoices-q3', 'debtors']);
  readonly now = NOW;
}

/* ── The page ───────────────────────────────────────────────────────────── */

interface StoryArgs {
  size?: ImportExportCenterSize;
  level?: ImportExportCenterLevel;
  growing?: ImportExportCenterGrowing;
  timeFormat?: ImportExportCenterTimeFormat;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_IMPORT_EXPORT_CENTER_DOCS.importExportCenter.scenes, {
    playground: Playground,
    anatomy: Anatomy,
    statuses: Statuses,
    progress: Progress,
    errors: Errors,
    files: Files,
    views: Views,
    intake: Intake,
    toasts: Toasts,
    hosts: Hosts,
    loading: Loading,
    empty: Empty,
    sizes: Sizes,
    content: Content,
    defaults: Defaults,
    accessibility: Accessibility,
  });

const meta: Meta<StoryArgs> = {
  title: 'Components/ImportExportCenter',
  decorators: [
    moduleMetadata({
      imports: [
        SlImportExportCenter,
        JobsDemo,
        ViewsDemo,
        IntakeDemo,
        ToastsDemo,
        PopoverDemo,
        ProvidedDemo,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Import / Export Center',
        description:
          'The jobs an application runs away from the page — imports and exports — with their status, progress, rows that failed, files that expire, and every change a request the store answers. The same family in a popover under the top bar and on a page of its own, and a toast in the shell that points at the job.',
        framework: 'Angular',
        ...ANGULAR_IMPORT_EXPORT_CENTER_DOCS.importExportCenter,
        tokens: ANGULAR_IMPORT_EXPORT_CENTER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  args: { size: 'md', level: '2', growing: 'none', timeFormat: 'relative' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: jobs(
      '[actions]="true" [size]="size" [level]="level" [growing]="growing" [timeFormat]="timeFormat"',
    ),
  }),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => ({
    template: grid(
      scene(
        'Every part, written out',
        'Header with its count, clear and two actions; the strip; a running import; the catalogue with its details open; more; a footer link.',
        jobs(
          '[actions]="true" [footer]="true" growing="button" [hasMore]="true" [live]="false" [expanded]="[\'catalog-autumn\']"',
        ),
      ),
    ),
  }),
};

export const Statuses: Story = {
  parameters: scenario('statuses'),
  render: () => ({
    template: grid(
      scene(
        'Queued, running, success, partial, failed, cancelled',
        'Each state has its word, its mark and its tone; the catalogue is partial because its counts say twelve rows failed.',
        jobs('[live]="false" [strip]="false"'),
      ),
    ),
  }),
};

export const Progress: Story = {
  parameters: scenario('progress'),
  render: () => ({
    template: grid(
      scene(
        'Rows, bytes, a percentage, and no value at all',
        "The first job carries the server's eta; the store moves the others, and the family estimates their time after three updates.",
        jobs('seed="progress" [strip]="false"'),
      ),
    ),
  }),
};

export const Errors: Story = {
  parameters: scenario('errors'),
  render: () => ({
    template: grid(
      scene(
        'A sample of 1.284 failed rows',
        "The report is the job's download; the table holds the five rows the store sent and says so.",
        jobs('seed="sampled" [live]="false" [strip]="false" [expanded]="[\'catalog-autumn\']"'),
      ),
    ),
  }),
};

export const Files: Story = {
  parameters: scenario('files'),
  render: () => ({
    template: grid(
      scene(
        'Expired, denied, available',
        'The expired export offers Gerar novamente; the import says why its original cannot be downloaded; the invoices say until when.',
        jobs(
          'seed="files" timeFormat="absolute" [live]="false" [strip]="false" [expanded]="[\'wholesale-prices\']"',
        ),
      ),
    ),
  }),
};

export const Views: Story = {
  parameters: scenario('views'),
  render: () => ({
    template: grid(
      scene(
        'Built in: by direction',
        'All, Imports and Exports; the family filters the direction itself.',
        jobs('[live]="false"'),
      ) +
        scene(
          'The consumer’s views, two-way',
          'Minhas is the consumer’s query; Arquivados is refused in viewRequest, so the strip stays where it was.',
          '<sl-iec-views></sl-iec-views>',
        ),
    ),
  }),
};

export const Intake: Story = {
  parameters: scenario('intake'),
  render: () => ({
    template: grid(
      scene(
        'Upload in a dialog, and an export dialog',
        'Drop a CSV into Importar: upload sends it and the store creates the running job. Exportar queues one.',
        '<sl-iec-intake></sl-iec-intake>',
      ),
    ),
  }),
};

export const Toasts: Story = {
  parameters: scenario('toasts'),
  render: () => ({
    template: grid(
      scene(
        'Started, then finished, in one toast',
        'The queued export starts and its toast appears; when it finishes the same toast changes. View reveals the job below.',
        '<sl-iec-toasts></sl-iec-toasts>',
      ),
    ),
  }),
};

export const Hosts: Story = {
  parameters: scenario('hosts'),
  render: () => ({
    template: grid(
      scene(
        'In a popover under the top bar',
        'size sm, the rank below the page, and a footer link to the whole page.',
        '<sl-iec-popover></sl-iec-popover>',
      ) +
        scene(
          'On a page',
          'size md; from 42rem the states and the controls line up in one column down the list.',
          jobs('[actions]="true"'),
        ),
    ),
  }),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => ({
    template: grid(
      scene(
        'Nothing yet',
        'Three skeleton jobs in the boxes the jobs will occupy; the list is busy.',
        jobs('seed="none" [loading]="true" [strip]="false"'),
      ) +
        scene(
          'The next page',
          'With jobs shown, more says Carregando and refuses a second press.',
          jobs(
            'seed="finished" growing="button" [hasMore]="true" [loading]="true" [live]="false" [strip]="false"',
          ),
        ),
    ),
  }),
};

export const Empty: Story = {
  parameters: scenario('empty'),
  render: () => ({
    template: grid(
      scene(
        'An empty view',
        "The view's own words, from messages.emptyExports and emptyDescription.",
        jobs('seed="none" startView="export"'),
      ) +
        scene(
          'A list that failed to load',
          'status error: the page whose control emits reloadRequest.',
          jobs('seed="none" status="error" [strip]="false"'),
        ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: grid(
      scene(
        'sm',
        "The popover's step: smaller type and insets, and a floor width.",
        jobs('seed="pair" size="sm" [live]="false" [strip]="false"'),
      ) +
        scene(
          'md',
          "The page's step, with the same two jobs.",
          jobs('seed="pair" size="md" [live]="false" [strip]="false"'),
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: grid(
      scene(
        'Long, translated and unbroken',
        "The title wraps, the file name keeps .csv, the stage ends in an ellipsis, the Arabic name reads in its own direction, and the export has the consumer's Partilhar.",
        jobs('seed="long" [share]="true" [live]="false" [strip]="false"'),
      ),
    ),
  }),
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => ({
    template: grid(
      scene(
        'From the provider',
        'Absolute times, the third rank and the sm step, set once for the subtree by provideImportExportCenterDefaults; the words come from the language in force.',
        '<sl-iec-provided></sl-iec-provided>',
      ) +
        scene(
          'A center that states its own',
          "size md on the center wins over the provider's sm.",
          '<sl-iec-provided size="md"></sl-iec-provided>',
        ),
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: grid(
      scene(
        'Tab, cancel, remove',
        'Tab to Cancel CRM Contacts and press it: focus stays in the job. Remove a job: focus goes to the same control of the next.',
        jobs('[live]="false"'),
      ),
    ),
  }),
};
