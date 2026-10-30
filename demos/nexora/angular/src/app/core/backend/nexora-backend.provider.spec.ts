import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTestBackend, resetTestBackend } from '../../../test/testing';
import { isApiError } from './api-error';
import { NEXORA_BACKEND } from './nexora-backend.provider';

describe('nexora backend provider', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
  });

  it('is ready with Sofia signed in', async () => {
    const backend = TestBed.inject(NEXORA_BACKEND);
    const api = await backend.ready();
    expect(backend.status()).toBe('ready');
    const session = await api.session.get();
    expect(session.user.displayName).toBe('Sofia Ramirez');
  });

  it('exposes api errors with their code', async () => {
    const api = await TestBed.inject(NEXORA_BACKEND).ready();
    await api.demo.setPersona('jordan-wells');
    const error = await api.finance.invoices.list({}).catch((e: unknown) => e);
    expect(isApiError(error, 'FORBIDDEN')).toBe(true);
  });
});
