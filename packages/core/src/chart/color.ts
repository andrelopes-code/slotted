/**
 * A resolved color as `rgb()` or `rgba()`, which is what the engine and the
 * family's own mixing read. A browser computes a color written in an sRGB
 * syntax (hex, a name, `hsl()`) to `rgb()`, and keeps any other space as it
 * was written: `oklch()`, `lab()`, `color(srgb …)` for a `color-mix()`. Those
 * are drawn once into a one-pixel canvas and read back, which converts them to
 * sRGB as the screen shows them. Without a canvas (a server, a test document)
 * the color is returned as it came.
 */
export function toRgb(color: string, document: Document | undefined) {
  if (/^rgba?\(/.test(color) || !CONVERTIBLE.test(color) || document === undefined) return color;

  const known = cache.get(color);
  if (known !== undefined) return known;

  const context = canvasOf(document);
  if (context === null) return color;

  context.clearRect(0, 0, 1, 1);
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
  const rgb = a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${round(a! / 255)})`;

  cache.set(color, rgb);

  return rgb;
}

/** The syntaxes a browser keeps in their own space when it computes them. */
const CONVERTIBLE = /^(?:#|(?:oklch|oklab|lch|lab|color|hsla?|hwb|color-mix)\()/i;

const cache = new Map<string, string>();
const contexts = new WeakMap<Document, CanvasRenderingContext2D | null>();

function canvasOf(document: Document) {
  if (contexts.has(document)) return contexts.get(document)!;

  const context = drawingContext(document);
  contexts.set(document, context);

  return context;
}

function drawingContext(document: Document) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    return canvas.getContext('2d', { willReadFrequently: true });
  } catch {
    return null;
  }
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}
