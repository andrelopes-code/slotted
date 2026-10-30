import {
  PROGRESS_WAVE_BAR_INDETERMINATE_PATH,
  PROGRESS_WAVE_BAR_PATH,
  PROGRESS_WAVE_BAR_REACH,
  PROGRESS_WAVE_RING_PATH,
} from '@slotted/core/progress';
import { act, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Loader } from './loader';
import { ProgressBar } from './progress-bar';
import { ProgressCircle } from './progress-circle';
import { ProgressIndicatorDefaultsProvider } from './progress-indicator-defaults';

describe('ProgressBar', () => {
  /**
   * An edge bar stays mounted through its fade, so a sweep that kept its node
   * came back mid-track when `loading` returned before the fade ended. Each
   * paint after a withdrawal draws a new indicator, whose sweep starts at the
   * leading edge.
   */
  it('starts the sweep over each time it is painted again', () => {
    const { container, rerender } = render(
      <ProgressBar label="Refreshing" loading placement="edge-end" />,
    );
    const indicator = () => container.querySelector('[data-part="indicator"]');
    const first = indicator();

    rerender(<ProgressBar label="Refreshing" loading={false} placement="edge-end" />);
    expect(indicator()).toBe(first);
    rerender(<ProgressBar label="Refreshing" loading placement="edge-end" />);

    expect(indicator()).not.toBe(first);
  });

  it('writes the family identity, the shape and the parts', () => {
    render(<ProgressBar label="Uploading" showValue value={40} />);
    const root = screen.getByRole('progressbar');

    expect(root).toHaveAttribute('data-ui', 'progress-indicator');
    expect(root).toHaveAttribute('data-part', 'root');
    expect(root).toHaveAttribute('data-shape', 'linear');
    expect(root.querySelector('[data-part="track"] > [data-part="indicator"]')).not.toBeNull();
    expect(root.querySelector('[data-part="label"]')?.textContent).toBe('Uploading');
    expect(root.querySelector('[data-part="value"]')?.textContent).toBe('40%');
  });

  it('names itself from the rendered label', () => {
    render(<ProgressBar label="Uploading invoices" value={40} />);
    expect(screen.getByRole('progressbar', { name: 'Uploading invoices' })).toBeInTheDocument();
  });

  /** The consumer's own name wins, and no id reference is invented over it. */
  it('keeps a name the consumer wrote', () => {
    render(<ProgressBar aria-label="Restoring backup" value={40} />);
    const root = screen.getByRole('progressbar', { name: 'Restoring backup' });
    expect(root).not.toHaveAttribute('aria-labelledby');
  });

  it('reports the range and the value it painted', () => {
    render(<ProgressBar label="Copying" max={512} min={0} value={128} />);
    const root = screen.getByRole('progressbar');

    expect(root).toHaveAttribute('aria-valuemin', '0');
    expect(root).toHaveAttribute('aria-valuemax', '512');
    expect(root).toHaveAttribute('aria-valuenow', '128');
    expect(root.style.getPropertyValue('--slotted-progress-indicator-percent')).toBe('25');
  });

  /**
   * ARIA 1.3 asks an author to omit `aria-valuenow` while the value is
   * indeterminate, and the omission is what says "in progress, and nobody
   * knows how far". The value is `null` by default, so this is also what a bar
   * nobody gave a number to reports.
   */
  it('omits the current value while the wait is indeterminate', () => {
    render(<ProgressBar label="Preparing" />);
    const root = screen.getByRole('progressbar');

    expect(root).toHaveAttribute('data-indeterminate', '');
    expect(root).not.toHaveAttribute('aria-valuenow');
    expect(root).not.toHaveAttribute('aria-valuetext');
    expect(root.querySelector('[data-part="value"]')).toBeNull();
  });

  it('clamps a value outside the range, and announces what it painted', () => {
    render(<ProgressBar label="Copying" showValue value={140} />);
    const root = screen.getByRole('progressbar');

    expect(root).toHaveAttribute('aria-valuenow', '100');
    expect(root).toHaveAttribute('aria-valuetext', '100%');
    expect(root).toHaveAttribute('data-complete', '');
    expect(root.querySelector('[data-part="value"]')?.textContent).toBe('100%');
  });

  it('marks the buffer only when there is one, and never behind the value', () => {
    const { rerender } = render(<ProgressBar buffer={72} label="Processing" value={34} />);
    let root = screen.getByRole('progressbar');
    expect(root).toHaveAttribute('data-buffered', '');
    expect(root.style.getPropertyValue('--slotted-progress-indicator-buffer-percent')).toBe('72');

    rerender(<ProgressBar buffer={12} label="Processing" value={34} />);
    root = screen.getByRole('progressbar');
    expect(root.style.getPropertyValue('--slotted-progress-indicator-buffer-percent')).toBe('34');

    rerender(<ProgressBar label="Processing" value={34} />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('data-buffered');
  });

  it('writes the number in the locale and the format it was given', () => {
    render(
      <ProgressBar
        format={{ style: 'unit', unit: 'megabyte', unitDisplay: 'narrow' }}
        label="Downloading"
        locale="en-US"
        max={512}
        showValue
        value={128}
      />,
    );

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '128MB');
  });

  it('lets a consumer say what the family cannot compute', () => {
    render(<ProgressBar label="Copying" showValue value={3} max={7} valueText="3 of 7 files" />);
    const root = screen.getByRole('progressbar');

    expect(root).toHaveAttribute('aria-valuetext', '3 of 7 files');
    expect(root.querySelector('[data-part="value"]')?.textContent).toBe('3 of 7 files');
  });

  /**
   * The page-level bar is the whole of what `loading-bar` was, and the label
   * it still needs has nowhere visible to go — so the placement decides
   * `hideLabel`, and a consumer who states it outright still wins.
   */
  it('hides the name of a page-level bar without losing it', () => {
    const { rerender } = render(<ProgressBar label="Loading page" placement="page" />);
    let label = screen.getByRole('progressbar').querySelector('[data-part="label"]');
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-placement', 'page');
    expect(label).toHaveAttribute('data-ui', 'visually-hidden');
    expect(label?.textContent).toBe('Loading page');

    rerender(<ProgressBar hideLabel={false} label="Loading page" placement="page" />);
    label = screen.getByRole('progressbar').querySelector('[data-part="label"]');
    expect(label).not.toHaveAttribute('data-ui');
  });

  /** An edge bar has no more room for its name than a page bar, and keeps it the same way. */
  it('stands a bar on either edge of its box, with its name clipped', () => {
    for (const placement of ['edge-start', 'edge-end'] as const) {
      const { unmount } = render(<ProgressBar label="Refreshing" placement={placement} />);
      const root = screen.getByRole('progressbar');
      expect(root).toHaveAttribute('data-placement', placement);
      expect(root.querySelector('[data-part="label"]')).toHaveAttribute(
        'data-ui',
        'visually-hidden',
      );
      expect(root).toHaveAccessibleName('Refreshing');
      unmount();
    }
    render(<ProgressBar label="Uploading" />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('data-placement');
  });

  it('passes native attributes and the ref through to the root', () => {
    const ref = createRef<HTMLDivElement>();
    render(<ProgressBar data-testid="bar" id="upload" label="Uploading" ref={ref} value={10} />);

    expect(ref.current).toBe(screen.getByTestId('bar'));
    expect(ref.current).toHaveAttribute('id', 'upload');
  });

  it('hands every attribute to a substituted element', () => {
    render(
      <ProgressBar
        label="Uploading"
        render={(props) => <section {...props} />}
        showValue
        value={40}
      />,
    );
    const root = screen.getByRole('progressbar');

    expect(root.tagName).toBe('SECTION');
    expect(root).toHaveAttribute('data-shape', 'linear');
    expect(root).toHaveAttribute('aria-valuenow', '40');
  });

  it('does not paint a wave unless asked', () => {
    const { rerender } = render(<ProgressBar label="Rendering" value={62} />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('data-wave');
    expect(screen.getByRole('progressbar').querySelector('svg')).toBeNull();

    rerender(<ProgressBar label="Rendering" value={62} wave />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-wave', '');
  });

  /**
   * The wavy indicator is a stroked path over the whole track, and the
   * markup states the two numbers the stylesheet's dash arithmetic rests on:
   * one unit is one thickness, and `pathLength` is the reach along the inline
   * axis. An indeterminate bar carries the tighter wave M3 draws while the
   * value is unknown.
   */
  it('draws the wave as one path whose length is its reach', () => {
    const { rerender } = render(<ProgressBar label="Rendering" value={62} wave />);
    let root = screen.getByRole('progressbar');
    const indicator = root.querySelector('[data-part="track"] > svg[data-part="indicator"]');
    expect(indicator).toHaveAttribute('aria-hidden', 'true');
    expect(indicator).toHaveAttribute('viewBox', `0 -1.25 ${PROGRESS_WAVE_BAR_REACH} 2.5`);

    const path = indicator?.querySelector('path');
    expect(path).toHaveAttribute('d', PROGRESS_WAVE_BAR_PATH);
    expect(path).toHaveAttribute('pathLength', String(PROGRESS_WAVE_BAR_REACH));

    rerender(<ProgressBar label="Rendering" wave />);
    root = screen.getByRole('progressbar');
    expect(root.querySelector('path')).toHaveAttribute('d', PROGRESS_WAVE_BAR_INDETERMINATE_PATH);
  });
});

describe('ProgressCircle', () => {
  it('draws two concentric shapes whose dash is the percentage itself', () => {
    render(<ProgressCircle label="Rebuilding" value={70} />);
    const root = screen.getByRole('progressbar');
    const shapes = root.querySelectorAll('svg circle');

    expect(root).toHaveAttribute('data-shape', 'circular');
    expect(shapes).toHaveLength(2);
    expect(shapes[0]).toHaveAttribute('data-part', 'track');
    expect(shapes[1]).toHaveAttribute('data-part', 'indicator');
    for (const shape of shapes) expect(shape).toHaveAttribute('pathLength', '100');
  });

  /** The drawing is pruned by the role already; the attribute survives `render`. */
  it('hides its own drawing from assistive technology', () => {
    render(<ProgressCircle label="Rebuilding" value={70} />);
    expect(screen.getByRole('progressbar').querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  /** The track stays a circle: only the active indicator waves, as in M3. */
  it('swaps the indicator for the wavy path, and back', () => {
    const { rerender } = render(<ProgressCircle label="Rendering" value={62} wave />);
    let root = screen.getByRole('progressbar');
    expect(root.querySelector('svg circle')).toHaveAttribute('data-part', 'track');
    expect(root.querySelector('svg path')).toHaveAttribute('data-part', 'indicator');
    expect(root.querySelector('svg path')).toHaveAttribute('d', PROGRESS_WAVE_RING_PATH);
    expect(root.querySelector('svg path')).toHaveAttribute('pathLength', '100');

    rerender(<ProgressCircle label="Rendering" value={62} />);
    root = screen.getByRole('progressbar');
    expect(root.querySelectorAll('svg path')).toHaveLength(0);
    expect(root.querySelectorAll('svg circle')).toHaveLength(2);
  });

  it('is the spinner every library ships when it is given no value', () => {
    render(<ProgressCircle label="Checking availability" />);
    const root = screen.getByRole('progressbar', { name: 'Checking availability' });

    expect(root).toHaveAttribute('data-indeterminate', '');
    expect(root).not.toHaveAttribute('aria-valuenow');
  });
});

describe('Loader', () => {
  it('is always indeterminate, and measures nothing', () => {
    render(<Loader label="Signing you in" />);
    const root = screen.getByRole('progressbar', { name: 'Signing you in' });

    expect(root).toHaveAttribute('data-shape', 'morph');
    expect(root).toHaveAttribute('data-indeterminate', '');
    expect(root).not.toHaveAttribute('aria-valuenow');
    expect(root).not.toHaveAttribute('aria-valuemin');
    expect(root).not.toHaveAttribute('aria-valuemax');
    expect(root.querySelector('[data-part="track"] > [data-part="indicator"]')).not.toBeNull();
  });

  it('draws M3’s container only when asked', () => {
    const { rerender } = render(<Loader label="Signing you in" />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('data-contained');

    rerender(<Loader contained label="Signing you in" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-contained', '');
  });
});

describe('the wait, and when it is reported', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /** The default has to cost nothing: no timer, and the consumer's own boolean. */
  it('paints immediately when no timing is stated', () => {
    render(<ProgressBar label="Uploading" value={40} />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('hidden');
  });

  /**
   * Withheld rather than reserved. A bar that held a four-pixel band open for
   * a wait it had decided not to report would shift the page twice for one
   * load: once for the band and once for the content.
   */
  it('paints nothing until the wait has lasted long enough to report', () => {
    render(<ProgressBar delay={200} label="Uploading" value={40} />);
    expect(screen.queryByRole('progressbar')).toBeNull();

    act(() => void vi.advanceTimersByTime(200));
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('hidden');
  });

  it('holds an indicator that did appear, and reports the withdrawal', () => {
    const onWithdraw = vi.fn();
    const { rerender } = render(
      <ProgressBar label="Uploading" minDuration={400} onWithdraw={onWithdraw} value={40} />,
    );

    rerender(
      <ProgressBar
        label="Uploading"
        loading={false}
        minDuration={400}
        onWithdraw={onWithdraw}
        value={100}
      />,
    );
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('hidden');
    expect(onWithdraw).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(400));
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(onWithdraw).toHaveBeenCalledTimes(1);
  });

  /** An application sets the policy once, and an indicator still overrides it. */
  it('takes the timing an application set on the provider', () => {
    render(
      <ProgressIndicatorDefaultsProvider delay={300}>
        <ProgressBar label="Uploading" value={40} />
        <ProgressBar delay={0} label="Immediate" value={40} />
      </ProgressIndicatorDefaultsProvider>,
    );

    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
    expect(screen.getByRole('progressbar', { name: 'Immediate' })).toBeInTheDocument();

    act(() => void vi.advanceTimersByTime(300));
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
  });
});

describe('the indicator that is not in the accessibility tree', () => {
  /**
   * The sentence section 9 of the feature guide writes about this family: a
   * lone spinner needs a name, or it is hidden because the text beside it
   * already names the wait.
   */
  it('has no role, no range and no name when it is decorative', () => {
    const { container } = render(<Loader decorative />);
    const root = container.querySelector('[data-ui="progress-indicator"]');

    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root).not.toHaveAttribute('role');
  });

  /**
   * `decorative` is one switch and not two: it takes the role away as well as
   * hiding the box, because an indicator with no role that a reader can still
   * reach is a `div` announcing nothing. A consumer's own `aria-hidden` is
   * passed through rather than overwritten, and the way back into the tree is
   * to stop saying `decorative`.
   */
  it('does not overwrite an aria-hidden the consumer wrote', () => {
    const { container } = render(<Loader aria-hidden="false" decorative />);
    const root = container.querySelector('[data-ui="progress-indicator"]');

    expect(root).toHaveAttribute('aria-hidden', 'false');
    expect(root).not.toHaveAttribute('role');
  });
});

describe('the application-wide defaults', () => {
  it('sets the appearance once, and yields to an indicator that states its own', () => {
    render(
      <ProgressIndicatorDefaultsProvider size="lg" tone="success">
        <ProgressBar label="Inherited" value={40} />
        <ProgressBar label="Stated" size="sm" tone="danger" value={40} />
      </ProgressIndicatorDefaultsProvider>,
    );

    const inherited = screen.getByRole('progressbar', { name: 'Inherited' });
    expect(inherited).toHaveAttribute('data-size', 'lg');
    expect(inherited).toHaveAttribute('data-tone', 'success');

    const stated = screen.getByRole('progressbar', { name: 'Stated' });
    expect(stated).toHaveAttribute('data-size', 'sm');
    expect(stated).toHaveAttribute('data-tone', 'danger');
  });

  it('writes the digits in the language the application chose', () => {
    render(
      <ProgressIndicatorDefaultsProvider locale="de-DE">
        <ProgressBar label="Hochladen" showValue value={7.5} />
      </ProgressIndicatorDefaultsProvider>,
    );

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '8\u00a0%');
  });

  it('names every indicator once, for a family that requires a name', () => {
    render(
      <ProgressIndicatorDefaultsProvider label="Loading…">
        <Loader />
      </ProgressIndicatorDefaultsProvider>,
    );

    expect(screen.getByRole('progressbar', { name: 'Loading…' })).toBeInTheDocument();
  });
});

describe('the missing name', () => {
  it('is reported in development, and rendered anyway', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<ProgressBar value={40} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('ProgressBar has no accessible name'),
    );
    warn.mockRestore();
  });

  it('is not reported for an indicator that left the tree on purpose', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Loader decorative />);

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
