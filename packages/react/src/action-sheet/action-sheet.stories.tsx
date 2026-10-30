import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Archive,
  Bell,
  CircleCheck,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Trash2,
  Upload,
  UserPlus,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '../button';
import { Grid, Scene } from '../field/field-demo';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '../menu';
import { Text } from '../typography';
import { ActionSheet } from './action-sheet';
import { ActionSheetDefaultsProvider } from './action-sheet-defaults';
import { Layer } from './action-sheet-demo';
import {
  ActionSheetCancel,
  ActionSheetContent,
  ActionSheetGroup,
  ActionSheetHeader,
  ActionSheetItem,
  ActionSheetList,
  ActionSheetMessage,
  ActionSheetSeparator,
  ActionSheetTitle,
  ActionSheetTrigger,
} from './action-sheet-parts';
import { REACT_ACTION_SHEET_DOCS, REACT_ACTION_SHEET_TOKENS } from './action-sheet.docs';
import type { ActionSheetProps, ActionSheetTone } from './action-sheet.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_ACTION_SHEET_DOCS['action-sheet'].scenes, {
    playground: Playground,
    destructive: Destructive,
    groups: Groups,
    content: Content,
    loading: Loading,
    modal: Modal,
    policy: Policy,
    focus: Focus,
    result: Result,
    responsive: Responsive,
    defaults: Defaults,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/ActionSheet',
  component: ActionSheet,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'ActionSheet',
        description:
          'A short list of actions that rises from the bottom edge, and the explicit way out beneath it. A dialog holding a menu: the keyboard of a menu, the modality of a dialog, the item vocabulary of menu, and a close request that says which action was chosen.',
        framework: 'React',
        ...REACT_ACTION_SHEET_DOCS['action-sheet'],
        tokens: REACT_ACTION_SHEET_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof ActionSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * What a sheet that stands open to be looked at has to say for itself: it is
 * not modal, takes no focus and cannot be dismissed. A modal layer writes
 * `inert` up to the document root and locks the scroll, and a reference page
 * holding several would be a page nobody can use — the lesson `drawer`'s page
 * recorded. A scene that exists to be operated opens from a trigger instead.
 * Not modal also means no scrim, which is this family's rule.
 */
const STILL = {
  defaultOpen: true,
  escape: 'none',
  initialFocus: false,
  modal: false,
  outsidePress: 'none',
} as const satisfies Partial<ActionSheetProps>;

/** The report page every scene opens its sheet over. */
function Page({ children }: { children?: ReactNode }) {
  return (
    <div className="slotted-demo-page">
      <Text size="lg" weight="semibold">
        Quarterly report · Q3 2026
      </Text>
      <Text size="sm" tone="muted">
        Receita de R$ 4,82 mi, margem bruta de 38,4 %, partilhado com a equipa financeira.
      </Text>
      {children}
    </div>
  );
}

function ShareList() {
  return (
    <ActionSheetList>
      <ActionSheetItem icon={<Copy size="1em" />} value="copy">
        Copy link
      </ActionSheetItem>
      <ActionSheetItem
        description="Can comment, cannot edit"
        icon={<UserPlus size="1em" />}
        value="invite"
      >
        Convidar pessoas
      </ActionSheetItem>
      <ActionSheetItem icon={<FileText size="1em" />} value="pdf">
        Descarregar PDF
      </ActionSheetItem>
      <ActionSheetItem icon={<ExternalLink size="1em" />} value="open">
        Open in browser
      </ActionSheetItem>
    </ActionSheetList>
  );
}

function ShareHeader() {
  return (
    <ActionSheetHeader>
      <ActionSheetTitle>Share report</ActionSheetTitle>
      <ActionSheetMessage>Anyone who receives the link sees today's version.</ActionSheetMessage>
    </ActionSheetHeader>
  );
}

/** The application's own Button as the trigger, through `render`. */
function Trigger({ children }: { children: ReactNode }) {
  return (
    <ActionSheetTrigger
      render={({ children: label, ref, ...props }) => (
        <Button {...props} ref={ref as never} size="sm">
          {label}
        </Button>
      )}
    >
      {children}
    </ActionSheetTrigger>
  );
}

export const Playground: Story = {
  parameters: scenario('playground'),
  render: () => (
    <Layer>
      {(container) => (
        <ActionSheet container={container}>
          <Page>
            <Trigger>Partilhar</Trigger>
          </Page>
          <ActionSheetContent>
            <ShareHeader />
            <ShareList />
            <ActionSheetCancel>Cancelar</ActionSheetCancel>
          </ActionSheetContent>
        </ActionSheet>
      )}
    </Layer>
  ),
};

export const Destructive: Story = {
  parameters: scenario('destructive'),
  render: () => (
    <Layer>
      {(container) => (
        <ActionSheet container={container} {...STILL}>
          <div className="slotted-demo-page">
            <Text size="lg" weight="semibold">
              Nova mensagem
            </Text>
            <Text size="sm" tone="muted">
              Para: financeiro@exemplo.pt · Assunto: fecho do trimestre
            </Text>
          </div>
          <ActionSheetContent>
            <ActionSheetHeader>
              <ActionSheetTitle>Descartar a mensagem?</ActionSheetTitle>
            </ActionSheetHeader>
            <ActionSheetList>
              <ActionSheetItem tone="danger" value="delete">
                Delete draft
              </ActionSheetItem>
              <ActionSheetItem value="save">Save draft</ActionSheetItem>
            </ActionSheetList>
            <ActionSheetCancel>Cancel</ActionSheetCancel>
          </ActionSheetContent>
        </ActionSheet>
      )}
    </Layer>
  ),
};

function InvoiceList() {
  return (
    <ActionSheetList>
      <ActionSheetGroup label="Send">
        <ActionSheetItem icon={<Bell size="1em" />} value="remind">
          Remind the customer
        </ActionSheetItem>
        <ActionSheetItem
          description="Available after approval"
          disabled
          icon={<Upload size="1em" />}
          value="accounting"
        >
          Send to accounting
        </ActionSheetItem>
      </ActionSheetGroup>
      <ActionSheetSeparator />
      <ActionSheetGroup label="Estado">
        <ActionSheetItem icon={<CircleCheck size="1em" />} tone="success" value="paid">
          Marcar como paga
        </ActionSheetItem>
        <ActionSheetItem icon={<Archive size="1em" />} tone="secondary" value="archive">
          Arquivar
        </ActionSheetItem>
        <ActionSheetItem
          description="The number is not reused"
          icon={<Trash2 size="1em" />}
          tone="danger"
          value="void"
        >
          Void invoice
        </ActionSheetItem>
      </ActionSheetGroup>
    </ActionSheetList>
  );
}

export const Groups: Story = {
  parameters: scenario('groups'),
  render: () => (
    <Layer>
      {(container) => (
        <ActionSheet container={container} {...STILL}>
          <Page />
          <ActionSheetContent>
            <ActionSheetHeader>
              <ActionSheetTitle>Invoice 4471 · Atlantic Distribution</ActionSheetTitle>
            </ActionSheetHeader>
            <InvoiceList />
            <ActionSheetCancel>Cancelar</ActionSheetCancel>
          </ActionSheetContent>
        </ActionSheet>
      )}
    </Layer>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Layer>
      {(container) => (
        <ActionSheet container={container} {...STILL}>
          <Page />
          <ActionSheetContent>
            <ActionSheetHeader>
              <ActionSheetTitle>
                Actions available for order 88213 from customer Atlantic Distribution
              </ActionSheetTitle>
              <ActionSheetMessage>
                Changes are recorded in the history and sent to the warehouse on the next sync.
              </ActionSheetMessage>
            </ActionSheetHeader>
            <ActionSheetList>
              <ActionSheetItem value="resend">
                Resend the order confirmation to the billing address
              </ActionSheetItem>
              <ActionSheetItem
                description="Until the warehouse dispatch, scheduled for tomorrow at 9 AM"
                value="address"
              >
                Change the delivery address
              </ActionSheetItem>
              <ActionSheetItem value="copy-ref">
                Copiar ENC-2026-0000088213-ATLANTICA-PT-LISBOA-NORTE
              </ActionSheetItem>
              <ActionSheetItem value="split">Split into two shipments</ActionSheetItem>
              <ActionSheetItem value="note">Add internal note</ActionSheetItem>
              <ActionSheetItem value="print">Print waybill</ActionSheetItem>
              <ActionSheetItem tone="danger" value="cancel-order">
                Cancelar encomenda
              </ActionSheetItem>
            </ActionSheetList>
            <ActionSheetCancel>Close</ActionSheetCancel>
          </ActionSheetContent>
        </ActionSheet>
      )}
    </Layer>
  ),
};

function LoadingSheet({ container }: { container: Element }) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);

  const run = (value: string) => {
    setExporting(value);
    window.setTimeout(() => {
      setExporting(null);
      setDone((list) => [...list, value]);
    }, 1600);
  };

  return (
    <ActionSheet container={container} {...STILL} closeOnSelect={false}>
      <Page>
        <Text size="sm" tone="muted">
          {done.length === 0 ? 'No file prepared.' : `Prepared: ${done.join(', ')}.`}
        </Text>
      </Page>
      <ActionSheetContent>
        <ActionSheetHeader>
          <ActionSheetTitle>Exportar</ActionSheetTitle>
        </ActionSheetHeader>
        <ActionSheetList>
          <ActionSheetItem
            description={exporting === 'pdf' ? 'Preparing 14 pages' : '14 pages'}
            icon={<FileText size="1em" />}
            loading={exporting === 'pdf'}
            onSelect={() => run('pdf')}
            value="pdf"
          >
            Descarregar PDF
          </ActionSheetItem>
          <ActionSheetItem
            icon={<FileSpreadsheet size="1em" />}
            loading={exporting === 'xlsx'}
            onSelect={() => run('xlsx')}
            value="xlsx"
          >
            Download spreadsheet
          </ActionSheetItem>
        </ActionSheetList>
        <ActionSheetCancel>Cancelar</ActionSheetCancel>
      </ActionSheetContent>
    </ActionSheet>
  );
}

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => <Layer>{(container) => <LoadingSheet container={container} />}</Layer>,
};

export const Modal: Story = {
  parameters: scenario('modal'),
  render: () => (
    <Grid columns={2}>
      <Scene label="modal (default)" note="Scrim, inert page, locked scroll.">
        <Layer>
          {(container) => (
            <ActionSheet container={container}>
              <Page>
                <Trigger>Partilhar</Trigger>
              </Page>
              <ActionSheetContent>
                <ShareHeader />
                <ShareList />
                <ActionSheetCancel>Cancelar</ActionSheetCancel>
              </ActionSheetContent>
            </ActionSheet>
          )}
        </Layer>
      </Scene>
      <Scene label="modal={false}" note="No scrim; the page stays operable.">
        <Layer>
          {(container) => (
            <ActionSheet container={container} {...STILL}>
              <div className="slotted-demo-page">
                <Text size="lg" weight="semibold">
                  Delivery map
                </Text>
                <Button size="sm" tone="secondary" variant="outline">
                  Rota seguinte
                </Button>
              </div>
              <ActionSheetContent aria-label="Route 12">
                <ActionSheetList aria-label="Route 12">
                  <ActionSheetItem value="navigate">Start navigation</ActionSheetItem>
                  <ActionSheetItem value="call">Call the driver</ActionSheetItem>
                </ActionSheetList>
              </ActionSheetContent>
            </ActionSheet>
          )}
        </Layer>
      </Scene>
    </Grid>
  ),
};

function PolicySheet({ container }: { container: Element }) {
  const [log, setLog] = useState<string[]>([]);
  return (
    <ActionSheet
      back="none"
      container={container}
      escape="none"
      onOpenChange={(next, request) =>
        setLog((lines) => [...lines.slice(-2), `${next ? 'open' : 'close'} · ${request.reason}`])
      }
      outsidePress="none"
    >
      <Page>
        <Trigger>Share</Trigger>
        <Text size="sm" tone="muted">
          {log.length === 0 ? 'No requests yet.' : log.join(' → ')}
        </Text>
      </Page>
      <ActionSheetContent>
        <ShareHeader />
        <ShareList />
        <ActionSheetCancel>Cancelar</ActionSheetCancel>
      </ActionSheetContent>
    </ActionSheet>
  );
}

export const Policy: Story = {
  parameters: scenario('policy'),
  render: () => <Layer>{(container) => <PolicySheet container={container} />}</Layer>,
};

function FocusSheet({ container }: { container: Element }) {
  const composer = useRef<HTMLButtonElement | null>(null);
  return (
    <ActionSheet container={container} finalFocus={composer}>
      <div className="slotted-demo-page">
        <Text size="lg" weight="semibold">
          Nova mensagem
        </Text>
        <Trigger>Discard…</Trigger>
        <Button ref={composer} size="sm" tone="secondary" variant="outline">
          Back to text
        </Button>
      </div>
      <ActionSheetContent>
        <ActionSheetHeader>
          <ActionSheetTitle>Descartar a mensagem?</ActionSheetTitle>
        </ActionSheetHeader>
        <ActionSheetList>
          <ActionSheetItem tone="danger" value="delete">
            Delete draft
          </ActionSheetItem>
          <ActionSheetItem value="save">Save draft</ActionSheetItem>
        </ActionSheetList>
        <ActionSheetCancel>Cancel</ActionSheetCancel>
      </ActionSheetContent>
    </ActionSheet>
  );
}

export const Focus: Story = {
  parameters: scenario('focus'),
  render: () => <Layer>{(container) => <FocusSheet container={container} />}</Layer>,
};

function ResultSheet({ container }: { container: Element }) {
  const [open, setOpen] = useState(false);
  const [said, setSaid] = useState('No action chosen.');
  return (
    <ActionSheet
      container={container}
      onOpenChange={(next, request) => {
        setOpen(next);
        if (!next) {
          setSaid(
            request.reason === 'select'
              ? `reason: select · result: ${request.result ?? '—'}`
              : `reason: ${request.reason} · sem resultado`,
          );
        }
      }}
      open={open}
    >
      <Page>
        <Trigger>Invoice 4471</Trigger>
        <Text size="sm" tone="muted">
          {said}
        </Text>
      </Page>
      <ActionSheetContent>
        <ActionSheetHeader>
          <ActionSheetTitle>Invoice 4471</ActionSheetTitle>
        </ActionSheetHeader>
        <InvoiceList />
        <ActionSheetCancel>Cancelar</ActionSheetCancel>
      </ActionSheetContent>
    </ActionSheet>
  );
}

export const Result: Story = {
  parameters: scenario('result'),
  render: () => <Layer>{(container) => <ResultSheet container={container} />}</Layer>,
};

/** One array of actions, the shape both families take. */
const ACTIONS: readonly {
  value: string;
  children: string;
  description?: string;
  tone?: ActionSheetTone;
  disabled?: boolean;
}[] = [
  { value: 'duplicate', children: 'Duplicate' },
  { value: 'move', children: 'Move to…', description: 'Finance folder' },
  { value: 'lock', children: 'Lock editing', disabled: true },
  { value: 'delete', children: 'Delete', tone: 'danger' },
];

export const Responsive: Story = {
  parameters: scenario('responsive'),
  render: () => (
    <Grid columns={2}>
      <Scene label="pointer: fine → menu" note="The same array as menu items.">
        <div className="slotted-demo-page">
          <Menu>
            <MenuTrigger>More</MenuTrigger>
            <MenuContent aria-label="Actions">
              {ACTIONS.map((action) => (
                <MenuItem key={action.value} {...action} />
              ))}
            </MenuContent>
          </Menu>
        </div>
      </Scene>
      <Scene label="pointer: coarse → action sheet" note="The same array as sheet actions.">
        <Layer>
          {(container) => (
            <ActionSheet container={container} {...STILL}>
              <Page />
              <ActionSheetContent aria-label="Actions">
                <ActionSheetList aria-label="Actions">
                  {ACTIONS.map((action) => (
                    <ActionSheetItem key={action.value} {...action} />
                  ))}
                </ActionSheetList>
                <ActionSheetCancel />
              </ActionSheetContent>
            </ActionSheet>
          )}
        </Layer>
      </Scene>
    </Grid>
  ),
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => (
    <ActionSheetDefaultsProvider closeOnSelect={false}>
      <Layer>
        {(container) => (
          <ActionSheet container={container} {...STILL}>
            <Page />
            <ActionSheetContent>
              <ShareHeader />
              <ShareList />
              <ActionSheetCancel />
            </ActionSheetContent>
          </ActionSheet>
        )}
      </Layer>
    </ActionSheetDefaultsProvider>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Layer>
      {(container) => (
        <ActionSheet container={container}>
          <Page>
            <Trigger>Invoice 4471</Trigger>
          </Page>
          <ActionSheetContent>
            <ActionSheetHeader>
              <ActionSheetTitle>Invoice 4471</ActionSheetTitle>
            </ActionSheetHeader>
            <InvoiceList />
            <ActionSheetCancel>Cancelar</ActionSheetCancel>
          </ActionSheetContent>
        </ActionSheet>
      )}
    </Layer>
  ),
};
