import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Table, TableBody, TableCell, TableContent, TableRow, TableRowHeader } from '../table';
import { Meter } from './meter';

/** A share in a table cell fills the cell, and its indicator covers that share of the track. */
describe('a meter in an auto-layout table cell', () => {
  it('draws the indicator at 43.80% of the track, with no progressbar on the page', () => {
    render(
      <Table columns={3}>
        <TableContent>
          <TableBody>
            <TableRow>
              <TableRowHeader>Fixed income</TableRowHeader>
              <TableCell numeric>43.80%</TableCell>
              <TableCell>
                <Meter aria-label="Fixed income, 43.80%" max={10000} value={4380} />
              </TableCell>
            </TableRow>
          </TableBody>
        </TableContent>
      </Table>,
    );
    const meter = screen.getByRole('meter');
    const track = meter.querySelector('[data-part="track"]')!.getBoundingClientRect();
    const indicator = meter.querySelector('[data-part="indicator"]')!;
    const clip = getComputedStyle(indicator).clipPath;
    /* The clip's inline end, as the browser resolves it: a share of the box or pixels. */
    const [, amount, unit] = /inset\(0px ([\d.]+)(%|px)/.exec(clip) ?? [];
    const hidden = unit === '%' ? (Number(amount) / 100) * track.width : Number(amount);

    expect(track.width).toBeGreaterThanOrEqual(64);
    expect((track.width - hidden) / track.width).toBeCloseTo(0.438, 2);
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
