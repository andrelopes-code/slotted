/**
 * The home page's ground, monochrome: rays of light from above the opening
 * that sway on their own, a glow at their source that breathes, and a light
 * that follows the pointer on a damped spring.
 *
 * Everything is drawn into a canvas a sixth of its CSS size and the browser
 * scales it up: the scaling is the softness, so nothing is blurred, and a
 * frame paints about twenty thousand pixels. That keeps it smooth where the
 * compositor runs in software, which is where layers of blurred elements had
 * cost 130 ms a frame. One still frame under reduced motion; nothing in high
 * contrast; no frame while the canvas is off screen or the tab is hidden.
 */

/** A sixth of the CSS size on a dark ground; a third on a light one, where the shade is fainter and steps show sooner. */
const scaleFor = (dark: boolean) => (dark ? 6 : 3);

interface Ray {
  /** Where the ray starts, as a share of the width. */
  at: number;
  /** Its width at the source and at the foot, as shares of the width. */
  near: number;
  far: number;
  /** Its angle at rest and how far it sways, in radians. */
  angle: number;
  sway: number;
  /** Seconds for one sway, and where in it the ray starts. */
  period: number;
  phase: number;
  strength: number;
}

const RAYS: Ray[] = [
  {
    at: 0.5,
    near: 0.035,
    far: 0.16,
    angle: 0.36,
    sway: 0.07,
    period: 19,
    phase: 0.1,
    strength: 0.8,
  },
  { at: 0.63, near: 0.06, far: 0.3, angle: 0.18, sway: 0.09, period: 27, phase: 0.55, strength: 1 },
  {
    at: 0.77,
    near: 0.025,
    far: 0.12,
    angle: -0.04,
    sway: 0.08,
    period: 23,
    phase: 0.8,
    strength: 0.7,
  },
];

interface Ink {
  rgb: string;
  ray: number;
  glow: number;
  light: number;
  dark: boolean;
  off: boolean;
}

function readInk(host: HTMLElement): Ink {
  const probe = document.createElement('span');
  probe.style.display = 'none';
  host.append(probe);
  probe.style.color = 'var(--docs-canvas, var(--slotted-surface))';
  const ground = getComputedStyle(probe).color;
  probe.remove();
  /* The computed color may be oklab or color(); a one-pixel canvas reads any of them back as sRGB. */
  const pixel = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  let luminance = 1;
  if (pixel) {
    pixel.fillStyle = ground;
    pixel.fillRect(0, 0, 1, 1);
    const [r = 255, g = 255, b = 255] = pixel.getImageData(0, 0, 1, 1).data;
    luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
  const dark = luminance < 0.5;
  return {
    /* Neutral, whatever hue the theme's ink carries: white light on a dark ground, shade on a light one. */
    rgb: dark ? '255, 255, 255' : '0, 0, 0',
    ray: dark ? 0.11 : 0.075,
    glow: dark ? 0.09 : 0.05,
    light: dark ? 0.065 : 0.04,
    dark,
    off: document.documentElement.getAttribute('data-slotted-scheme') === 'high-contrast',
  };
}

/** Starts the rays on `canvas`; returns the function that stops them. */
export function startRays(canvas: HTMLCanvasElement): () => void {
  const context = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
  if (!context) return () => {};
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const host = canvas.parentElement ?? document.body;
  let ink = readInk(host);
  let dither = new Int8Array(0);
  let width = 1;
  let height = 1;
  let visible = true;
  let frame = 0;
  let last = 0;
  let stopped = false;
  const started = performance.now();

  /* A damped spring per axis, slightly under critical, integrated on real time. */
  const STIFFNESS = 60;
  const DAMPING = 2 * Math.sqrt(STIFFNESS) * 0.85;
  const spring = (value: number) => ({ value, velocity: 0, target: value });
  const pointer = { x: spring(0.64), y: spring(0.3), lit: spring(0) };

  const ink$ = (alpha: number) => `rgba(${ink.rgb}, ${alpha})`;

  const draw = (seconds: number) => {
    context.clearRect(0, 0, width, height);
    if (ink.off) return;
    const lean = (pointer.x.value - 0.5) * 0.06;
    const shift = (pointer.x.value - 0.5) * width * 0.03;

    /* The source: a wide glow above the top edge that breathes. */
    const breath = 0.82 + 0.18 * Math.sin((seconds / 11) * Math.PI * 2);
    const sourceX = width * 0.64 + shift;
    const source = context.createRadialGradient(
      sourceX,
      -height * 0.08,
      0,
      sourceX,
      -height * 0.08,
      width * 0.42,
    );
    source.addColorStop(0, ink$(ink.glow * breath));
    source.addColorStop(1, ink$(0));
    context.fillStyle = source;
    context.fillRect(0, 0, width, height);

    /* The rays: quads from a narrow source to a wide foot, soft across and fading down. */
    for (const ray of RAYS) {
      const turn = Math.sin((seconds / ray.period + ray.phase) * Math.PI * 2);
      const angle = ray.angle + ray.sway * turn + lean;
      const pulse =
        0.78 + 0.22 * Math.sin((seconds / (ray.period * 0.7) + ray.phase) * Math.PI * 2);
      const length = height * 1.15;
      context.save();
      context.translate(width * ray.at + shift, -height * 0.06);
      context.rotate(angle);
      const near = (width * ray.near) / 2;
      const far = (width * ray.far) / 2;
      const across = context.createLinearGradient(-far, 0, far, 0);
      const alpha = ink.ray * ray.strength * pulse;
      across.addColorStop(0, ink$(0));
      across.addColorStop(0.5, ink$(alpha));
      across.addColorStop(1, ink$(0));
      context.fillStyle = across;
      context.beginPath();
      context.moveTo(-near, 0);
      context.lineTo(near, 0);
      context.lineTo(far, length);
      context.lineTo(-far, length);
      context.closePath();
      context.fill();
      context.restore();
    }

    /* The light under the pointer, faded with the rest by the same foot. */
    const lit = Math.max(0, Math.min(1, pointer.lit.value));
    if (lit > 0.002) {
      const x = pointer.x.value * width;
      const y = pointer.y.value * height;
      const radius = Math.max(width, height) * 0.22;
      const light = context.createRadialGradient(x, y, 0, x, y, radius);
      light.addColorStop(0, ink$(ink.light * lit));
      light.addColorStop(1, ink$(0));
      context.fillStyle = light;
      context.fillRect(0, 0, width, height);
    }
    /* Everything fades toward the foot, where the sections begin. */
    context.globalCompositeOperation = 'destination-in';
    const foot = context.createLinearGradient(0, 0, 0, height);
    foot.addColorStop(0, 'rgba(0, 0, 0, 1)');
    foot.addColorStop(0.55, 'rgba(0, 0, 0, 0.55)');
    foot.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = foot;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over';

    /*
     * Dither: at a few percent of ink an 8-bit alpha has a dozen steps, and
     * the browser's scaling turns the steps into wavering contours. A fixed
     * pattern of one level up or down breaks them.
     */
    const image = context.getImageData(0, 0, width, height);
    const pixels = image.data;
    for (let index = 3, cell = 0; index < pixels.length; index += 4, cell += 1) {
      const alpha = pixels[index]!;
      if (alpha > 0) pixels[index] = Math.max(0, Math.min(255, alpha + dither[cell]!));
    }
    context.putImageData(image, 0, 0);
  };

  const tick = (now: number) => {
    frame = 0;
    if (stopped) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    for (const axis of Object.values(pointer)) {
      const force = STIFFNESS * (axis.target - axis.value) - DAMPING * axis.velocity;
      axis.velocity += force * dt;
      axis.value += axis.velocity * dt;
    }
    draw(still.matches ? 0 : (now - started) / 1000);
    if (!still.matches && visible && !document.hidden && !ink.off) request();
    else last = 0;
  };

  function request() {
    if (frame === 0 && !stopped) frame = requestAnimationFrame(tick);
  }

  const resize = () => {
    const box = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(box.width / scaleFor(ink.dark)));
    height = Math.max(1, Math.round(box.height / scaleFor(ink.dark)));
    canvas.width = width;
    canvas.height = height;
    dither = Int8Array.from({ length: width * height }, () => Math.round(Math.random() * 2 - 1));
    request();
  };

  const move = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || still.matches) return;
    const box = canvas.getBoundingClientRect();
    const y = (event.clientY - box.top) / box.height;
    pointer.x.target = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    pointer.y.target = Math.min(1, Math.max(0, y));
    pointer.lit.target = y >= 0 && y <= 0.8 ? 1 : 0;
    request();
  };
  const leave = () => {
    pointer.lit.target = 0;
    request();
  };
  const restyle = () => {
    ink = readInk(host);
    resize();
  };

  const seen = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    request();
  });
  seen.observe(canvas);
  const sized = new ResizeObserver(resize);
  sized.observe(canvas);
  const themed = new MutationObserver(restyle);
  themed.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-slotted-scheme', 'data-slotted-theme', 'class'],
  });
  const scheme = matchMedia('(prefers-color-scheme: dark)');

  addEventListener('pointermove', move, { passive: true });
  document.documentElement.addEventListener('pointerleave', leave);
  document.addEventListener('visibilitychange', request);
  scheme.addEventListener('change', restyle);
  still.addEventListener('change', request);
  resize();

  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    seen.disconnect();
    sized.disconnect();
    themed.disconnect();
    removeEventListener('pointermove', move);
    document.documentElement.removeEventListener('pointerleave', leave);
    document.removeEventListener('visibilitychange', request);
    scheme.removeEventListener('change', restyle);
    still.removeEventListener('change', request);
  };
}
