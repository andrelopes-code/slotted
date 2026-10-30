import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useState } from 'react';
import type { MouseEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TopNavigation } from '../top-navigation/top-navigation';
import {
  TopNavigationItem,
  TopNavigationLink,
  TopNavigationList,
  TopNavigationNav,
} from '../top-navigation/top-navigation-parts';
import { usePressSelection } from './press-selection';

/** A press the browser keeps: a new tab, a new window, a download. */
const modified = (event: MouseEvent) =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

/** A bar whose current item follows a router's location, as an application writes it. */
function Routed({ navigate }: { navigate: (to: string) => void }) {
  const [location, setLocation] = useState('dashboard');
  const { selected, select } = usePressSelection(location);
  return (
    <TopNavigation value={selected ?? null}>
      <TopNavigationNav>
        <TopNavigationList>
          {['dashboard', 'loads'].map((value) => (
            <TopNavigationItem key={value} value={value}>
              <TopNavigationLink
                href={`#${value}`}
                onClick={(event) => {
                  if (modified(event)) return;
                  event.preventDefault();
                  select(value, () => {
                    navigate(value);
                    setLocation(value);
                  });
                }}
              >
                {value}
              </TopNavigationLink>
            </TopNavigationItem>
          ))}
        </TopNavigationList>
      </TopNavigationNav>
    </TopNavigation>
  );
}

const link = (name: string) => screen.getByRole('link', { name });

describe('usePressSelection', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout'],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Following the router, the selection painted only once the destination had
   * rendered and laid out, and the tap read as ignored. The press is painted
   * first; the navigation runs after the frame that shows it.
   */
  it('selects the pressed item before the navigation runs, and navigates after the next frame', () => {
    const navigate = vi.fn();
    render(<Routed navigate={navigate} />);
    expect(link('dashboard')).toHaveAttribute('aria-current', 'page');

    fireEvent.click(link('loads'));
    expect(link('loads')).toHaveAttribute('aria-current', 'page');
    expect(link('dashboard')).not.toHaveAttribute('aria-current');
    expect(navigate).not.toHaveBeenCalled();

    act(() => vi.advanceTimersToNextFrame());
    expect(navigate).not.toHaveBeenCalled();
    act(() => vi.runOnlyPendingTimers());
    expect(navigate).toHaveBeenCalledWith('loads');
    expect(link('loads')).toHaveAttribute('aria-current', 'page');
  });

  it('leaves a modified press to the browser', () => {
    const navigate = vi.fn();
    render(<Routed navigate={navigate} />);
    fireEvent.click(link('loads'), { metaKey: true });
    act(() => vi.runAllTimers());
    expect(navigate).not.toHaveBeenCalled();
    expect(link('dashboard')).toHaveAttribute('aria-current', 'page');
  });

  it('runs only the latest navigation when a press supersedes another', () => {
    const { result } = renderHook(() => usePressSelection<string>('a'));
    const first = vi.fn();
    const second = vi.fn();
    act(() => result.current.select('b', first));
    act(() => result.current.select('c', second));
    expect(result.current.selected).toBe('c');
    act(() => vi.runAllTimers());
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('gives the selection back to the router once the location moves, wherever it lands', () => {
    const { rerender, result } = renderHook(({ current }) => usePressSelection(current), {
      initialProps: { current: 'a' },
    });
    act(() => result.current.select('b', () => {}));
    expect(result.current.selected).toBe('b');
    /* A guard redirected the navigation somewhere else. */
    rerender({ current: 'login' });
    expect(result.current.selected).toBe('login');
  });
});
