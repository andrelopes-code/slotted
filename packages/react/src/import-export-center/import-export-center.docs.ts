import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import importExportCenterTokens from '@slotted/styles/import-export-center/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_IMPORT_EXPORT_CENTER_TOKENS = importExportCenterTokens.map((name) => ({
  name,
  purpose: 'Theme-owned ImportExportCenter decision',
}));

const imports: ReferenceImport = {
  source:
    "import { ImportExportCenter, ImportExportCenterDefaultsProvider, useJobToasts } from '@slotted/react';",
};

type AnatomyTuple = readonly [string, string, boolean, string];
const anatomyRows = (rows: readonly AnatomyTuple[]): AnatomyRow[] =>
  rows.map(([part, element, required, purpose]) => ({ part, element, required, purpose }));

const anatomy: AnatomyRow[] = anatomyRows([
  [
    'root',
    'section, or the element render returns',
    true,
    'The region, named by the title unless the consumer names it. It carries data-ui, the axes as data attributes, data-loading and data-status="error", and it is the container every width decision reads.',
  ],
  [
    'header',
    'div',
    true,
    'The row above the views: the title on the start side, the tools at the end. A tool that wraps lands at the end of the next line.',
  ],
  [
    'title',
    'h2, h3 or h4 per level',
    true,
    'The title message, the words the region and the list are named by, with the count after them.',
  ],
  [
    'count',
    'span',
    false,
    'How many jobs are queued or running, in the accent pair and tabular figures. Absent at nought.',
  ],
  [
    'tools',
    'div',
    false,
    'The family’s clear and the consumer’s actions, one group that wraps as one so the title keeps its line.',
  ],
  [
    'clear',
    'span around a Button',
    false,
    'The ghost Button that asks onRemove for every finished, removable job of the view, with the reason clear. Absent when none is finished.',
  ],
  [
    'actions',
    'div',
    false,
    'The consumer’s own controls, from actions: an Importar button that opens a dialog holding upload, an Exportar button that opens the format dialog.',
  ],
  [
    'views',
    'div around a Tabs list',
    false,
    'The strip over views — tabs with its list alone and no track, every tab naming the list with aria-controls. Absent when views holds one entry.',
  ],
  [
    'list',
    'ul',
    true,
    'The jobs, named by the title, aria-busy while loading, tabindex="-1" so focus can land on it when the last job leaves.',
  ],
  [
    'job',
    'li',
    false,
    'One job, carrying data-key, data-direction, data-status, data-outcome once finished, data-expired and data-expanded. Below 42rem the tile and a column of words; from 42rem a row of the list’s grid.',
  ],
  [
    'visual',
    'span, aria-hidden',
    false,
    'The file-kind tile: the kind’s color from upload’s File kind scale and the kind’s glyph knocked out of it, so a CSV is the same tile in the field it was chosen from and in the job that imports it.',
  ],
  [
    'body',
    'div',
    false,
    'The column that shrinks: heading, status, progress, summary and message. From 42rem it lets its parts into the job’s grid.',
  ],
  ['heading', 'div', false, 'The job’s name and the line of what it is about.'],
  [
    'job-title',
    'a when job.href, span otherwise',
    false,
    'The job’s name, and the second half of every control’s accessible name. The span takes tabindex="-1" so reveal() and a withdrawn control can land on it.',
  ],
  [
    'meta',
    'p',
    false,
    'Direction, format, the file, its size, the actor and the time, each a plain span in the line’s direction; a drawn dot between two items is clipped at the start of a wrapped line.',
  ],
  [
    'file-name',
    'span dir="auto"',
    false,
    'The name and its extension as one bidi-isolated run in the name’s own direction.',
  ],
  ['name', 'span', false, 'The stem, shrinking to an ellipsis before the extension.'],
  ['extension', 'span', false, 'The last dot and what follows it, which does not shrink.'],
  [
    'time',
    'time',
    false,
    'datetime holds the ISO value; the words are relative — 3 h ago — with the absolute reading in title, or absolute under timeFormat="absolute". finishedAt once finished, createdAt before.',
  ],
  [
    'status',
    'div',
    false,
    'A grid of two columns: the mark, and the words beside it. The words never wrap under the mark. Its id describes every control of the job.',
  ],
  [
    'mark',
    'span, aria-hidden',
    false,
    'An Icon with the status glyph — clock, circle-check, circle-alert, circle-x, circle — or spinner while running, the line’s own size, centerd on the band between the cap height and the x-height.',
  ],
  [
    'status-label',
    'span',
    false,
    'The word for the state — Completed with 12 errors — and the stage after it, one run that wraps inside its column.',
  ],
  [
    'stage',
    'span',
    false,
    'The consumer’s phrase for the phase, in the muted voice, on one line ending in an ellipsis; the whole phrase is in title and in the DOM.',
  ],
  [
    'progress',
    'div',
    false,
    'While running: progress-indicator at its small step, named by the job title, indeterminate without a value, and the text under it.',
  ],
  [
    'progress-text',
    'span',
    false,
    'Processed of total in the job’s unit, the percentage, and the time left — the server’s eta, or the family’s estimate after three updates over five seconds.',
  ],
  [
    'summary',
    'p',
    false,
    'The counts of a finished job in one line: processed of total, created, updated, skipped.',
  ],
  [
    'message',
    'p',
    false,
    'The job’s message — why it failed — in the outcome’s tone; otherwise the deadline or the denial of its result in the muted voice.',
  ],
  [
    'controls',
    'div',
    false,
    'What jobControls returns, in order: download or retry, cancel, toggle, the consumer’s job-actions, remove at the far end. Under the status column from 42rem.',
  ],
  [
    'download',
    'span around a ButtonLink or a Button',
    false,
    'A ButtonLink with download when the file has an href, a Button that asks onDownload when it has none. Download errors when the file is the report of a partial import.',
  ],
  ['cancel', 'span around a Button', false, 'Asks onCancel. Absent under cancelable: false.'],
  [
    'retry',
    'span around a Button',
    false,
    'Asks onRetry: Tentar de novo after a failure or a cancel, Gerar novamente on an export whose result expired.',
  ],
  [
    'toggle',
    'span around a Button',
    false,
    'The Disclosure button: Detalhes in both states, aria-expanded and aria-controls the details. Present only when the job has a count, a file or a failed row.',
  ],
  [
    'chevron',
    'span in the button’s end slot',
    false,
    'An Icon with chevron-down, turning half a turn while the details are shown.',
  ],
  [
    'job-actions',
    'span',
    false,
    'What renderJobActions returns for the job, after the family’s controls. Absent when it returns nothing.',
  ],
  [
    'remove',
    'button',
    false,
    'The family’s icon button, named Remove from history by aria-label and a tooltip, described by the job title. Only on a finished job.',
  ],
  [
    'details',
    'div role="region"',
    false,
    'What the toggle shows, named by the toggle: counts, files and failed rows, on the sunken ground with the family’s rule.',
  ],
  [
    'counts',
    'dl',
    false,
    'Total, processed, created, updated, skipped and failed, in that order, leaving out what the job does not state.',
  ],
  [
    'files',
    'ul',
    false,
    'The original file, the result and the report of failed rows, each with its availability.',
  ],
  [
    'file',
    'li',
    false,
    'One file: its role, its name, its size, its deadline or denial, and a download while it is available. data-availability says which.',
  ],
  [
    'errors',
    'div around a Table',
    false,
    'The rows that failed — row, message, column, value — in a framed table whose box scrolls past sixteen rem.',
  ],
  [
    'errors-note',
    'p',
    false,
    'Mostrando 50 de 12.000 when errorCount is larger than the rows sent.',
  ],
  [
    'more',
    'button',
    false,
    'growing="button" with hasMore: asks onLoadMore; says Carregando and refuses a second press while loading.',
  ],
  [
    'empty',
    'div',
    false,
    'In place of the list when the view has nothing: a result-state with the view’s words, or empty.',
  ],
  [
    'error',
    'div',
    false,
    'status="error": a result-state with the control that asks onReload, in place of the list.',
  ],
  ['footer', 'div', false, 'The consumer’s footer: the link from a popover to the whole page.'],
]);

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Six jobs of Vale Norte Distribuidora over a store that answers every request, and a server that moves the running import forward. Cancel it, retry the failed export, open the catalogue’s details, remove a finished job, and watch the queued export start when the import ends.',
    snippet: defineSnippet({
      id: 'import-export-center-react-playground',
      language: 'tsx',
      label: 'The center over a store',
      source: `<ImportExportCenter
  jobs={jobs}
  onCancel={(key) => cancel(key)}
  onRemove={({ keys }) => remove(keys)}
  onRetry={(key) => retry(key)}
/>;`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, written out',
    note: 'The header with its count, clear and the consumer’s two actions; the strip; a running job with its bar; a partial import with its details open — counts, the original file, the report and the failed rows; growing by button; a footer. Every part the contract names, in one box.',
    snippet: defineSnippet({
      id: 'import-export-center-react-anatomy',
      language: 'tsx',
      label: 'The parts, in one center',
      source: `<ImportExportCenter
  actions={<ImportActions />}
  defaultExpanded={['catalog-autumn']}
  footer={<Link href="/jobs">Ver todos os jobs</Link>}
  growing="button"
  hasMore
  jobs={jobs}
/>;`,
    }),
  },
  {
    id: 'statuses',
    title: 'Five statuses, four outcomes',
    note: 'Queued, running, succeeded, succeeded with failed rows, failed and cancelled, each with its word, its mark and its tone. The partial row is derived: the store wrote succeeded and counts.failed 12, and the family refused to paint it green.',
    snippet: defineSnippet({
      id: 'import-export-center-react-statuses',
      language: 'tsx',
      label: 'A partial job is derived, not written',
      source: `const catalog: ImportExportJob = {
  counts: { failed: 12, processed: 2988, total: 3000 },
  direction: 'import',
  key: 'catalog-autumn',
  status: 'succeeded',
  title: 'Product catalog',
};`,
    }),
  },
  {
    id: 'progress',
    title: 'Progress, in the job’s unit',
    note: 'Rows with a percentage and the server’s eta; bytes in the size scale; a bare percentage; an indeterminate bar that says only its stage; and a job whose time left the family estimates from the updates it saw. The bar is progress-indicator at its small step and says nothing aloud.',
    snippet: defineSnippet({
      id: 'import-export-center-react-progress',
      language: 'tsx',
      label: 'Units, eta and indeterminate',
      source: `const jobs: ImportExportJob[] = [
  { ...rows, eta: '2026-09-25T14:03:00Z', progress: { max: 5000, value: 1204 } },
  { ...bytes, progress: { max: 10_000_000, unit: 'bytes', value: 2_500_000 } },
  { ...waiting, progress: {}, stage: 'Preparando o arquivo' },
];`,
    }),
  },
  {
    id: 'errors',
    title: 'Rows that failed',
    note: 'A partial import with its details open: the counts, the report download as the job’s primary control, and a table of the rows the store sent — the message second, so it stays in view when the table scrolls sideways — with Mostrando 5 de 1.284 because the store sent a sample.',
    snippet: defineSnippet({
      id: 'import-export-center-react-errors',
      language: 'tsx',
      label: 'A sample of failed rows',
      source: `const catalog: ImportExportJob = {
  ...job,
  errorCount: 1284,
  errors: firstPage,
  errorsFile: { href: '/imports/481/errors.csv', name: 'catalogo-erros.csv' },
};`,
    }),
  },
  {
    id: 'files',
    title: 'Deadlines and permission',
    note: 'An export whose file expired offers Generate again in place of Download and says when it expired; an export still available says until when; an import whose original the reader may not download says why in the consumer’s words, and draws no control for it.',
    snippet: defineSnippet({
      id: 'import-export-center-react-files',
      language: 'tsx',
      label: 'Expiry and denial',
      source: `const result: JobFile = { expiresAt: '2026-09-08T10:00:00Z', href, name: 'invoices.zip' };
const source: JobFile = {
  denied: 'Only the person who imported the file or an administrator can download the original.',
  name: 'wholesale-prices.csv',
};`,
    }),
  },
  {
    id: 'views',
    title: 'Views',
    note: 'The built-in All, Imports and Exports, filtered by direction; below, the consumer’s own views — Mine is the consumer’s query, so the family shows the jobs it is given — held in the consumer’s state, which refuses Archived with request.cancel().',
    snippet: defineSnippet({
      id: 'import-export-center-react-views',
      language: 'tsx',
      label: 'The consumer’s views, controlled',
      source: `<ImportExportCenter
  jobs={view === 'mine' ? mine : jobs}
  onViewChange={(next, request) => {
    if (next === 'archived') request.cancel();
    else setView(next);
  }}
  view={view}
  views={views}
/>;`,
    }),
  },
  {
    id: 'intake',
    title: 'Starting a job',
    note: 'Importar opens a dialog with upload as its dropzone; its adapter sends the bytes and the store creates the job, which appears at the top of the list. Exportar opens a dialog with the format and the file name. The center starts nothing itself and never transfers a byte.',
    snippet: defineSnippet({
      id: 'import-export-center-react-intake',
      language: 'tsx',
      label: 'Import through upload, export through a dialog',
      source: `<ImportExportCenter
  actions={
    <>
      <ImportDialog onUploaded={(file) => store.createImport(file)} />
      <ExportDialog onConfirm={(format) => store.createExport(format)} />
    </>
  }
  jobs={store.jobs}
/>;`,
    }),
  },
  {
    id: 'toasts',
    title: 'The toast points at the job',
    note: 'useJobToasts in the shell raises one toast per job when it starts and replaces it when it finishes, under the job’s key; View reveals the job in the center — details open, title focused. The toast carries no progress, no cancel and no download.',
    snippet: defineSnippet({
      id: 'import-export-center-react-toasts',
      language: 'tsx',
      label: 'Toasts from the shell',
      source: `useJobToasts(jobs, {
  onView: (key) => {
    navigate('/jobs');
    center.current?.reveal(key);
  },
});`,
    }),
  },
  {
    id: 'hosts',
    title: 'In a popover, on a page',
    note: 'The same jobs in a popover under the top bar, at size sm with a footer link to the page, and on the page at md, where from 42rem every job is a row of one grid and the states line up in one column.',
    snippet: defineSnippet({
      id: 'import-export-center-react-hosts',
      language: 'tsx',
      label: 'The popover and the page',
      source: `<Popover>
  <PopoverTrigger render={(props) => <Button {...props}>Jobs</Button>} />
  <PopoverLayer>
    <PopoverContent aria-label="Imports and exports">
      <ImportExportCenter footer={<SeeAll />} jobs={jobs} size="sm" />
    </PopoverContent>
  </PopoverLayer>
</Popover>;`,
    }),
  },
  {
    id: 'loading',
    title: 'The first wait, and the next page',
    note: 'Three skeleton jobs with the anatomy of a job — the tile, the name, the meta line — stand in the boxes the jobs will occupy while the list is busy; with jobs already shown, more says Carregando and refuses a second press.',
    snippet: defineSnippet({
      id: 'import-export-center-react-loading',
      language: 'tsx',
      label: 'Loading with and without jobs',
      source: `<ImportExportCenter jobs={[]} loading />;
<ImportExportCenter growing="button" hasMore jobs={jobs} loading />;`,
    }),
  },
  {
    id: 'empty',
    title: 'Nothing yet, and a list that failed',
    note: 'An empty view draws the view’s own words — No exports — or the consumer’s empty; a list the store could not load draws the error page whose control asks onReload.',
    snippet: defineSnippet({
      id: 'import-export-center-react-empty',
      language: 'tsx',
      label: 'Empty and error',
      source: `<ImportExportCenter defaultView="export" jobs={[]} />;
<ImportExportCenter jobs={[]} onReload={() => refetch()} status="error" />;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Two sizes',
    note: 'sm for the popover and the drawer: the small type steps, tighter insets, a floor width so a panel sized to its content does not collapse; md for the page. The controls keep the button family’s small step in both.',
    snippet: defineSnippet({
      id: 'import-export-center-react-sizes',
      language: 'tsx',
      label: 'sm and md',
      source: `<ImportExportCenter jobs={jobs} size="sm" />;
<ImportExportCenter jobs={jobs} size="md" />;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A title of fourteen words, a file name of ninety characters that keeps its extension, an Arabic report in a left-to-right page, a stage longer than the line, a million rows, and a job with the consumer’s own action.',
    snippet: defineSnippet({
      id: 'import-export-center-react-content',
      language: 'tsx',
      label: 'Long, translated and unbroken',
      source: `<ImportExportCenter
  jobs={jobs}
  renderJobActions={(job) =>
    job.direction === 'export' ? <Link href={shareUrl(job)}>Partilhar</Link> : null
  }
/>;`,
    }),
  },
  {
    id: 'defaults',
    title: 'Defaults, once',
    note: 'ImportExportCenterDefaultsProvider sets the size, the rank, the time format and the zone for a whole application — here with absolute times; the second center states size="md" itself and wins. The words and the locale come from SlottedProvider.',
    snippet: defineSnippet({
      id: 'import-export-center-react-defaults',
      language: 'tsx',
      label: 'An application’s defaults',
      source: `<ImportExportCenterDefaultsProvider level="3" size="sm" timeFormat="absolute">
  <App />
</ImportExportCenterDefaultsProvider>;`,
    }),
  },
  {
    id: 'accessibility',
    title: 'Keyboard and focus',
    note: 'Tab through the controls: every one is named by its words and the job — Cancel Contacts from CRM. Press Cancel: the job ends, the control leaves, and focus stays in the job on its first control. Remove a job: focus goes to the same control of the job in its place.',
    snippet: defineSnippet({
      id: 'import-export-center-react-accessibility',
      language: 'tsx',
      label: 'Focus that never falls to the body',
      source: `<ImportExportCenter
  jobs={jobs}
  onCancel={(key) => cancel(key)}
  onRemove={({ keys }) => remove(keys)}
/>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onViewChange',
    payload: '(view: string, request: ChangeRequest<string>)',
    when: 'Before the view moves: a tab (pointer, keyboard) or reveal() of a job the view hides (programmatic). cancel() refuses the move.',
  },
  {
    name: 'onExpandedChange',
    payload: '(keys: readonly string[], request: ChangeRequest<readonly string[]>)',
    when: 'Before a job’s details show or hide: the toggle (pointer, keyboard) or reveal() (programmatic). A key that leaves jobs leaves an uncontrolled set on the next render.',
  },
  {
    name: 'onCancel',
    payload: '(key: string, request: { reason, source, cancelled, cancel() })',
    when: 'When the reader presses Cancelar on a queued or running job — reasons pointer, keyboard. The store stops the job and answers by changing its status.',
  },
  {
    name: 'onRetry',
    payload: '(key: string, request)',
    when: 'When the reader presses Tentar de novo or Gerar novamente — reasons pointer, keyboard.',
  },
  {
    name: 'onRemove',
    payload: '({ keys }, request)',
    when: 'When the reader presses remove on a finished job (pointer, keyboard) or clear in the header (clear, with every finished removable key of the view).',
  },
  {
    name: 'onDownload',
    payload: '({ key, file }, request)',
    when: 'Before a download — the primary control or a file in the details; file is source, result or errors. With an href the link navigates unless cancelled; without one the consumer produces the file here.',
  },
  {
    name: 'onOpen',
    payload: '(key: string, request)',
    when: 'Before the title’s link navigates to job.href — reasons pointer, keyboard; cancel() keeps the reader here.',
  },
  {
    name: 'onLoadMore',
    payload: '(request)',
    when: 'When the reader presses more — reasons pointer, keyboard. Not while loading.',
  },
  {
    name: 'onReload',
    payload: '(request)',
    when: 'When the reader presses the error page’s control under status="error" — reasons pointer, keyboard.',
  },
  {
    name: 'useJobToasts(jobs, { toaster, onView, messages })',
    payload: 'a hook; onView(key)',
    when: 'On every change of jobs after the first: one toast per job that started, finished, finished with failed rows or failed, under the id import-export-center:<key>. View calls onView.',
  },
];

export const REACT_IMPORT_EXPORT_CENTER_DOCS = {
  importExportCenter: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'jobs',
        'readonly ImportExportJob[]',
        '—',
        'ImportExportCenter',
        'The consumer’s jobs: key, direction, title, status, format, stage, progress, eta, counts, errors, errorCount, message, source, result, errorsFile, actor, createdAt, finishedAt, href, cancelable, retryable, removable. The family changes none of them',
      ],
      [
        'view',
        'string',
        'all',
        'ImportExportCenter',
        'Present means the consumer owns the view. all shows every job, import and export filter by direction, any other value shows what the consumer gave',
      ],
      [
        'defaultView',
        'string',
        '—',
        'ImportExportCenter',
        'The view an uncontrolled center starts on, read once',
      ],
      [
        'views',
        'readonly { value, label }[]',
        'all, import, export',
        'ImportExportCenter',
        'The strip’s entries; one entry draws no strip',
      ],
      [
        'expanded',
        'readonly string[]',
        '—',
        'ImportExportCenter',
        'Present means the consumer owns which jobs show their details',
      ],
      [
        'defaultExpanded',
        'readonly string[]',
        '—',
        'ImportExportCenter',
        'The keys an uncontrolled center starts with shown, read once',
      ],
      [
        'size',
        "'sm' | 'md'",
        'md',
        'ImportExportCenter, ImportExportCenterDefaultsProvider',
        'sm for a popover or a drawer, with a floor width; md for a page',
      ],
      [
        'level',
        "'2' | '3' | '4'",
        '2',
        'ImportExportCenter, ImportExportCenterDefaultsProvider',
        'The rank of the title’s heading',
      ],
      [
        'growing',
        "'none' | 'button'",
        'none',
        'ImportExportCenter, ImportExportCenterDefaultsProvider',
        'Whether the history grows by a more button; the button is drawn while hasMore',
      ],
      [
        'hasMore',
        'boolean',
        'false',
        'ImportExportCenter',
        'Whether another page of history exists',
      ],
      [
        'timeFormat',
        "'relative' | 'absolute'",
        'relative',
        'ImportExportCenter, ImportExportCenterDefaultsProvider',
        'How createdAt and finishedAt are written. A deadline is always a date',
      ],
      [
        'status',
        "'ready' | 'error'",
        'ready',
        'ImportExportCenter',
        'error replaces the list with the page whose control asks onReload',
      ],
      [
        'loading',
        'boolean',
        'false',
        'ImportExportCenter',
        'aria-busy on the list and data-loading on the root; skeleton jobs while nothing is loaded, more waiting otherwise',
      ],
      [
        'locale, timeZone, now',
        'string, string, number',
        'the language in force, the runtime’s zone',
        'ImportExportCenter (all three), ImportExportCenterDefaultsProvider (timeZone)',
        'What numbers, sizes, times and deadlines are written with, and the moment they count from. State now for a stable server render',
      ],
      [
        'messages',
        'Partial<ImportExportCenterMessages>',
        '—',
        'ImportExportCenter, useJobToasts',
        'Words laid over the language in force, key by key: every word the family writes, the announcer says and a toast shows',
      ],
      [
        'actions, empty, footer',
        'ReactNode',
        '—',
        'ImportExportCenter',
        'The consumer’s header controls; the view’s empty page; the footer',
      ],
      [
        'renderJobActions',
        '(job) => ReactNode',
        '—',
        'ImportExportCenter',
        'The consumer’s controls for one job, after the family’s',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'ImportExportCenter',
        'Substitutes the root element and hands it every attribute, the ref callback included',
      ],
      [
        'ref',
        'Ref<ImportExportCenterHandle>',
        '—',
        'ImportExportCenter',
        'element; focus(), on the first job’s first control; reveal(key), which shows the job’s details, returns to all if the view hides it, scrolls it into view and focuses its title',
      ],
      [
        'ImportExportCenterDefaultsProvider',
        '{ size, level, growing, timeFormat, timeZone }',
        '—',
        'a subtree',
        'The decisions an application takes once. A center that states any of them itself still wins',
      ],
      [
        'native props',
        'ComponentPropsWithRef<"section">',
        '—',
        'ImportExportCenter',
        'aria-*, data-*, className, style and handlers reach the section; a consumer’s aria-label or aria-labelledby replaces the title wiring',
      ],
    ]),
    accessibility: [
      'No WAI-ARIA Authoring Practices pattern covers a job center, so the platform is the pattern: the root is a section named by its heading, the jobs a native ul of li, every control a real button or link. The toggle follows the Disclosure pattern (w3.org/WAI/ARIA/apg/patterns/disclosure/): Enter and Space show and hide the details, aria-expanded says which, aria-controls names the region the details are, and the words stay Details in both states.',
      'Every control of a job is named by its own words and the job title — aria-labelledby holds both ids, so a reader hears Download Q3 Invoices and not five Download in a row — and described by the job’s status line. The remove control is an icon, so its name is aria-label and a tooltip shows the same words on hover, on keyboard focus and on a press held on touch.',
      'A job reaching another state is announced once, politely, through the shared live announcer — Import CRM Contacts completed with 12 errors — and nothing is said on the first render or while the bar moves; the bar is a progressbar named by the job title with the progress text as aria-valuetext for a reader who asks. A toast from useJobToasts carries the same sentence, which the announcer does not repeat.',
      'Focus never falls to the body. A job that finishes while focus is on Cancel keeps focus in the job, on its first remaining control or on its title; a removed job hands focus to the same control of the job now in its place, then of the one before, then to the list — focusDestination in @slotted/core/import-export-center decides it for both bindings.',
      'Color never says a state alone: the outcome has a word and a mark as well as a tone, every mark a circle or a clock, and partial is a warning with its failed-row count in the words. Under forced colors the tile keeps its square as an edge, the marks draw in the system’s ink, and a running mark that turns stops under reduced motion while the bar still says how far the job is.',
    ],
    snippets: [
      defineSnippet({
        id: 'import-export-center-react-dom',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<section
  data-ui="import-export-center"
  data-part="root"
  data-size="md"
  data-level="2"
  data-growing="none"
  data-time-format="relative"
  data-view="all"
  aria-labelledby=":r1:-title"
>
  <div data-part="header">
    <h2 data-part="title" id=":r1:-title">
      Imports and exports <span data-part="count">1 in progress</span>
    </h2>
    <div data-part="tools">
      <span data-part="clear">…</span>
      <div data-part="actions">…</div>
    </div>
  </div>
  <div data-part="views">…</div>
  <ul data-part="list" aria-labelledby=":r1:-title" tabIndex={-1}>
    <li
      data-part="job"
      data-key="catalog"
      data-direction="import"
      data-status="succeeded"
      data-outcome="partial"
    >
      <span data-part="visual" data-kind="spreadsheet" aria-hidden="true">
        …
      </span>
      <div data-part="body">
        <div data-part="heading">
          <span data-part="job-title" id=":r1:-catalog-title">
            Product catalog
          </span>
          <p data-part="meta">…</p>
        </div>
        <div data-part="status" id=":r1:-catalog-status">
          <span data-part="mark" aria-hidden="true">
            …
          </span>
          <span data-part="status-label">Completed with 12 errors</span>
        </div>
        <p data-part="summary">…</p>
      </div>
      <div data-part="controls">
        <span data-part="download">…</span>
        <span data-part="toggle">…</span>
        <button data-part="remove" aria-label="Remove from history" />
      </div>
    </li>
  </ul>
</section>;`,
      }),
      defineSnippet({
        id: 'import-export-center-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='import-export-center'] {
  --slotted-import-export-center-inset-inline-md: var(--slotted-space-7);
  --slotted-import-export-center-border: var(--slotted-border-strong);
  --slotted-import-export-center-status-column: 18rem;
  --slotted-import-export-center-errors-max-block-size: 24rem;
}`,
      }),
    ],
  },
} as const;
