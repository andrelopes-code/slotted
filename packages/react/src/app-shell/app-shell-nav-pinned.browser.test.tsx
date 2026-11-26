import { render } from '@testing-library/react';
import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AppShell } from './app-shell';
import {
  AppShellMain,
  AppShellNav,
  AppShellNavBody,
  AppShellNavHeader,
  AppShellNavPinned,
  AppShellNavRail,
} from './app-shell-parts';

const COMMANDS = ['New order', 'Search', 'Inbox', 'Filters'];

function Shell({ open, rail = false }: { open: boolean; rail?: boolean }) {
  return (
    <AppShell
      collapsedTo="rail"
      navMode="inline"
      navOpen={open}
      onNavOpenChange={() => undefined}
      primary="nav"
      scroll="content"
    >
      <AppShellNav>
        {rail && (
          <AppShellNavRail>
            <span>Areas</span>
          </AppShellNavRail>
        )}
        <AppShellNavHeader>
          <span>Mark</span>
        </AppShellNavHeader>
        <AppShellNavPinned>
          {COMMANDS.map((command) => (
            <button key={command} style={{ blockSize: 'var(--slotted-control-height-md)' }}>
              {command}
            </button>
          ))}
        </AppShellNavPinned>
        <AppShellNavBody>
          {Array.from({ length: 30 }, (_, index) => (
            <a data-row="" href={`#${String(index)}`} key={index} style={{ blockSize: 32 }}>
              Destination {index + 1}
            </a>
          ))}
        </AppShellNavBody>
      </AppShellNav>
      <AppShellMain>Orders</AppShellMain>
    </AppShell>
  );
}

const part = (name: string) => document.querySelector<HTMLElement>(`[data-part="${name}"]`)!;
const buttons = () => [...part('nav-pinned').querySelectorAll('button')];
/** Two steps of the space scale at lengths no fallback has, so the part is seen reading them. */
const SPACE = { '3': 7, '6': 17 } as const;

/**
 * A short block of commands above a list of destinations scrolled away with
 * the list, because `nav-body` scrolls as a whole and `nav-header` holds one
 * centred row.
 */
describe('the pinned block of the navigation column', () => {
  beforeEach(async () => {
    await page.viewport(1440, 520);
    for (const [step, length] of Object.entries(SPACE)) {
      document.documentElement.style.setProperty(`--slotted-space-${step}`, `${String(length)}px`);
    }
  });
  afterEach(async () => {
    document.documentElement.removeAttribute('style');
    await page.viewport(412, 915);
  });

  it('stays where it is while the list scrolls to its end', async () => {
    render(<Shell open />);
    const body = part('nav-body');
    const before = buttons()[0]!.getBoundingClientRect().top;

    body.scrollTop = body.scrollHeight;
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(body.scrollTop).toBeGreaterThan(0);
    expect(buttons()[0]!.getBoundingClientRect().top).toBe(before);
    expect(getComputedStyle(part('nav-pinned')).overflowY).toBe('hidden');
  });

  it('stacks its commands at the row width, and starts the list a larger step below', () => {
    render(<Shell open />);
    const pinned = part('nav-pinned');
    const row = part('nav-body').querySelector<HTMLElement>('[data-row]')!.getBoundingClientRect();
    const boxes = buttons().map((button) => button.getBoundingClientRect());

    for (const box of boxes) {
      expect(box.left).toBe(row.left);
      expect(box.width).toBe(row.width);
    }
    for (let index = 1; index < boxes.length; index += 1) {
      expect(boxes[index]!.top - boxes[index - 1]!.bottom).toBeCloseTo(SPACE['3'], 1);
    }
    expect(row.top - boxes.at(-1)!.bottom).toBeCloseTo(SPACE['6'], 1);
    expect(getComputedStyle(pinned).scrollbarGutter).toBe(
      getComputedStyle(part('nav-body')).scrollbarGutter,
    );
  });

  it('centres its commands on the axis of the marks in the rail', () => {
    render(<Shell open={false} />);
    const mark = part('nav-header').querySelector('span')!.getBoundingClientRect();
    const axis = mark.left + mark.width / 2;

    expect(getComputedStyle(part('nav-pinned')).alignItems).toBe('center');
    for (const box of buttons().map((button) => button.getBoundingClientRect())) {
      expect(box.left + box.width / 2).toBeCloseTo(axis, 0);
    }
  });

  it('is a row of its own between the head and the list beside a strip of marks', () => {
    render(<Shell open rail />);
    const head = part('nav-header').getBoundingClientRect();
    const pinned = part('nav-pinned').getBoundingClientRect();
    const body = part('nav-body').getBoundingClientRect();
    const strip = part('nav-rail').getBoundingClientRect();

    expect(pinned.top).toBe(head.bottom);
    expect(body.top).toBe(pinned.bottom);
    expect(pinned.left).toBe(strip.right);
    expect(pinned.left).toBe(body.left);
  });
});
