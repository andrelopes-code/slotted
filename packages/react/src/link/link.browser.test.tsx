import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Chart } from '../chart';
import { Section, SectionActions, SectionHeader, SectionTitle } from '../section';
import { StatCard, StatCardAction, StatCardHeader, StatCardLabel } from '../stat-card';
import { Link } from './index';

/**
 * The same link in the action slot of a stat card, a section and a chart drew
 * at 12, 16 and 14 pixels, each the slot's own text size. An action slot sets
 * one size for the links it holds, and `size` on the link states its own.
 */
describe('a link in an action slot', () => {
  const slots = () => (
    <>
      <StatCard>
        <StatCardHeader>
          <StatCardLabel>Revenue</StatCardLabel>
          <StatCardAction>
            <Link href="#a" data-testid="stat">
              Details
            </Link>
          </StatCardAction>
        </StatCardHeader>
      </StatCard>
      <Section>
        <SectionHeader>
          <SectionTitle>Orders</SectionTitle>
          <SectionActions>
            <Link href="#b" data-testid="section">
              Details
            </Link>
          </SectionActions>
        </SectionHeader>
      </Section>
      <Chart
        actions={
          <Link href="#c" data-testid="chart">
            Details
          </Link>
        }
        data={[{ month: 'Jan', revenue: 1 }]}
        series={[{ kind: 'line', field: 'revenue', label: 'Revenue' }]}
        title="Revenue"
        variant="card"
        x={{ field: 'month' }}
      />
    </>
  );
  const sizes = () =>
    ['stat', 'section', 'chart'].map(
      (id) => getComputedStyle(document.querySelector(`[data-testid="${id}"]`)!).fontSize,
    );

  it('takes one size in every slot', () => {
    render(slots());
    expect(new Set(sizes()).size).toBe(1);
  });

  it('takes its own size where it states one', () => {
    render(
      <p style={{ fontSize: 20 }}>
        <Link href="#d" size="xs" data-testid="own">
          Details
        </Link>
      </p>,
    );
    expect(getComputedStyle(document.querySelector('[data-testid="own"]')!).fontSize).not.toBe(
      '20px',
    );
  });
});
