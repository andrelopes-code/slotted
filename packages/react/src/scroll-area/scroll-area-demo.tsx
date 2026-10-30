import type { ReactNode } from 'react';

import { Inline } from '../inline';
import { Stack } from '../stack';
import { Text } from '../typography';

/**
 * The content a scroll area is demonstrated with: one product, the billing
 * back office the other families already live in, so the page reads as one
 * screen rather than as a bag of specimens. Every measure comes from a family
 * or from the workbench, because a story may not paint inline.
 */

export interface Release {
  readonly version: string;
  readonly area: string;
  readonly note: string;
}

export const RELEASES: readonly Release[] = [
  {
    version: '2026.9.2',
    area: 'Billing',
    note: 'An invoice issued before September 1 keeps the old tax lines, and a credit note against it now carries the same ones.',
  },
  {
    version: '2026.9.1',
    area: 'Billing',
    note: 'A subscription that changes plan mid-cycle is now prorated by the day instead of by the hour. Seven customers were charged twice for the same day and were refunded.',
  },
  {
    version: '2026.8.29',
    area: 'Access',
    note: 'The single sign-on session expires with the identity provider session instead of after a fixed eight hours.',
  },
  {
    version: '2026.8.22',
    area: 'Exports',
    note: 'An export with more than fifty thousand rows is delivered by email instead of downloaded, and the request now says so before it is made.',
  },
  {
    version: '2026.8.15',
    area: 'Reports',
    note: 'The monthly report now includes the regions with no usage, at zero, instead of omitting them.',
  },
  {
    version: '2026.8.8',
    area: 'Collections',
    note: 'A collection reminder is not sent to a customer whose invoice is under an open dispute.',
  },
];

/** A line of its own: `Text` renders a `span`, and a column of spans is one paragraph. */
export function Line({
  children,
  id,
  tone,
  weight,
  wrap,
}: {
  children: ReactNode;
  id?: string | undefined;
  tone?: 'muted' | undefined;
  weight?: 'semibold' | undefined;
  wrap?: 'nowrap' | undefined;
}) {
  return (
    <Text
      id={id}
      render={(props) => <p {...props} />}
      size="sm"
      tone={tone}
      weight={weight}
      wrap={wrap}
    >
      {children}
    </Text>
  );
}

/** The release notes, as the product's own changelog panel lists them. */
export function Notes({ releases = RELEASES }: { releases?: readonly Release[] }) {
  return (
    <Stack gap={4}>
      {releases.map((release) => (
        <Stack gap={1} key={release.version}>
          <Line weight="semibold">
            {release.version} — {release.area}
          </Line>
          <Line tone="muted">{release.note}</Line>
        </Stack>
      ))}
    </Stack>
  );
}

export const REGIONS = [
  'sa-east-1',
  'eu-west-3',
  'eu-central-1',
  'ap-southeast-1',
  'us-east-2',
  'us-west-2',
  'ap-southeast-2',
  'ca-central-1',
  'ap-northeast-1',
] as const;

/** The same regions down the page, for a column a third of the page wide. */
export function RegionList() {
  return (
    <Stack gap={3}>
      {REGIONS.map((region) => (
        <Line key={region}>{region}</Line>
      ))}
    </Stack>
  );
}

/** A row that runs past its box. */
export function Regions() {
  return (
    <Inline gap={5} wrap="nowrap">
      {REGIONS.map((region) => (
        <Line key={region} wrap="nowrap">
          {region}
        </Line>
      ))}
    </Inline>
  );
}

export const LOG = [
  '2026-09-11 14:02 · sa-east-1 · https://billing.example.com/invoices/2026-09/consolidated-statement-sa-east-1.pdf',
  '2026-09-11 14:02 · eu-west-3 · https://billing.example.com/invoices/2026-09/consolidated-statement-eu-west-3.pdf',
  '2026-09-11 14:03 · ap-southeast-1 · https://billing.example.com/invoices/2026-09/consolidated-statement-ap-southeast-1.pdf',
  '2026-09-11 14:03 · us-east-2 · https://billing.example.com/invoices/2026-09/consolidated-statement-us-east-2.pdf',
  '2026-09-11 14:04 · ap-southeast-2 · https://billing.example.com/invoices/2026-09/consolidated-statement-ap-southeast-2.pdf',
  '2026-09-11 14:04 · ca-central-1 · https://billing.example.com/invoices/2026-09/consolidated-statement-ca-central-1.pdf',
  '2026-09-11 14:05 · ap-northeast-1 · https://billing.example.com/invoices/2026-09/consolidated-statement-ap-northeast-1.pdf',
  '2026-09-11 14:05 · us-west-2 · https://billing.example.com/invoices/2026-09/consolidated-statement-us-west-2.pdf',
  '2026-09-11 14:06 · eu-central-1 · https://billing.example.com/invoices/2026-09/consolidated-statement-eu-central-1.pdf',
  '2026-09-11 14:06 · sa-east-1 · https://billing.example.com/invoices/2026-08/consolidated-statement-sa-east-1.pdf',
] as const;

/** An export log: lines wider than the box, and more of them than it holds. */
export function Log() {
  return (
    <Stack gap={1}>
      {LOG.map((line) => (
        <Line key={line} tone="muted" wrap="nowrap">
          {line}
        </Line>
      ))}
    </Stack>
  );
}

export const PATHS = [
  'https://billing.example.com/invoices/2026-09/consolidated-statement-sa-east-1.pdf',
  'https://billing.example.com/invoices/2026-09/consolidated-statement-eu-west-3.pdf',
  'https://billing.example.com/invoices/2026-08/consolidated-statement-sa-east-1.pdf',
] as const;

/** Three unbroken tokens. */
export function Paths() {
  return (
    <Stack gap={1}>
      {PATHS.map((path) => (
        <Line key={path} wrap="nowrap">
          {path}
        </Line>
      ))}
    </Stack>
  );
}

export const TRANSLATED =
  'Die Abonnementänderung innerhalb eines Abrechnungszeitraums wird tagesgenau und nicht mehr stundengenau anteilig berechnet. Sieben Kunden wurden zweimal für denselben Tag belastet und haben eine Erstattung erhalten. Die Sitzung der Einmalanmeldung läuft zusammen mit der des Identitätsanbieters ab und nicht mehr nach festen acht Stunden.';
