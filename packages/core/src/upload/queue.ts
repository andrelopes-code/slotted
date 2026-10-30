import { toAdapter } from './types';
import type { UploadAdapterLike, UploadFile } from './types';

/**
 * The transfer, and everything about it that is not a picture.
 *
 * The runner does not hold the list — the family does, because the list is the
 * value a consumer can own. What the runner holds is the work: which files are
 * in flight, how many may be at once, what to do when one fails, and when to
 * decide that one has stopped without failing. It reports every movement as a
 * patch against one key, and the family applies it.
 *
 * Nothing here opens a connection. The adapter does that, and what it resolves
 * or rejects with is carried through untouched.
 */

export type UploadPatch = Partial<Omit<UploadFile, 'key'>>;

export interface UploadRunnerOptions {
  adapter: UploadAdapterLike;
  /**
   * How many transfers run at once. Uppy alone among the surveyed
   * implementations limits this; Ant Design and Vaadin start every file at
   * once, which is how twelve files on a slow uplink all stall together.
   */
  concurrency?: number | undefined;
  /**
   * How many times a failed transfer is sent again before the reader is told.
   *
   * Nought by default. An upload is a POST, and a POST that succeeded on the
   * server and failed on the response is duplicated by a retry — a second
   * invoice, a second attachment. A library may not choose that for an
   * application; the manual control is always there.
   */
  retries?: number | undefined;
  /** The first backoff, doubled for each further attempt. */
  retryDelay?: number | undefined;
  /**
   * How long without a `progress` call before a running transfer is called
   * stalled. Vaadin has the word in its i18n object and nothing that produces
   * it; a bar sitting at 43% with nothing to read is what this replaces.
   */
  stallAfter?: number | undefined;
  onPatch(key: string, patch: UploadPatch): void;
}

export interface UploadRunner {
  /** Takes the file and starts it as soon as there is a slot. */
  enqueue(key: string, file: File): void;
  /** Sends a file that was waiting for the reader, or one that was stopped. */
  start(key: string, file: File): void;
  pause(key: string): void;
  resume(key: string): void;
  /** Aborts the run and leaves the row in the list. */
  cancel(key: string): void;
  /** Aborts the run and forgets the file. */
  remove(key: string): void;
  /** Whether the running adapter says it honors the pause handshake. */
  readonly pausable: boolean;
  /** Aborts everything. Called when the family goes away. */
  destroy(): void;
}

interface Task {
  readonly key: string;
  readonly file: File;
  controller: AbortController;
  attempts: number;
  paused: boolean;
  release: (() => void) | null;
  resumed: Promise<void> | null;
  stallTimer: ReturnType<typeof setTimeout> | null;
  retryTimer: ReturnType<typeof setTimeout> | null;
  running: boolean;
}

export function createUploadRunner({
  adapter,
  concurrency = 3,
  retries = 0,
  retryDelay = 1000,
  stallAfter = 10000,
  onPatch,
}: UploadRunnerOptions): UploadRunner {
  const resolved = toAdapter(adapter);
  const tasks = new Map<string, Task>();
  const waiting: string[] = [];
  let destroyed = false;

  function clearTimers(task: Task) {
    if (task.stallTimer !== null) clearTimeout(task.stallTimer);
    if (task.retryTimer !== null) clearTimeout(task.retryTimer);
    task.stallTimer = null;
    task.retryTimer = null;
  }

  function forget(key: string) {
    const task = tasks.get(key);
    if (task !== undefined) {
      clearTimers(task);
      task.release?.();
      tasks.delete(key);
    }
    const index = waiting.indexOf(key);
    if (index !== -1) waiting.splice(index, 1);
  }

  function running() {
    return [...tasks.values()].filter((task) => task.running).length;
  }

  function pump() {
    if (destroyed) return;
    while (running() < concurrency && waiting.length > 0) {
      const key = waiting.shift();
      if (key === undefined) return;
      const task = tasks.get(key);
      if (task === undefined) continue;
      void run(task);
    }
  }

  function armStall(task: Task) {
    if (task.stallTimer !== null) clearTimeout(task.stallTimer);
    task.stallTimer = setTimeout(() => {
      if (task.running && !task.paused) onPatch(task.key, { status: 'stalled' });
    }, stallAfter);
  }

  async function run(task: Task) {
    task.running = true;
    task.attempts += 1;
    task.controller = new AbortController();
    onPatch(task.key, { status: 'uploading', attempts: task.attempts });
    armStall(task);

    const context = {
      signal: task.controller.signal,
      progress(loaded: number, total?: number) {
        if (!task.running) return;
        armStall(task);
        onPatch(task.key, {
          status: task.paused ? 'paused' : 'uploading',
          loaded,
          ...(total === undefined ? {} : { total }),
        });
      },
      /*
       * One promise per pause, not one per call. An adapter that asks twice
       * between two chunks would otherwise replace the first promise's release
       * with the second's, and the first `await` would never return.
       */
      whenResumed(): Promise<void> {
        if (!task.paused) return Promise.resolve();
        task.resumed ??= new Promise<void>((release) => {
          task.release = () => {
            task.release = null;
            task.resumed = null;
            release();
          };
        });
        return task.resumed;
      },
    };

    try {
      const response = await resolved.send(task.file, context);
      if (!tasks.has(task.key)) return;
      clearTimers(task);
      task.running = false;
      onPatch(task.key, { status: 'success', loaded: task.file.size, response });
    } catch (error) {
      if (!tasks.has(task.key)) return;
      clearTimers(task);
      task.running = false;

      if (task.controller.signal.aborted) {
        onPatch(task.key, { status: 'canceled' });
      } else if (task.attempts <= retries) {
        /*
         * Backoff doubles per attempt. The row stays `queued` while it waits,
         * because it is waiting for a slot in time rather than in the queue and
         * a reader watching it should not see a failure that is about to be
         * retried.
         */
        onPatch(task.key, { status: 'queued' });
        task.retryTimer = setTimeout(
          () => {
            task.retryTimer = null;
            if (tasks.has(task.key)) void run(task);
          },
          retryDelay * 2 ** (task.attempts - 1),
        );
        return;
      } else {
        onPatch(task.key, { status: 'error', error });
      }
    } finally {
      pump();
    }
  }

  function admit(key: string, file: File) {
    forget(key);
    tasks.set(key, {
      key,
      file,
      controller: new AbortController(),
      attempts: 0,
      paused: false,
      release: null,
      resumed: null,
      stallTimer: null,
      retryTimer: null,
      running: false,
    });
    waiting.push(key);
    onPatch(key, { status: 'queued', loaded: 0, error: undefined, response: undefined });
    pump();
  }

  return {
    pausable: resolved.pausable === true,

    enqueue: admit,
    start: admit,

    pause(key) {
      const task = tasks.get(key);
      if (task === undefined || !task.running) return;
      task.paused = true;
      if (task.stallTimer !== null) clearTimeout(task.stallTimer);
      task.stallTimer = null;
      onPatch(key, { status: 'paused' });
    },

    resume(key) {
      const task = tasks.get(key);
      if (task === undefined || !task.paused) return;
      task.paused = false;
      task.release?.();
      armStall(task);
      onPatch(key, { status: 'uploading' });
    },

    cancel(key) {
      const task = tasks.get(key);
      if (task === undefined) return;
      clearTimers(task);
      task.release?.();
      task.running = false;
      task.controller.abort();
      forget(key);
      onPatch(key, { status: 'canceled' });
      pump();
    },

    remove(key) {
      const task = tasks.get(key);
      if (task === undefined) return;
      task.controller.abort();
      forget(key);
      pump();
    },

    destroy() {
      destroyed = true;
      for (const task of [...tasks.values()]) {
        task.controller.abort();
        clearTimers(task);
        task.release?.();
      }
      tasks.clear();
      waiting.length = 0;
    },
  };
}
