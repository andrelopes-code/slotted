import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Tab, TabList, TabPanel, Tabs } from './index';

function Basic({
  activation,
  onValueChange,
  orientation,
}: {
  activation?: 'automatic' | 'manual';
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
} = {}) {
  return (
    <Tabs
      activation={activation}
      defaultValue="overview"
      id="report"
      onValueChange={onValueChange}
      orientation={orientation}
    >
      <TabList aria-label="Report sections">
        <Tab value="overview">Overview</Tab>
        <Tab disabled value="usage">
          Usage
        </Tab>
        <Tab value="billing">Billing</Tab>
      </TabList>
      <TabPanel value="overview">Overview panel</TabPanel>
      <TabPanel value="usage">Usage panel</TabPanel>
      <TabPanel value="billing">Billing panel</TabPanel>
    </Tabs>
  );
}

const tabs = () => screen.getAllByRole('tab');

describe('Tabs', () => {
  it('wires every tab to its panel through derived identifiers', () => {
    render(<Basic />);

    const [overview] = tabs();
    expect(overview).toHaveAttribute('id', 'report-tab-overview');
    expect(overview).toHaveAttribute('aria-controls', 'report-panel-overview');

    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('id', 'report-panel-overview');
    expect(panel).toHaveAttribute('aria-labelledby', 'report-tab-overview');
  });

  it('exposes one tab stop and marks the selected tab', () => {
    render(<Basic />);

    expect(tabs().map((tab) => tab.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    expect(tabs()[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs()[0]).toHaveAttribute('data-selected', '');
    expect(tabs()[2]).toHaveAttribute('aria-selected', 'false');
  });

  it('hides unselected panels instead of unmounting them', () => {
    render(<Basic />);

    expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(3);
    expect(screen.getByText('Billing panel')).toHaveAttribute('hidden');
    expect(screen.getByText('Overview panel')).not.toHaveAttribute('hidden');
  });

  it('selects on arrow movement in automatic activation, skipping disabled tabs', () => {
    const onValueChange = vi.fn();
    render(<Basic onValueChange={onValueChange} />);

    fireEvent.keyDown(tabs()[0]!, { key: 'ArrowRight' });

    expect(onValueChange).toHaveBeenCalledWith('billing');
    expect(screen.getByText('Billing panel')).not.toHaveAttribute('hidden');
  });

  it('moves focus without selecting in manual activation', () => {
    const onValueChange = vi.fn();
    render(<Basic activation="manual" onValueChange={onValueChange} />);

    fireEvent.keyDown(tabs()[0]!, { key: 'ArrowRight' });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(tabs()[2]).toHaveFocus();

    fireEvent.keyDown(tabs()[2]!, { key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledWith('billing');
  });

  it('answers the vertical keys when the orientation says so', () => {
    const onValueChange = vi.fn();
    render(<Basic onValueChange={onValueChange} orientation="vertical" />);

    fireEvent.keyDown(tabs()[0]!, { key: 'ArrowRight' });
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.keyDown(tabs()[0]!, { key: 'ArrowDown' });
    expect(onValueChange).toHaveBeenCalledWith('billing');
  });

  it('selects on click and never on a disabled tab', () => {
    const onValueChange = vi.fn();
    render(<Basic onValueChange={onValueChange} />);

    fireEvent.click(tabs()[1]!);
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.click(tabs()[2]!);
    expect(onValueChange).toHaveBeenCalledWith('billing');
  });

  it('marks a disabled tab and keeps it out of the tab stop', () => {
    render(<Basic />);

    expect(tabs()[1]).toHaveAttribute('data-disabled', '');
    expect(tabs()[1]).toHaveAttribute('tabindex', '-1');
  });

  it('honours a controlled value and does not move on its own', () => {
    function Controlled() {
      const [value, setValue] = useState('overview');
      return (
        <>
          <button onClick={() => setValue('billing')} type="button">
            Jump
          </button>
          <Tabs id="report" onValueChange={setValue} value={value}>
            <TabList aria-label="Report sections">
              <Tab value="overview">Overview</Tab>
              <Tab value="billing">Billing</Tab>
            </TabList>
            <TabPanel value="overview">Overview panel</TabPanel>
            <TabPanel value="billing">Billing panel</TabPanel>
          </Tabs>
        </>
      );
    }

    render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: 'Jump' }));

    expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Billing panel')).not.toHaveAttribute('hidden');
  });

  it('carries the orientation on the root and the list', () => {
    render(<Basic orientation="vertical" />);

    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    expect(screen.getByRole('tablist').closest('.slotted-tabs')).toHaveAttribute(
      'data-orientation',
      'vertical',
    );
  });

  it('gives the selected panel a tab stop', () => {
    render(<Basic />);

    expect(screen.getByText('Overview panel')).toHaveAttribute('tabindex', '0');
  });
});
