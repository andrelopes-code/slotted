import type { Framework } from './frameworks';
import { byExampleId } from './frameworks';

type Loaders = Record<string, () => Promise<unknown>>;

type Runtime = { mount: (element: HTMLElement, module: unknown, id: string) => Promise<void> };

const runtimes: Record<Framework, () => Promise<Runtime>> = {
  react: () => import('./react.client'),
  angular: () => import('./angular.client'),
};

function isFramework(value: string | undefined): value is Framework {
  return value !== undefined && value in runtimes;
}

/**
 * Mounts the page's previews from the registry its route passes in: the
 * family's own examples. A registry of every example reached every example's
 * stylesheet from every page, which the build then linked into every head.
 *
 * A preview is mounted when it comes within half a viewport of being seen:
 * the build already drew it, so mounting only adds behavior, and a page of
 * twenty examples loads the runtime of the ones a reader reaches. Previews
 * mount one at a time, with the main thread handed back between two: a data
 * grid takes 100–500 ms to hydrate in a software-rendered Chrome, and three
 * reached by one scroll used to hydrate in the same frame.
 */
export function startPreviews(registry: Record<Framework, Loaders>): void {
  const loaders = {
    react: byExampleId(registry.react),
    angular: byExampleId(registry.angular),
  };

  async function mount(element: HTMLElement): Promise<void> {
    const { example, exampleFramework } = element.dataset;
    if (!example || !isFramework(exampleFramework)) return;
    const load = loaders[exampleFramework].get(example);
    if (!load) throw new Error(`No ${exampleFramework} example "${example}" on this page`);
    const [runtime, module] = await Promise.all([runtimes[exampleFramework](), load()]);
    await runtime.mount(element, module, example);
    element.dataset['exampleMounted'] = '';
  }

  const queue: HTMLElement[] = [];
  let draining = false;

  const yieldToBrowser = () =>
    new Promise<void>((resolve) =>
      'requestIdleCallback' in window
        ? requestIdleCallback(() => resolve(), { timeout: 300 })
        : setTimeout(resolve, 0),
    );

  async function drain(): Promise<void> {
    if (draining) return;
    draining = true;
    for (let element = queue.shift(); element; element = queue.shift()) {
      /* One preview that fails to mount does not keep the rest from mounting. */
      await mount(element).catch((error: unknown) => console.error(error));
      await yieldToBrowser();
    }
    draining = false;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        queue.push(entry.target as HTMLElement);
      }
      void drain();
    },
    { rootMargin: '50% 0px' },
  );

  for (const element of document.querySelectorAll<HTMLElement>('[data-example]')) {
    observer.observe(element);
  }
}
