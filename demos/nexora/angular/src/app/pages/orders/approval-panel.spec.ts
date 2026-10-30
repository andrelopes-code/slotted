import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ApprovalRequest } from '@slotted/demo-nexora-backend';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend } from '../../../test/testing';
import { ApprovalPanel } from './approval-panel';

/** Two steps: the first waiting on this reader's role, the second behind it. */
function request(): ApprovalRequest {
  const now = '2026-09-04T10:00:00Z';
  return {
    id: 'apr_000001',
    organizationId: 'org_000001',
    targetType: 'sales_order',
    targetId: 'ord_000001',
    targetNumber: 'SO-2026-13874',
    policyCode: 'sales.discount',
    reasons: ['line discount at or above 12%'],
    status: 'pending',
    requestedBy: 'usr_000009',
    requestedAt: now,
    amount: { currency: 'USD', minor: 1_330_500 },
    steps: [
      { id: 'stp_1', sequence: 1, requiredRole: 'sales_manager', status: 'pending' },
      { id: 'stp_2', sequence: 2, requiredRole: 'finance_manager', status: 'pending' },
    ],
    metadata: {
      id: 'apr_000001',
      organizationId: 'org_000001',
      createdAt: now,
      createdBy: 'usr_000009',
      updatedAt: now,
      updatedBy: 'usr_000009',
      version: 1,
    },
  };
}

@Component({
  imports: [ApprovalPanel],
  template: `<app-approval-panel [approval]="approval()" subject="SO-2026-13874" />`,
})
class Host {
  readonly approval = signal(request());
}

describe('ApprovalPanel', () => {
  let element: HTMLElement;

  beforeEach(async () => {
    // The panel reads the session to know whether this step is the reader's.
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTestBackend()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  /**
   * The rail, the marker and the connector are the family's (CP-01). A thread
   * of the screen's own broke as soon as a step grew taller than it.
   */
  it('draws the chain with the timeline family, one connector between the steps', () => {
    expect(element.querySelector('[data-ui="timeline"]')).not.toBeNull();
    const items = [...element.querySelectorAll('[data-part="item"]')];
    expect(items.length).toBe(2);
    expect(items[0]!.querySelector('[data-part="connector"]')).not.toBeNull();
    // The last step closes the chain: the family draws no connector after it.
    expect(items[1]!.querySelector('[data-part="connector"]')).toBeNull();
  });

  /**
   * CP-06: the step the reader is on is `current`, which the family already
   * draws as a target. Asking for `solid` on top of it adds a halo two rules
   * wide that crowds the title beside it.
   */
  it('leaves the marker to the family and asks for no louder variant', () => {
    const items = [...element.querySelectorAll('[data-part="item"]')];
    expect(items[0]!.hasAttribute('data-current')).toBe(true);
    expect(items.every((item) => item.getAttribute('data-variant') !== 'solid')).toBe(true);
  });

  it('says the role and what the step waits on, once each', () => {
    const text = element.textContent ?? '';
    expect(text).toContain('Sales Manager');
    expect(text).toContain('Finance Manager');
    expect(text).toContain('Waiting on this role');
    // The state is the marker and the sentence; a badge beside them would say it twice.
    expect(element.querySelectorAll('[data-part="item"] [data-ui="badge"]').length).toBe(0);
  });
});

@Component({
  imports: [ApprovalPanel],
  template: `<app-approval-panel
    [approval]="approval"
    [amountShown]="false"
    [reasonsOverride]="['The variance moves the stock by US$2,500 or more at standard cost.']"
  />`,
})
class WithheldHost {
  readonly approval: ApprovalRequest = {
    ...request(),
    targetType: 'cycle_count',
    reasons: ['variance impact $8,846.24 at standard cost'],
    amount: { currency: 'USD', minor: 884_624 },
  };
}

describe('ApprovalPanel, read without cost.view', () => {
  it('draws neither the amount nor a reason that carries it (PM-01)', async () => {
    TestBed.configureTestingModule({ imports: [WithheldHost], providers: [provideTestBackend()] });
    const fixture = TestBed.createComponent(WithheldHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('8,846');
    expect(text).toContain('US$2,500 or more');
  });
});
