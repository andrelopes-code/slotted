/**
 * Where the ink of a Lucide drawing actually falls inside the 24-unit viewBox.
 *
 * A mask is centred on the box that consumes it, so what has to be centred is
 * the ink and not the viewBox. Lucide frames each icon for the set rather than
 * for the middle: the `check` path is drawn from (4, 6) to (20, 17), and with
 * a stroke of 3 and round caps its ink runs from y 4.5 to y 18.5 — half a unit
 * above the middle of its own box, which is 0.208 | 0.250 | 0.292px of drift in
 * a checkbox at the three size steps and was the whole of what CK6 could not
 * remove from the sheet (CK9).
 *
 * The box is exact rather than sampled. Every extreme of a segment is either an
 * endpoint or a root of its derivative, and both are solvable in closed form
 * for the two curves Lucide draws — the cubic Bézier and the elliptical arc —
 * so the generator emits a number nothing has to be re-measured against.
 *
 * A stroke with round caps and round joins is the Minkowski sum of the geometry
 * with a disc of half the stroke width, so its box is the geometry's box grown
 * by that radius on every side. Lucide draws every icon with round caps and
 * round joins, and `renderGlyph` writes both into the root element.
 */

/** The viewBox every glyph is drawn in, and therefore the centre to reach. */
export const VIEW_BOX = 24;

const NUMBER = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
const COMMAND = /[MmLlHhVvCcSsQqTtAaZz]/;

function box() {
  return { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
}

function include(bounds, x, y) {
  bounds.minX = Math.min(bounds.minX, x);
  bounds.minY = Math.min(bounds.minY, y);
  bounds.maxX = Math.max(bounds.maxX, x);
  bounds.maxY = Math.max(bounds.maxY, y);
}

/** The roots of a quadratic, only where they fall inside a segment. */
function rootsInUnit(a, b, c) {
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) < 1e-12) return [];
    const t = -c / b;
    return t > 0 && t < 1 ? [t] : [];
  }
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return [];
  const root = Math.sqrt(discriminant);
  return [(-b + root) / (2 * a), (-b - root) / (2 * a)].filter((t) => t > 0 && t < 1);
}

function cubicAt(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/** Both endpoints, plus every turning point the curve has between them. */
function cubicBounds(bounds, x0, y0, x1, y1, x2, y2, x3, y3) {
  include(bounds, x0, y0);
  include(bounds, x3, y3);
  for (const [p0, p1, p2, p3, axis] of [
    [x0, x1, x2, x3, 'x'],
    [y0, y1, y2, y3, 'y'],
  ]) {
    /* The derivative of a cubic Bézier, written as a quadratic in `t`. */
    const a = 3 * (-p0 + 3 * p1 - 3 * p2 + p3);
    const b = 6 * (p0 - 2 * p1 + p2);
    const c = 3 * (p1 - p0);
    for (const t of rootsInUnit(a, b, c)) {
      const value = cubicAt(p0, p1, p2, p3, t);
      if (axis === 'x') include(bounds, value, y0);
      else include(bounds, x0, value);
    }
  }
}

/**
 * The endpoint parameterisation an `A` command carries, turned into the centre
 * parameterisation its extremes are solvable in — the conversion the SVG
 * specification writes out in F.6.5.
 */
function arcCentre(x0, y0, rx, ry, rotation, largeArc, sweep, x1, y1) {
  const phi = (rotation * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (x0 - x1) / 2;
  const dy = (y0 - y1) / 2;
  const x = cos * dx + sin * dy;
  const y = -sin * dx + cos * dy;

  let radiusX = Math.abs(rx);
  let radiusY = Math.abs(ry);
  const oversize = (x * x) / (radiusX * radiusX) + (y * y) / (radiusY * radiusY);
  if (oversize > 1) {
    const scale = Math.sqrt(oversize);
    radiusX *= scale;
    radiusY *= scale;
  }

  const denominator = radiusX * radiusX * y * y + radiusY * radiusY * x * x;
  const numerator = radiusX * radiusX * radiusY * radiusY - denominator;
  const factor = (largeArc === sweep ? -1 : 1) * Math.sqrt(Math.max(0, numerator / denominator));
  const cxPrime = (factor * radiusX * y) / radiusY;
  const cyPrime = (-factor * radiusY * x) / radiusX;
  const cx = cos * cxPrime - sin * cyPrime + (x0 + x1) / 2;
  const cy = sin * cxPrime + cos * cyPrime + (y0 + y1) / 2;

  const angle = (ux, uy, vx, vy) => {
    const sign = ux * vy - uy * vx < 0 ? -1 : 1;
    const cosine = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy));
    return sign * Math.acos(Math.min(1, Math.max(-1, cosine)));
  };
  const startX = (x - cxPrime) / radiusX;
  const startY = (y - cyPrime) / radiusY;
  const endX = (-x - cxPrime) / radiusX;
  const endY = (-y - cyPrime) / radiusY;
  const start = angle(1, 0, startX, startY);
  let sweepAngle = angle(startX, startY, endX, endY);
  if (!sweep && sweepAngle > 0) sweepAngle -= 2 * Math.PI;
  if (sweep && sweepAngle < 0) sweepAngle += 2 * Math.PI;

  return { cx, cy, rx: radiusX, ry: radiusY, phi, start, sweep: sweepAngle };
}

function arcBounds(bounds, x0, y0, rx, ry, rotation, largeArc, sweep, x1, y1) {
  include(bounds, x0, y0);
  include(bounds, x1, y1);
  if (rx === 0 || ry === 0) return;
  const arc = arcCentre(x0, y0, rx, ry, rotation, largeArc, sweep, x1, y1);
  const cos = Math.cos(arc.phi);
  const sin = Math.sin(arc.phi);
  const at = (theta) => [
    arc.cx + arc.rx * cos * Math.cos(theta) - arc.ry * sin * Math.sin(theta),
    arc.cy + arc.rx * sin * Math.cos(theta) + arc.ry * cos * Math.sin(theta),
  ];
  /* Where each axis stops moving: the two roots of the derivative in θ. */
  const candidates = [
    Math.atan2(-arc.ry * sin, arc.rx * cos),
    Math.atan2(arc.ry * cos, arc.rx * sin),
  ].flatMap((theta) => [theta, theta + Math.PI, theta - Math.PI, theta + 2 * Math.PI]);
  const end = arc.start + arc.sweep;
  const [low, high] = [Math.min(arc.start, end), Math.max(arc.start, end)];
  for (const theta of candidates) {
    for (const turn of [-2 * Math.PI, 0, 2 * Math.PI]) {
      const angle = theta + turn;
      if (angle < low || angle > high) continue;
      include(bounds, ...at(angle));
    }
  }
}

/** Every point a path command can put ink at, in the order the path is drawn. */
function pathBounds(bounds, data) {
  const tokens = data.match(new RegExp(`${COMMAND.source}|${NUMBER.source}`, 'g')) ?? [];
  let index = 0;
  let command = '';
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  const next = () => Number(tokens[index++]);

  while (index < tokens.length) {
    if (COMMAND.test(tokens[index])) {
      command = tokens[index++];
    } else if (command === 'M') {
      command = 'L';
    } else if (command === 'm') {
      command = 'l';
    }
    const relative = command === command.toLowerCase();
    const originX = relative ? x : 0;
    const originY = relative ? y : 0;

    switch (command.toUpperCase()) {
      case 'M': {
        x = originX + next();
        y = originY + next();
        startX = x;
        startY = y;
        include(bounds, x, y);
        break;
      }
      case 'L': {
        x = originX + next();
        y = originY + next();
        include(bounds, x, y);
        break;
      }
      case 'H': {
        x = originX + next();
        include(bounds, x, y);
        break;
      }
      case 'V': {
        y = originY + next();
        include(bounds, x, y);
        break;
      }
      case 'C': {
        const x1 = originX + next();
        const y1 = originY + next();
        const x2 = originX + next();
        const y2 = originY + next();
        const x3 = originX + next();
        const y3 = originY + next();
        cubicBounds(bounds, x, y, x1, y1, x2, y2, x3, y3);
        x = x3;
        y = y3;
        break;
      }
      case 'A': {
        const rx = next();
        const ry = next();
        const rotation = next();
        const largeArc = next() === 1;
        const sweep = next() === 1;
        const x1 = originX + next();
        const y1 = originY + next();
        arcBounds(bounds, x, y, rx, ry, rotation, largeArc, sweep, x1, y1);
        x = x1;
        y = y1;
        break;
      }
      case 'Z': {
        x = startX;
        y = startY;
        break;
      }
      default:
        throw new Error(`Unsupported path command "${command}" in "${data}"`);
    }
  }
}

/**
 * The box the geometry of one Lucide node occupies, before the stroke is
 * drawn. A rounded corner only pulls a rectangle inward, so `rx` and `ry` do
 * not enter the box.
 */
export function geometryBox(node) {
  const bounds = box();
  for (const [tag, attributes] of node) {
    const value = (name) => Number(attributes[name]);
    switch (tag) {
      case 'path':
        pathBounds(bounds, attributes.d);
        break;
      case 'circle':
        include(bounds, value('cx') - value('r'), value('cy') - value('r'));
        include(bounds, value('cx') + value('r'), value('cy') + value('r'));
        break;
      case 'ellipse':
        include(bounds, value('cx') - value('rx'), value('cy') - value('ry'));
        include(bounds, value('cx') + value('rx'), value('cy') + value('ry'));
        break;
      case 'rect':
        include(bounds, value('x'), value('y'));
        include(bounds, value('x') + value('width'), value('y') + value('height'));
        break;
      case 'line':
        include(bounds, value('x1'), value('y1'));
        include(bounds, value('x2'), value('y2'));
        break;
      case 'polyline':
      case 'polygon': {
        const numbers = (attributes.points.match(NUMBER) ?? []).map(Number);
        for (let at = 0; at + 1 < numbers.length; at += 2) {
          include(bounds, numbers[at], numbers[at + 1]);
        }
        break;
      }
      default:
        throw new Error(`Unsupported glyph element "${tag}"`);
    }
  }
  return bounds;
}

/**
 * The box the painted glyph occupies. A stroke grows the geometry by half its
 * width on every side; a fill is the geometry itself.
 */
export function inkBox(node, { paint, strokeWidth }) {
  const bounds = geometryBox(node);
  const grow = paint === 'fill' ? 0 : strokeWidth / 2;
  return {
    minX: bounds.minX - grow,
    minY: bounds.minY - grow,
    maxX: bounds.maxX + grow,
    maxY: bounds.maxY + grow,
  };
}

/**
 * How far the ink has to move for its centre to be the centre of the box.
 *
 * Three decimals of a viewBox unit is 0.0007px in a sixteen-pixel mask, which
 * is under the precision the arc solver itself carries: `loader-circle` is a
 * circle drawn as two arcs and comes out 0.0004 of a unit off centre, and that
 * is the solver rounding, not the drawing. Rounding here is what keeps a
 * drawing that is already centred from being wrapped in a transform that moves
 * it by nothing.
 */
export function centringOffset(node, options) {
  const ink = inkBox(node, options);
  const round = (value) => Number(value.toFixed(3));
  return {
    dx: round(VIEW_BOX / 2 - (ink.minX + ink.maxX) / 2),
    dy: round(VIEW_BOX / 2 - (ink.minY + ink.maxY) / 2),
  };
}

/**
 * The optical correction: the offset that puts the glyph's main shape — the
 * elements `body` names — on the centre, rather than its whole ink. The eye
 * centres a calendar on its page and not on the rings above it: centred on
 * the whole ink, the page sat 1 unit low, 0.6px beside a 14px label's
 * cap-height centre. The move is held inside the box, so no protrusion is
 * pushed past the viewBox.
 */
export function opticalOffset(node, body, options) {
  const ink = inkBox(node, options);
  const main = centringOffset(
    body.map((index) => node[index]),
    options,
  );
  const hold = (move, min, max) => Math.min(VIEW_BOX - max, Math.max(-min, move));
  return {
    dx: Number(hold(main.dx, ink.minX, ink.maxX).toFixed(3)),
    dy: Number(hold(main.dy, ink.minY, ink.maxY).toFixed(3)),
  };
}
