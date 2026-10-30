import { computed, inject, Injectable, signal } from '@angular/core';
import type { ImportJob } from '@slotted/demo-nexora-backend';

import { isApiError } from '../backend/api-error';
import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';

/** The fields a customer import maps onto (§71.3). Company Name is the one the backend requires. */
export const IMPORT_TARGETS = [
  'Company Name',
  'External ID',
  'Primary Email',
  'Phone',
  'Billing Address',
  'Segment',
  'Account Owner',
  'Payment Terms',
] as const;

export type ImportTarget = (typeof IMPORT_TARGETS)[number];

/** The fields the command reads; the rest are carried and ignored, and the screen says so. */
export const IMPORT_TARGETS_READ: readonly ImportTarget[] = [
  'Company Name',
  'Primary Email',
  'Segment',
  'Payment Terms',
];

const ALIASES: Record<string, ImportTarget> = {
  company: 'Company Name',
  companyname: 'Company Name',
  account: 'Company Name',
  accountname: 'Company Name',
  customer: 'Company Name',
  customername: 'Company Name',
  name: 'Company Name',
  customerid: 'External ID',
  externalid: 'External ID',
  id: 'External ID',
  reference: 'External ID',
  email: 'Primary Email',
  primaryemail: 'Primary Email',
  contactemail: 'Primary Email',
  phone: 'Phone',
  telephone: 'Phone',
  phonenumber: 'Phone',
  address: 'Billing Address',
  billingaddress: 'Billing Address',
  segment: 'Segment',
  tier: 'Segment',
  owner: 'Account Owner',
  accountowner: 'Account Owner',
  salesrep: 'Account Owner',
  terms: 'Payment Terms',
  paymentterms: 'Payment Terms',
};

export interface ParsedFile {
  name: string;
  columns: string[];
  rows: string[][];
}

/** A file an operator can try the mapper with, with a row of each outcome. */
export const EXAMPLE_FILE = {
  name: 'accounts-september.csv',
  text: `Customer ID,Company,E-mail,Segment,Payment Terms,Phone
AC-4471,Brightline Conveyors,ops@brightlineconveyors.com,Mid-Market,Net 45,(414) 555-0134
AC-4472,Keystone Valve Works,purchasing@keystonevalve.com,Enterprise,Net 30,(312) 555-0118
AC-4473,Meridian Controls Group,ap@meridiancontrols.com,Enterprise,Net 30,(312) 555-0142
AC-4474,,orders@northportfab.com,SMB,Net 15,(414) 555-0190
AC-4475,Northport Fabrication,contact@northportfab.com,Preferred,Net 20,(414) 555-0191
AC-4476,Halstead Gear,sales at halsteadgear,SMB,Net 30,(414) 555-0155
`,
};

/**
 * The customer CSV mapper (§34.8, §71.3).
 *
 * The file is read in the browser: the backend takes the columns, the rows
 * and the map in one command and answers with the job it ran — there is no
 * upload, no dry run and no list of past jobs, only `GET /imports/:id`.
 */
@Injectable({ providedIn: 'root' })
export class ImportStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);

  readonly file = signal<ParsedFile | null>(null);
  /** Source column → Nexora field. A column with no entry is not carried. */
  readonly mapping = signal<Record<string, string>>({});
  readonly job = signal<ImportJob | null>(null);
  readonly running = signal(false);
  readonly loading = signal(false);
  readonly failure = signal<{ code: string; message: string } | null>(null);

  readonly mappedName = computed(() => Object.values(this.mapping()).includes('Company Name'));
  readonly ready = computed(() => this.file() !== null && this.mappedName());

  /** Which rows the reader is shown before anything is written: the first five (§34.8). */
  readonly preview = computed(() => this.file()?.rows.slice(0, 5) ?? []);

  async take(file: File): Promise<void> {
    this.load(parseCsv(await file.text(), file.name));
  }

  takeExample(): void {
    this.load(parseCsv(EXAMPLE_FILE.text, EXAMPLE_FILE.name));
  }

  /** A file replaces everything: its columns, its map and any job that was read. */
  load(parsed: ParsedFile): void {
    this.file.set(parsed);
    this.mapping.set(guessMapping(parsed.columns));
    this.job.set(null);
    this.failure.set(null);
  }

  clear(): void {
    this.file.set(null);
    this.mapping.set({});
    this.job.set(null);
    this.failure.set(null);
  }

  map(column: string, target: string | null): void {
    this.mapping.update((mapping) => {
      const next = { ...mapping };
      if (target === null) delete next[column];
      else {
        // A field is mapped from one column: choosing it again moves it.
        for (const [source, mapped] of Object.entries(next))
          if (mapped === target && source !== column) delete next[source];
        next[column] = target;
      }
      return next;
    });
  }

  /** Runs the import. Rows with errors are not written; the rest are (§71.3). */
  async run(): Promise<ImportJob | null> {
    const file = this.file();
    if (file === null || this.running()) return null;
    this.running.set(true);
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      const job = await this.health.mutation(() =>
        api.imports.customers({
          fileName: file.name,
          columns: file.columns,
          rows: file.rows,
          mapping: this.mapping(),
        }),
      );
      this.job.set(job);
      return job;
    } catch (error) {
      this.failure.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The file was not imported.' },
      );
      return null;
    } finally {
      this.running.set(false);
    }
  }

  /** Reads a job back by its id: the only way a finished import is found again. */
  async open(id: string): Promise<void> {
    if (this.job()?.id === id) return;
    this.loading.set(true);
    this.failure.set(null);
    try {
      const api = await this.backend.ready();
      const job = await api.imports.get(id);
      this.job.set(job);
      this.file.set({ name: job.fileName, columns: job.columns, rows: job.sampleRows });
      this.mapping.set(job.mapping);
    } catch (error) {
      this.job.set(null);
      this.failure.set(
        isApiError(error)
          ? { code: error.code, message: error.message }
          : { code: 'UNKNOWN', message: 'The import could not be read.' },
      );
    } finally {
      this.loading.set(false);
    }
  }
}

/** RFC 4180 enough for a spreadsheet's export: quoted fields, doubled quotes, CRLF. */
export function parseCsv(text: string, name: string): ParsedFile {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!;
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          value += '"';
          index += 1;
        } else quoted = false;
      } else value += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(value);
      value = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else value += char;
  }
  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }
  const [header = [], ...body] = rows;
  return {
    name,
    columns: header.map((column) => column.trim()),
    rows: body.filter((line) => line.some((cell) => cell.trim().length > 0)),
  };
}

/** The map a reader starts from: the column's own name, read as the field it usually is. */
export function guessMapping(columns: readonly string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const taken = new Set<string>();
  for (const column of columns) {
    const key = column.toLowerCase().replace(/[^a-z0-9]/g, '');
    const target = ALIASES[key];
    if (target && !taken.has(target)) {
      mapping[column] = target;
      taken.add(target);
    }
  }
  return mapping;
}
