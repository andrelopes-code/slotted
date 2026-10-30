import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  MediaViewer,
  MediaViewerActions,
  MediaViewerBar,
  MediaViewerStage,
  MediaViewerThumbnails,
} from './index';
import type { MediaViewerItem } from './index';

const ITEMS: MediaViewerItem[] = [
  { id: 'a', name: 'harbour.png', type: 'image/png', src: 'a.png', caption: 'The harbour.' },
  { id: 'b', name: 'contract.pdf', type: 'application/pdf', src: 'b.pdf', downloadHref: 'b.pdf' },
  {
    id: 'c',
    name: 'budget.xlsx',
    type: 'application/vnd.ms-excel',
    src: 'c.xlsx',
    downloadHref: 'c.xlsx',
  },
];

const part = (name: string) =>
  document.querySelector<HTMLElement>(`[data-ui="media-viewer"] [data-part="${name}"]`);
const root = () => document.querySelector<HTMLElement>('[data-ui="media-viewer"]')!;
const key = (name: string) => fireEvent.keyDown(part('stage')!, { key: name });

describe('MediaViewer', () => {
  it('names the layer by the file and describes it by its position', () => {
    render(<MediaViewer defaultOpen items={ITEMS} />);
    const dialog = screen.getByRole('dialog');

    expect(dialog).toHaveAccessibleName('harbour.png');
    expect(dialog).toHaveAccessibleDescription('1 of 3');
    expect(root()).toHaveAttribute('data-slotted-scheme', 'dark');
    expect(part('caption')).toHaveTextContent('The harbour.');
  });

  it('steps with the buttons and the arrows, and stops at the ends without loop', () => {
    const onValueChange = vi.fn();
    render(<MediaViewer defaultOpen items={ITEMS} onValueChange={onValueChange} />);

    expect(part('previous')).toBeDisabled();
    fireEvent.click(part('next')!);
    expect(onValueChange).toHaveBeenLastCalledWith(
      'b',
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(screen.getByRole('dialog')).toHaveAccessibleName('contract.pdf');

    key('ArrowRight');
    expect(onValueChange).toHaveBeenLastCalledWith(
      'c',
      expect.objectContaining({ reason: 'keyboard' }),
    );
    expect(part('next')).toBeDisabled();

    key('Home');
    expect(screen.getByRole('dialog')).toHaveAccessibleName('harbour.png');
  });

  it('wraps at the ends with loop', () => {
    render(<MediaViewer defaultOpen items={ITEMS} loop />);

    key('ArrowLeft');
    expect(screen.getByRole('dialog')).toHaveAccessibleName('budget.xlsx');
  });

  it('asks the consumer in controlled mode and moves only when the value comes back', () => {
    const onValueChange = vi.fn();
    render(<MediaViewer defaultOpen items={ITEMS} onValueChange={onValueChange} value="a" />);

    fireEvent.click(part('next')!);
    expect(onValueChange).toHaveBeenCalledWith('b', expect.objectContaining({ reason: 'pointer' }));
    expect(screen.getByRole('dialog')).toHaveAccessibleName('harbour.png');
  });

  it('refuses a step the consumer cancels', () => {
    render(
      <MediaViewer
        defaultOpen
        items={ITEMS}
        onValueChange={(_value, request) => {
          request.cancel();
        }}
      />,
    );

    fireEvent.click(part('next')!);
    expect(screen.getByRole('dialog')).toHaveAccessibleName('harbour.png');
  });

  it('puts the level and the turn back with the reason select on a step', () => {
    const onZoomChange = vi.fn();
    const onRotationChange = vi.fn();
    render(
      <MediaViewer
        defaultOpen
        defaultRotation={90}
        defaultZoom={2}
        items={ITEMS}
        onRotationChange={onRotationChange}
        onZoomChange={onZoomChange}
      />,
    );

    fireEvent.click(part('next')!);
    expect(onZoomChange).toHaveBeenCalledWith(1, expect.objectContaining({ reason: 'select' }));
    expect(onRotationChange).toHaveBeenCalledWith(0, expect.objectContaining({ reason: 'select' }));
  });

  it('passes to the neighbour with the reason remove when the shown item leaves the set', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <MediaViewer defaultOpen defaultValue="b" items={ITEMS} onValueChange={onValueChange} />,
    );

    rerender(
      <MediaViewer
        defaultOpen
        defaultValue="b"
        items={ITEMS.filter((item) => item.id !== 'b')}
        onValueChange={onValueChange}
      />,
    );
    expect(onValueChange).toHaveBeenCalledWith('c', expect.objectContaining({ reason: 'remove' }));
  });

  it('closes with the close button and reports the reason', () => {
    const onOpenChange = vi.fn();
    render(<MediaViewer defaultOpen items={ITEMS} onOpenChange={onOpenChange} />);

    fireEvent.click(part('close')!);
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('draws a PDF in a frame with no zoom, and sets a JSON file as indented text', async () => {
    render(
      <MediaViewer
        defaultOpen
        defaultValue="b"
        items={[
          ...ITEMS,
          { id: 'j', name: 'claim.json', type: '', src: 'data:application/json,{"claim":"0914"}' },
        ]}
      />,
    );
    expect(part('media')?.tagName).toBe('IFRAME');
    expect(part('media')).not.toHaveAttribute('sandbox');
    expect(part('zoom')).toBeNull();

    key('End');
    expect(await screen.findByText(/"claim": "0914"/)).toHaveAttribute('data-part', 'media');
    expect(part('media')?.tagName).toBe('PRE');
  });

  it('offers the file it cannot draw for download, with its extension on the tile', () => {
    render(<MediaViewer defaultOpen defaultValue="c" items={ITEMS} />);

    expect(part('unsupported')).toHaveTextContent('No preview for this file');
    expect(part('unsupported')).toHaveTextContent('XLSX files open in the app that made them.');
    expect(part('tile')).toHaveTextContent('XLSX');
    expect(screen.getAllByRole('link', { name: 'Download' })[0]).toHaveAttribute(
      'download',
      'budget.xlsx',
    );
  });

  it('zooms a picture with the keys once it has loaded, within the limits', () => {
    const onZoomChange = vi.fn();
    render(<MediaViewer defaultOpen items={ITEMS} maxZoom={1.5} onZoomChange={onZoomChange} />);
    act(() => {
      fireEvent.load(part('media')!);
    });

    key('+');
    key('+');
    key('+');
    expect(onZoomChange).toHaveBeenLastCalledWith(
      1.5,
      expect.objectContaining({ reason: 'keyboard' }),
    );
    expect(part('zoom-in')).toBeDisabled();

    key('0');
    expect(onZoomChange).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({ reason: 'keyboard' }),
    );
  });

  it('turns a picture a quarter at a time', () => {
    const onRotationChange = vi.fn();
    render(<MediaViewer defaultOpen items={ITEMS} onRotationChange={onRotationChange} />);
    act(() => {
      fireEvent.load(part('media')!);
    });

    fireEvent.click(part('rotate')!);
    key('r');
    expect(onRotationChange).toHaveBeenNthCalledWith(
      1,
      90,
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(onRotationChange).toHaveBeenNthCalledWith(
      2,
      180,
      expect.objectContaining({ reason: 'keyboard' }),
    );
  });

  it('shows the failure, tries again, and offers the download, with no zoom', () => {
    render(<MediaViewer defaultOpen items={[{ ...ITEMS[0]!, downloadHref: 'a.png' }]} />);
    act(() => {
      fireEvent.error(part('media')!);
    });

    expect(part('status')).toHaveTextContent('This file didn’t load');
    expect(part('zoom')).toBeNull();
    expect(screen.getAllByRole('link', { name: 'Download' })).toHaveLength(2);

    fireEvent.click(part('retry')!);
    expect(part('media')?.tagName).toBe('IMG');
  });

  it('lets the consumer arrange the parts and add thumbnails', () => {
    function Viewer() {
      const [value, setValue] = useState('a');

      return (
        <MediaViewer defaultOpen items={ITEMS} onValueChange={setValue} value={value}>
          <MediaViewerBar>
            <MediaViewerActions>
              <button type="button">Share</button>
            </MediaViewerActions>
          </MediaViewerBar>
          <MediaViewerStage />
          <MediaViewerThumbnails aria-label="Files" />
        </MediaViewer>
      );
    }
    render(<Viewer />);

    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'budget.xlsx' }));
    expect(screen.getByRole('button', { name: 'budget.xlsx' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('runs the consumer handler first and lets it prevent the close', () => {
    const onOpenChange = vi.fn();
    render(
      <MediaViewer defaultOpen items={ITEMS} onOpenChange={onOpenChange}>
        <MediaViewerBar />
      </MediaViewer>,
    );
    const close = part('close')!;
    close.addEventListener('click', (event) => event.preventDefault(), { once: true });

    fireEvent.click(close);
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
