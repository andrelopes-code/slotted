import { CalendarDays, ClipboardList, Pill, Stethoscope, Users } from 'lucide-react';
import type { ReactNode } from 'react';

import { Avatar } from '../../avatar';
import { Button } from '../../button';
import { Field, FieldLabel } from '../../field';
import { Page, PageBody } from '../../page';
import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderSubheading,
  PageHeaderTitle,
  PageHeaderTitleArea,
  PageHeaderTitleRow,
} from '../../page-header';
import { TextField } from '../../text-field';
import { Text } from '../../typography';
import {
  AppShell,
  AppShellActions,
  AppShellAside,
  AppShellAsideBody,
  AppShellAsideFooter,
  AppShellAsideHeader,
  AppShellAsideToggle,
  AppShellBanner,
  AppShellBrand,
  AppShellCenter,
  AppShellMain,
  AppShellNav,
  AppShellNavBody,
  AppShellNavFooter,
  AppShellNavHeader,
  AppShellNavToggle,
} from '../index';
import type { AppShellProps } from '../app-shell.types';
import { NavAccount, NavColumn, Viewport, Wordmark } from './shared';
import type { Destination } from './shared';

/**
 * Atrium: a clinic's front desk. The navigation on the end of the line and
 * overlaid at every width, the pane on the start holding a form rather than a
 * record, and labels a receptionist reads at arm's length. It is the product
 * that proves the overlay, the mirror and the pane as a layer.
 */

const DESTINATIONS: readonly Destination[] = [
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'utentes', label: 'Utentes', icon: Users },
  { id: 'consultas', label: 'Appointments', icon: Stethoscope, count: 9 },
  { id: 'receitas', label: 'Prescriptions', icon: Pill },
  { id: 'registos', label: 'Clinical records', icon: ClipboardList },
];

interface Slot {
  readonly time: string;
  readonly patient: string;
  readonly kind: string;
}

const AGENDA: readonly Slot[] = [
  { time: '09:00', patient: 'Carl Ames', kind: 'Routine visit' },
  { time: '09:30', patient: 'Beth Lewis', kind: 'First visit' },
  { time: '10:00', patient: 'Joan Mason', kind: 'Follow-up' },
  { time: '10:30', patient: '—', kind: 'Opening' },
  { time: '11:00', patient: 'Tom Rice', kind: 'Routine visit' },
  { time: '11:30', patient: 'Ivy Cooper', kind: 'Tests' },
  { time: '14:00', patient: '—', kind: 'Opening' },
  { time: '14:30', patient: 'Helen Shaw', kind: 'Routine visit' },
];

export function AtrioNav({ current = 'agenda' }: { current?: string | undefined }) {
  return (
    <AppShellNav className="slotted-demo-nav">
      <AppShellNavHeader>
        <NavAccount
          initials="A"
          label="Atrium — switch site"
          name="Atrium Clinic"
          role="Cedar Hill site"
          shape="square"
          tone="accent"
          variant="solid"
        />
      </AppShellNavHeader>
      <AppShellNavBody>
        <NavColumn current={current} sections={[{ items: DESTINATIONS }]} />
      </AppShellNavBody>
      <AppShellNavFooter>
        <NavAccount
          initials="MF"
          label="Martha Fields — open account menu"
          name="Martha Fields"
          role="Front desk"
        />
      </AppShellNavFooter>
    </AppShellNav>
  );
}

export function AtrioBanner({ paneToggle = false }: { paneToggle?: boolean | undefined }) {
  return (
    <AppShellBanner>
      <AppShellBrand>
        <Wordmark>Atrium</Wordmark>
      </AppShellBrand>
      <AppShellCenter>
        <span className="slotted-demo-bar-crumbs">
          <span>Schedule</span>
          <span aria-hidden>/</span>
          <span aria-current="page">Tuesday, September 16</span>
        </span>
      </AppShellCenter>
      <AppShellActions>
        {paneToggle ? <AppShellAsideToggle /> : null}
        <Avatar size="sm" tone="secondary" variant="soft">
          MF
        </Avatar>
        <AppShellNavToggle />
      </AppShellActions>
    </AppShellBanner>
  );
}

export function AtrioContent({ children }: { children?: ReactNode | undefined }) {
  return (
    <Page landmark="none" scroll="ancestor" width="full">
      <PageHeader level="1" size="md">
        <PageHeaderTitleArea>
          <PageHeaderTitleRow>
            <PageHeaderTitle>
              <PageHeaderHeading>Tuesday schedule</PageHeaderHeading>
              <PageHeaderSubheading>
                9 appointments · 2 openings · Dr. Helen Shaw
              </PageHeaderSubheading>
            </PageHeaderTitle>
          </PageHeaderTitleRow>
        </PageHeaderTitleArea>
      </PageHeader>
      <PageBody>
        {children ?? (
          <dl className="slotted-demo-pane-fields">
            {AGENDA.map((slot) => (
              <Agenda key={slot.time} slot={slot} />
            ))}
          </dl>
        )}
      </PageBody>
    </Page>
  );
}

function Agenda({ slot }: { slot: Slot }) {
  return (
    <>
      <dt>{slot.time}</dt>
      <dd>
        <Text size="sm" tone={slot.patient === '—' ? 'muted' : 'default'} weight="medium">
          {slot.patient === '—' ? 'Vaga' : slot.patient}
        </Text>
        {slot.patient === '—' ? null : (
          <Text size="xs" tone="muted">
            {slot.kind}
          </Text>
        )}
      </dd>
    </>
  );
}

/** The pane as a form: booking the free slot. */
export function AtrioPane() {
  return (
    <AppShellAside>
      <AppShellAsideHeader>
        <span className="slotted-demo-pane-title">Nova consulta · 10:30</span>
        <AppShellAsideToggle />
      </AppShellAsideHeader>
      <AppShellAsideBody>
        <div className="slotted-demo-pane-form">
          <Field>
            <FieldLabel>Utente</FieldLabel>
            <TextField defaultValue="Joana Mesquita" size="md" />
          </Field>
          <Field>
            <FieldLabel>Reason</FieldLabel>
            <TextField placeholder="Follow-up, tests, routine…" size="md" />
          </Field>
          <Field>
            <FieldLabel>Contacto</FieldLabel>
            <TextField defaultValue="+351 912 440 118" inputMode="tel" size="md" />
          </Field>
        </div>
      </AppShellAsideBody>
      <AppShellAsideFooter>
        <Button size="sm" tone="secondary" variant="ghost">
          Cancelar
        </Button>
        <Button size="sm" tone="accent">
          Marcar
        </Button>
      </AppShellAsideFooter>
    </AppShellAside>
  );
}

/** The whole application: navigation at the end and overlaid, pane at the start. */
export function Atrio({
  aside = true,
  children,
  shell,
  size = 'screen',
}: {
  aside?: boolean | undefined;
  children?: ReactNode | undefined;
  shell?: Partial<AppShellProps> | undefined;
  size?: 'screen' | 'tall' | undefined;
}) {
  return (
    <Viewport size={size}>
      <AppShell defaultNavOpen={false} navMode="overlay" navSide="end" {...shell}>
        <AtrioBanner />
        <AtrioNav />
        <AppShellMain>{children ?? <AtrioContent />}</AppShellMain>
        {aside ? <AtrioPane /> : null}
      </AppShell>
    </Viewport>
  );
}
