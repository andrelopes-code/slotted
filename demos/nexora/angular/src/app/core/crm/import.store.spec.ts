import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend, resetTestBackend, signInAs } from '../../../test/testing';
import { SessionStore } from '../session/session.store';
import { guessMapping, ImportStore, parseCsv } from './import.store';

describe('ImportStore', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    // Only an administrator holds `imports.run`.
    await signInAs('maya-chen');
    await TestBed.inject(SessionStore).load();
    TestBed.inject(ImportStore).clear();
  });

  it('reads a quoted file as columns and rows', () => {
    const parsed = parseCsv(
      'Company,Notes\r\n"Keystone Valve Works","Says ""ship to dock 4"", every time"\r\n',
      'quoted.csv',
    );
    expect(parsed.columns).toEqual(['Company', 'Notes']);
    expect(parsed.rows).toEqual([['Keystone Valve Works', 'Says "ship to dock 4", every time']]);
  });

  it('reads a column name as the field it usually is', () => {
    expect(guessMapping(['Customer ID', 'Company', 'E-mail', 'Payment Terms'])).toEqual({
      'Customer ID': 'External ID',
      Company: 'Company Name',
      'E-mail': 'Primary Email',
      'Payment Terms': 'Payment Terms',
    });
  });

  it('refuses to run until a column is the company name', () => {
    const store = TestBed.inject(ImportStore);
    store.takeExample();
    expect(store.ready()).toBe(true);

    store.map('Company', null);
    expect(store.mappedName()).toBe(false);
    expect(store.ready()).toBe(false);
  });

  it('moves a field when a second column takes it', () => {
    const store = TestBed.inject(ImportStore);
    store.takeExample();
    store.map('Customer ID', 'Company Name');

    expect(store.mapping()['Customer ID']).toBe('Company Name');
    expect(store.mapping()['Company']).toBeUndefined();
  });

  it('writes the rows it can read and lists the rest with the reason', async () => {
    const store = TestBed.inject(ImportStore);
    store.takeExample();

    const running = store.run();
    expect(store.running()).toBe(true);
    const job = await running;

    expect(job?.status).toBe('completed_with_errors');
    expect(job?.result).toMatchObject({
      totalRows: 6,
      importedRows: 3,
      errorRows: 3,
      warningRows: 1,
      skippedRows: 3,
    });
    const codes = job!.issues.map((issue) => issue.code).sort();
    expect(codes).toEqual([
      'DUPLICATE',
      'INVALID_EMAIL',
      'REQUIRED',
      'UNKNOWN_SEGMENT',
      'UNKNOWN_TERMS',
    ]);
    // A warning does not stop a row: the account is created with the value Nexora uses.
    const warning = job!.issues.find((issue) => issue.code === 'UNKNOWN_SEGMENT')!;
    expect(warning.severity).toBe('warning');
    expect(warning.row).toBe(5);
  });

  it('refuses the file when no column is the company name', async () => {
    const store = TestBed.inject(ImportStore);
    store.takeExample();
    store.map('Company', null);

    const job = await store.run();

    expect(job?.status).toBe('failed');
    expect(job?.issues[0]?.field).toBe('Company Name');
    expect(job?.result).toBeUndefined();
  });

  it('reads a finished job back by its id', async () => {
    const store = TestBed.inject(ImportStore);
    store.takeExample();
    const job = await store.run();
    store.clear();

    await store.open(job!.id);

    expect(store.job()?.id).toBe(job!.id);
    expect(store.file()?.name).toBe('accounts-september.csv');
    expect(store.mapping()['Company']).toBe('Company Name');
  });

  it('is refused to a persona without imports.run', async () => {
    await signInAs('sofia-ramirez');
    await TestBed.inject(SessionStore).load();
    const store = TestBed.inject(ImportStore);
    store.takeExample();

    expect(await store.run()).toBeNull();
    expect(store.failure()?.code).toBe('FORBIDDEN');
  });
});
