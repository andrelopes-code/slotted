import type { ChartKind } from '../chart/index';

/**
 * The engine, fetched in pieces and only when a plot needs them.
 *
 * Each chunk is a module that imports its part of ECharts and lists the
 * extensions to register. A bundler turns every `import()` below into a file
 * of its own, so a page of line charts never downloads the pie. The chunks
 * are cached as promises: a second chart asks for a chunk the first one is
 * still downloading and waits on the same request.
 */

type Extension = unknown;
interface Chunk {
  readonly extensions: readonly Extension[];
}
interface BaseChunk extends Chunk {
  readonly init: typeof import('echarts/core').init;
  readonly use: typeof import('echarts/core').use;
}

const CHUNKS: Readonly<Record<string, () => Promise<Chunk>>> = {
  base: () => import('./modules/base'),
  cartesian: () => import('./modules/cartesian'),
  line: () => import('./modules/line'),
  bar: () => import('./modules/bar'),
  pie: () => import('./modules/pie'),
  scatter: () => import('./modules/scatter'),
  canvas: () => import('./modules/canvas'),
  annotations: () => import('./modules/annotations'),
  zoom: () => import('./modules/zoom'),
  texture: () => import('./modules/texture'),
  labels: () => import('./modules/labels'),
};

const loaded = new Map<string, Promise<Chunk>>();
const registered = new Set<string>();

function load(name: string) {
  let chunk = loaded.get(name);
  if (!chunk) {
    const loader = CHUNKS[name];
    if (!loader) return Promise.reject(new Error(`chart: no engine chunk named ${name}`));
    /* A failed download is forgotten, so the retry the error state offers
       asks the network again rather than replaying the failure. */
    chunk = loader().catch((error: unknown) => {
      loaded.delete(name);
      throw error;
    });
    loaded.set(name, chunk);
  }
  return chunk;
}

export interface EngineApi {
  readonly init: BaseChunk['init'];
}

/** Resolves once every named chunk is downloaded and registered. */
export async function loadEngine(names: readonly string[]): Promise<EngineApi> {
  const [base, ...rest] = (await Promise.all(
    ['base', ...names.filter((name) => name !== 'base')].map(load),
  )) as [BaseChunk, ...Chunk[]];
  const all = ['base', ...names.filter((name) => name !== 'base')];
  [base, ...rest].forEach((chunk, index) => {
    const name = all[index]!;
    if (registered.has(name)) return;
    base.use(chunk.extensions as Parameters<BaseChunk['use']>[0]);
    registered.add(name);
  });
  return { init: base.init };
}

/**
 * The component types an update may replace wholesale: `series` always, and
 * the grid, the axes and the zoom only once the chunk that registers them has
 * been registered on this page. ECharts refuses a `replaceMerge` naming a type
 * it does not know, so a page whose only chart is a pie, or whose charts never
 * zoom, failed its first draw; a page where any other chart had loaded those
 * chunks drew, which is how the harness hid it. A chunk stays registered once
 * it is, so a chart that stops zooming still names `dataZoom` and clears it.
 */
export function replaceableComponents(): string[] {
  return [
    'series',
    ...(registered.has('cartesian') ? ['xAxis', 'yAxis', 'grid'] : []),
    ...(registered.has('zoom') ? ['dataZoom'] : []),
  ];
}

/**
 * Fetches the engine before any chart mounts, so the first chart on a page
 * draws in its first frame instead of after a skeleton. Call it where the
 * route that holds the charts starts loading.
 */
export function preloadChartEngine(
  kinds: readonly ChartKind[] = ['line', 'bar'],
  options: { readonly renderer?: 'svg' | 'canvas' } = {},
): Promise<void> {
  const names = new Set<string>(['base']);
  for (const kind of kinds) {
    names.add(kind === 'area' ? 'line' : kind);
    if (kind !== 'pie') names.add('cartesian');
  }
  if (options.renderer === 'canvas') names.add('canvas');
  return loadEngine([...names]).then(() => undefined);
}
