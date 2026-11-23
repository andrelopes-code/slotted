import { expect } from 'vitest';
import { cdp } from 'vitest/browser';

/**
 * Where ink is painted, read from the pixels of a capture. Text and icons snap
 * to the pixel grid each on its own, so two boxes with one center can draw two.
 */

export interface InkSpan {
  readonly top: number;
  readonly bottom: number;
  readonly center: number;
}

interface Painted {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  /** Pixels of the capture per CSS pixel. */
  readonly scale: number;
  /** The test frame's corner in the capture, in CSS pixels. */
  readonly origin: { readonly x: number; readonly y: number };
}

/** Runs with the page drawn at a device pixel ratio, and puts the ratio back. */
export async function atPixelRatio<Value>(ratio: number, run: () => Promise<Value>) {
  await cdp().send('Emulation.setDeviceMetricsOverride', {
    width: window.top!.innerWidth,
    height: window.top!.innerHeight,
    deviceScaleFactor: ratio,
    mobile: false,
  });

  try {
    await expect.poll(() => window.devicePixelRatio).toBe(ratio);

    return await run();
  } finally {
    await cdp().send('Emulation.clearDeviceMetricsOverride');
  }
}

/**
 * The painted page, decoded. `page.screenshot` draws at the ratio the browser
 * started with, so the capture is the protocol's own.
 */
export async function paint(): Promise<Painted> {
  const capture = await cdp().send('Page.captureScreenshot', { format: 'png' });
  const image = new Image();
  image.src = `data:image/png;base64,${(capture as { data: string }).data}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d')!;
  context.drawImage(image, 0, 0);
  const frame = window.frameElement?.getBoundingClientRect();

  return {
    data: context.getImageData(0, 0, image.width, image.height).data,
    width: image.width,
    height: image.height,
    scale: image.width / window.top!.innerWidth,
    origin: { x: frame?.left ?? 0, y: frame?.top ?? 0 },
  };
}

/**
 * The block span of the ink inside a box, in CSS pixels. A row at
 * either end that is partly covered counts for the part it covers.
 */
export function inkSpan(painted: Painted, box: DOMRect): InkSpan {
  const { data, origin, scale, width } = painted;
  const left = Math.round((box.left + origin.x) * scale);
  const right = Math.round((box.right + origin.x) * scale);
  const top = Math.floor((box.top + origin.y) * scale);
  const bottom = Math.ceil((box.bottom + origin.y) * scale);
  const luminance = (x: number, y: number) => {
    const at = (y * width + x) * 4;
    return 0.2126 * data[at]! + 0.7152 * data[at + 1]! + 0.0722 * data[at + 2]!;
  };
  const ground = luminance(left, top);

  const rows: number[] = [];
  for (let y = top; y < bottom; y += 1) {
    let strongest = 0;
    for (let x = left; x < right; x += 1) {
      strongest = Math.max(strongest, Math.abs(luminance(x, y) - ground));
    }
    rows.push(strongest);
  }

  const full = Math.max(...rows);
  const inked = rows.map((row) => row > full * 0.1);
  const first = inked.indexOf(true);
  const last = inked.lastIndexOf(true);
  const start = (top + first + 1 - rows[first]! / full) / scale;
  const end = (top + last + rows[last]! / full) / scale;

  return {
    top: start - origin.y,
    bottom: end - origin.y,
    center: (start + end) / 2 - origin.y,
  };
}
