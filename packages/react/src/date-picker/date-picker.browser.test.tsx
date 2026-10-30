import { plainDate } from '@slotted/core/date';
import { render } from '@testing-library/react';
import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Inline } from '../inline';
import { PageHeader } from '../page-header';
import {
  PageHeaderActions,
  PageHeaderHeading,
  PageHeaderTitle,
  PageHeaderTitleArea,
  PageHeaderTitleRow,
} from '../page-header/page-header-parts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { Stack } from '../stack';
import { DatePicker } from './index';

/* A page header's actions: a Select and a DatePicker in one flex row whose
   width is definite, where a root at `inline-size: 100%` made the whole row
   each item's basis and the shrink clipped the date. */
describe('a date picker as a flex item', () => {
  beforeEach(async () => {
    await page.viewport(1440, 900);
  });
  afterEach(async () => {
    await page.viewport(412, 915);
  });

  it('keeps the width its segments need beside a select in a page header', () => {
    render(
      <PageHeader size="lg">
        <PageHeaderTitleArea>
          <PageHeaderTitleRow>
            <PageHeaderTitle>
              <PageHeaderHeading>Budget plan</PageHeaderHeading>
            </PageHeaderTitle>
            <PageHeaderActions>
              <Inline gap={3} wrap="nowrap">
                <Select defaultValue="BRL">
                  <SelectTrigger aria-label="Value in">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">BRL</SelectItem>
                  </SelectContent>
                </Select>
                <Stack gap={2}>
                  <DatePicker defaultValue={plainDate(2026, 10, 28)} locale="pt-BR" />
                </Stack>
              </Inline>
            </PageHeaderActions>
          </PageHeaderTitleRow>
        </PageHeaderTitleArea>
      </PageHeader>,
    );
    const segments = document.querySelector('[data-part="segments"]') as HTMLElement;

    expect(segments.clientWidth).toBeGreaterThan(0);
    expect(segments.scrollWidth).toBe(segments.clientWidth);
  });
});
