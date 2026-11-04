import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Alert, AlertActions, AlertContent, AlertDescription, AlertTitle } from './alert';
import { Card, CardFooter } from './card';
import { Dialog, DialogContent, DialogFooter } from './dialog';
import { Drawer, DrawerFooter, DrawerPanel } from './drawer';
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderTitle,
  PageHeaderTitleArea,
  PageHeaderTitleRow,
} from './page-header';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

function columnGap(selector: string): string {
  return getComputedStyle(document.querySelector(selector)!).columnGap;
}

const buttons = (
  <>
    <button type="button">Cancel</button>
    <button type="button">Save</button>
  </>
);

/**
 * A row of adjacent actions read a different scale in each family, so two
 * buttons stood 8, 12 and 6 pixels apart. `--slotted-action-gap` sets the
 * distance for every row that holds labelled actions.
 */
describe('--slotted-action-gap', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--slotted-action-gap');
  });

  it.each([
    [
      'PageHeaderActions',
      '[data-ui="page-header"] [data-part="actions"]',
      <PageHeader key="p">
        <PageHeaderTitleArea>
          <PageHeaderTitleRow>
            <PageHeaderTitle>Orders</PageHeaderTitle>
            <PageHeaderActions>{buttons}</PageHeaderActions>
          </PageHeaderTitleRow>
        </PageHeaderTitleArea>
      </PageHeader>,
    ],
    [
      'DialogFooter',
      '[data-ui="dialog"] [data-part="footer"]',
      <Dialog defaultOpen key="d">
        <DialogContent aria-label="Edit">
          <DialogFooter>{buttons}</DialogFooter>
        </DialogContent>
      </Dialog>,
    ],
    [
      'DrawerFooter',
      '[data-ui="drawer"] [data-part="footer"]',
      <Drawer defaultOpen key="w">
        <DrawerPanel aria-label="Filters">
          <DrawerFooter>{buttons}</DrawerFooter>
        </DrawerPanel>
      </Drawer>,
    ],
    [
      'CardFooter',
      '[data-ui="card"] > [data-part="footer"]',
      <Card key="c">
        <CardFooter>{buttons}</CardFooter>
      </Card>,
    ],
    [
      'AlertActions',
      '[data-ui="alert"] [data-part="actions"]',
      <Alert key="a">
        <AlertContent>
          <AlertTitle>Plan expires</AlertTitle>
          <AlertDescription>Renew to keep access.</AlertDescription>
        </AlertContent>
        <AlertActions>{buttons}</AlertActions>
      </Alert>,
    ],
  ])('sets the gap of %s', async (_name, selector, tree) => {
    document.documentElement.style.setProperty('--slotted-action-gap', '0.5rem');
    render(tree);
    await frame();

    expect(columnGap(selector)).toBe('8px');
  });
});
