import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { ImportExportJob } from '@slotted/core/import-export-center';
import type { UploadContext } from '@slotted/core/upload';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';

import { Button } from '../button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../dialog';
import { Field, FieldLabel } from '../field';
import { Grid, Scene } from '../field/field-demo';
import { Link } from '../link';
import { Popover, PopoverContent, PopoverLayer, PopoverTrigger } from '../popover';
import { Radio, RadioGroup } from '../radio-group';
import { Stack } from '../stack';
import { TextField } from '../text-field';
import { createToaster, ToasterProvider, ToastRegion } from '../toast';
import { Upload } from '../upload';
import { ImportExportCenter } from './import-export-center';
import { ImportExportCenterDefaultsProvider } from './import-export-center-defaults';
import { FILE_JOBS, Jobs, JOBS, NOW, useJobStore } from './import-export-center-demo';
import {
  REACT_IMPORT_EXPORT_CENTER_DOCS,
  REACT_IMPORT_EXPORT_CENTER_TOKENS,
} from './import-export-center.docs';
import type {
  ImportExportCenterHandle,
  ImportExportCenterProps,
} from './import-export-center.types';
import { useJobToasts } from './use-job-toasts';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_IMPORT_EXPORT_CENTER_DOCS.importExportCenter.scenes, {
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

const meta = {
  title: 'Components/ImportExportCenter',
  component: ImportExportCenter,
  args: { jobs: JOBS },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Import / Export Center',
        description:
          'The jobs an application runs away from the page — imports and exports — with their status, progress, rows that failed, files that expire, and every change a request the store answers. The same family in a popover under the top bar and on a page of its own, and a toast in the shell that points at the job.',
        framework: 'React',
        ...REACT_IMPORT_EXPORT_CENTER_DOCS.importExportCenter,
        tokens: REACT_IMPORT_EXPORT_CENTER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof ImportExportCenter>;

export default meta;
type Story = StoryObj<typeof meta>;

function SeeAll() {
  return (
    <Link href="#jobs" underline="hover">
      Ver todos os jobs
    </Link>
  );
}

function HeaderActions() {
  return (
    <>
      <Button size="sm" tone="secondary" variant="outline">
        Importar
      </Button>
      <Button size="sm" tone="secondary" variant="outline">
        Exportar
      </Button>
    </>
  );
}

const byKey = (keys: readonly string[]) => JOBS.filter((job) => keys.includes(job.key));

export const Playground: Story = {
  args: { size: 'md', level: '2', growing: 'none', timeFormat: 'relative', loading: false },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <Jobs actions={<HeaderActions />} {...(args as Partial<ImportExportCenterProps>)} />
  ),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Every part, written out"
        note="Header with its count, clear and two actions; the strip; a running import; the catalogue with its details open; more; a footer link."
      >
        <Jobs
          actions={<HeaderActions />}
          defaultExpanded={['catalog-autumn']}
          footer={<SeeAll />}
          growing="button"
          hasMore
          live={false}
        />
      </Scene>
    </Grid>
  ),
};

export const Statuses: Story = {
  parameters: scenario('statuses'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Queued, running, success, partial, failed, cancelled"
        note="Each state has its word, its mark and its tone; the catalogue is partial because its counts say twelve rows failed."
      >
        <Jobs live={false} views={[]} />
      </Scene>
    </Grid>
  ),
};

const PROGRESS_JOBS: readonly ImportExportJob[] = [
  {
    direction: 'import',
    eta: new Date(NOW + 170_000).toISOString(),
    format: 'CSV',
    key: 'rows',
    progress: { max: 5000, value: 1204 },
    stage: 'Writing records',
    status: 'running',
    title: 'Contacts from CRM — rows and server deadline',
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
    title: 'Open orders — no total',
  },
];

export const Progress: Story = {
  parameters: scenario('progress'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Rows, bytes, a percentage, and no value at all"
        note="The first job carries the server's eta; the store moves the others, and the family estimates their time after three updates."
      >
        <Jobs seed={PROGRESS_JOBS} views={[]} />
      </Scene>
    </Grid>
  ),
};

const SAMPLED: readonly ImportExportJob[] = byKey(['catalog-autumn']).map((job) => ({
  ...job,
  counts: { ...job.counts, failed: 1284 },
  errorCount: 1284,
}));

export const Errors: Story = {
  parameters: scenario('errors'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A sample of 1.284 failed rows"
        note="The report is the job's download; the table holds the five rows the store sent and says so."
      >
        <Jobs defaultExpanded={['catalog-autumn']} live={false} seed={SAMPLED} views={[]} />
      </Scene>
    </Grid>
  ),
};

export const Files: Story = {
  parameters: scenario('files'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Expired, denied, available"
        note="The expired export offers Gerar novamente; the import says why its original cannot be downloaded; the invoices say until when."
      >
        <Jobs
          defaultExpanded={['wholesale-prices']}
          live={false}
          seed={FILE_JOBS}
          timeFormat="absolute"
          views={[]}
        />
      </Scene>
    </Grid>
  ),
};

function ControlledViews() {
  const [view, setView] = useState('all');
  const mine = JOBS.filter((job) => job.actor === 'Marina Duarte');
  return (
    <Stack gap={3}>
      <ImportExportCenter
        jobs={view === 'mine' ? mine : JOBS}
        locale="pt-BR"
        now={NOW}
        onViewChange={(next, request) => {
          if (next === 'archived') request.cancel();
          else setView(next);
        }}
        view={view}
        views={[
          { label: 'Todos', value: 'all' },
          { label: 'Minhas', value: 'mine' },
          { label: 'Arquivados', value: 'archived' },
        ]}
      />
    </Stack>
  );
}

export const Views: Story = {
  parameters: scenario('views'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Built in: by direction"
        note="All, Imports and Exports; the family filters the direction itself."
      >
        <Jobs live={false} />
      </Scene>
      <Scene
        label="The consumer's views, controlled"
        note="Minhas is the consumer's query; Arquivados is refused with request.cancel()."
      >
        <ControlledViews />
      </Scene>
    </Grid>
  ),
};

/** Sends the bytes the way a real adapter would report them, then answers. */
function sendFile(onDone: (file: File) => void) {
  return (file: File, context: UploadContext) =>
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
          onDone(file);
          resolve();
        }
      }, 250);
    });
}

function IntakeCentre() {
  const store = useJobStore(byKey(['invoices-q3', 'debtors']));
  const [format, setFormat] = useState('csv');
  const [name, setName] = useState('active-customers');
  let sequence = store.jobs.length;
  const next = () => `job-${(sequence += 1)}-${Date.now()}`;

  return (
    <ImportExportCenter
      actions={
        <>
          <Dialog>
            <DialogTrigger
              render={(props) => (
                <Button {...props} size="sm" tone="secondary" variant="outline">
                  Importar
                </Button>
              )}
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import contacts</DialogTitle>
                <DialogDescription>
                  CSV or XLSX, up to 20 MB. The file uploads and the job appears in the list.
                </DialogDescription>
                <DialogClose />
              </DialogHeader>
              <DialogBody>
                <Upload
                  accept=".csv,.xlsx"
                  adapter={sendFile((file) =>
                    store.add({
                      createdAt: new Date().toISOString(),
                      direction: 'import',
                      format: file.name.split('.').pop()?.toUpperCase(),
                      key: next(),
                      progress: { max: 1200, value: 0 },
                      source: { name: file.name, size: file.size },
                      stage: 'Validating rows',
                      status: 'running',
                      title: 'Imported contacts',
                    }),
                  )}
                  label="Contacts file"
                />
              </DialogBody>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger
              render={(props) => (
                <Button {...props} size="sm" tone="secondary" variant="outline">
                  Exportar
                </Button>
              )}
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export active customers</DialogTitle>
                <DialogDescription>The file stays available for seven days.</DialogDescription>
                <DialogClose />
              </DialogHeader>
              <DialogBody>
                <Stack gap={5}>
                  <RadioGroup
                    aria-label="Formato"
                    onValueChange={(value) => setFormat(value)}
                    orientation="horizontal"
                    value={format}
                  >
                    <Radio value="csv">CSV</Radio>
                    <Radio value="xlsx">XLSX</Radio>
                  </RadioGroup>
                  <Field>
                    <FieldLabel>Nome do arquivo</FieldLabel>
                    <TextField onChange={(event) => setName(event.target.value)} value={name} />
                  </Field>
                </Stack>
              </DialogBody>
              <DialogFooter>
                <DialogClose
                  render={(props) => (
                    <Button
                      {...props}
                      onClick={(event) => {
                        props.onClick?.(event);
                        store.add({
                          createdAt: new Date().toISOString(),
                          direction: 'export',
                          format: format.toUpperCase(),
                          key: next(),
                          status: 'queued',
                          title: `Active customers (${name}.${format})`,
                        });
                      }}
                      size="sm"
                    >
                      Exportar
                    </Button>
                  )}
                />
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      }
      jobs={store.jobs}
      locale="pt-BR"
      onRemove={({ keys }) => store.remove(keys)}
      onRetry={(key) => store.retry(key)}
      views={[]}
    />
  );
}

export const Intake: Story = {
  parameters: scenario('intake'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Upload in a dialog, and an export dialog"
        note="Drop a CSV into Importar: upload sends it and the store creates the running job. Exportar queues one."
      >
        <IntakeCentre />
      </Scene>
    </Grid>
  ),
};

function ToastShell() {
  const [toaster] = useState(() => createToaster());
  const store = useJobStore(byKey(['stock-september', 'invoices-q3']));
  const centre = useRef<ImportExportCenterHandle>(null);
  useJobToasts(store.jobs, { onView: (key) => centre.current?.reveal(key), toaster });
  return (
    <ToasterProvider value={toaster}>
      <Stack gap={5}>
        <div className="slotted-demo-viewport" data-size="tall">
          <ToastRegion attach="inline" placement="bottom-end" />
        </div>
        <ImportExportCenter jobs={store.jobs} locale="pt-BR" ref={centre} views={[]} />
      </Stack>
    </ToasterProvider>
  );
}

export const Toasts: Story = {
  parameters: scenario('toasts'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Started, then finished, in one toast"
        note="The queued export starts and its toast appears; when it finishes the same toast changes. View reveals the job below."
      >
        <ToastShell />
      </Scene>
    </Grid>
  ),
};

function PopoverHost() {
  const store = useJobStore(byKey(['crm-contacts', 'invoices-q3', 'debtors']));
  const active = store.jobs.filter(
    (job) => job.status === 'running' || job.status === 'queued',
  ).length;
  return (
    <Popover align="end" portal={false} side="bottom" size="lg">
      <PopoverTrigger
        render={(props) => (
          <Button {...props} tone="secondary" variant="outline">
            {active > 0 ? `Jobs (${active})` : 'Jobs'}
          </Button>
        )}
      />
      <PopoverLayer>
        <PopoverContent aria-label="Imports and exports">
          <ImportExportCenter
            footer={<SeeAll />}
            jobs={store.jobs}
            level="3"
            locale="pt-BR"
            onCancel={(key) => store.cancel(key)}
            onRemove={({ keys }) => store.remove(keys)}
            onRetry={(key) => store.retry(key)}
            size="sm"
            views={[]}
          />
        </PopoverContent>
      </PopoverLayer>
    </Popover>
  );
}

export const Hosts: Story = {
  parameters: scenario('hosts'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="In a popover under the top bar"
        note="size sm, the rank below the page, and a footer link to the whole page."
      >
        <PopoverHost />
      </Scene>
      <Scene
        label="On a page"
        note="size md; from 42rem the states and the controls line up in one column down the list."
      >
        <Jobs actions={<HeaderActions />} />
      </Scene>
    </Grid>
  ),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Nothing yet"
        note="Three skeleton jobs in the boxes the jobs will occupy; the list is busy."
      >
        <ImportExportCenter jobs={[]} loading views={[]} />
      </Scene>
      <Scene
        label="The next page"
        note="With jobs shown, more says Carregando and refuses a second press."
      >
        <Jobs
          growing="button"
          hasMore
          live={false}
          loading
          seed={byKey(['invoices-q3', 'debtors'])}
          views={[]}
        />
      </Scene>
    </Grid>
  ),
};

export const Empty: Story = {
  parameters: scenario('empty'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="An empty view"
        note="The view's own words, from messages.emptyExports and emptyDescription."
      >
        <ImportExportCenter defaultView="export" jobs={[]} />
      </Scene>
      <Scene
        label="A list that failed to load"
        note="status error: the page whose control asks onReload."
      >
        <ImportExportCenter jobs={[]} onReload={() => undefined} status="error" views={[]} />
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={1}>
      <Scene label="sm" note="The popover's step: smaller type and insets, and a floor width.">
        <Jobs live={false} seed={byKey(['crm-contacts', 'invoices-q3'])} size="sm" views={[]} />
      </Scene>
      <Scene label="md" note="The page's step.">
        <Jobs live={false} seed={byKey(['crm-contacts', 'invoices-q3'])} size="md" views={[]} />
      </Scene>
    </Grid>
  ),
};

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
    stage: 'Validating the cross-references between cost centers and the chart of accounts',
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

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Long, translated and unbroken"
        note="The title wraps, the file name keeps .csv, the stage ends in an ellipsis, the Arabic name reads in its own direction, and the export has the consumer's Partilhar."
      >
        <Jobs
          live={false}
          renderJobActions={(job) =>
            job.direction === 'export' ? (
              <Link href="#partilhar" underline="hover">
                Partilhar
              </Link>
            ) : null
          }
          seed={LONG}
          views={[]}
        />
      </Scene>
    </Grid>
  ),
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => (
    <ImportExportCenterDefaultsProvider level="3" size="sm" timeFormat="absolute">
      <Grid columns={1}>
        <Scene
          label="From the provider"
          note="Absolute times, the third rank and the sm step, set once for the subtree; the words come from the language in force."
        >
          <Jobs live={false} locale="en-US" seed={byKey(['invoices-q3', 'debtors'])} />
        </Scene>
        <Scene
          label="A centre that states its own"
          note="size md on the centre wins over the provider's sm."
        >
          <Jobs live={false} locale="en-US" seed={byKey(['invoices-q3', 'debtors'])} size="md" />
        </Scene>
      </Grid>
    </ImportExportCenterDefaultsProvider>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Tab, cancel, remove"
        note="Tab to Cancel Contacts from CRM and press it: focus stays in the job. Remove a job: focus goes to the same control of the next."
      >
        <Jobs live={false} />
      </Scene>
    </Grid>
  ),
};
