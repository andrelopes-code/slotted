import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { formatBytes, formatDuration } from './format';
import { fileKind, isViewable, splitName } from './kinds';
import { createUploadRunner } from './queue';
import { fileKey, selectFiles } from './selection';
import { estimateRemaining, uploadSummary } from './summary';
import { filesOf, isPending, toAdapter } from './types';
import type { UploadFile, UploadPatch } from './index';

function makeFile(name: string, { size = 100, type = '', lastModified = 1 } = {}): File {
  const file = new File(['x'], name, { type, lastModified });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('fileKind', () => {
  it('reads the platform’s own answer before the name', () => {
    expect(fileKind({ name: 'report.txt', type: 'application/pdf' })).toBe('pdf');
    expect(fileKind({ name: 'photo.pdf', type: 'image/png' })).toBe('image');
  });

  it('falls back to the extension when the platform gave no type', () => {
    expect(fileKind({ name: 'claim.pdf', type: '' })).toBe('pdf');
    expect(fileKind({ name: 'notes.docx', type: '' })).toBe('document');
    expect(fileKind({ name: 'estimate.xlsx', type: '' })).toBe('spreadsheet');
    expect(fileKind({ name: 'review.pptx', type: '' })).toBe('presentation');
    expect(fileKind({ name: 'shot.HEIC', type: '' })).toBe('image');
    expect(fileKind({ name: 'clip.mp4', type: '' })).toBe('video');
    expect(fileKind({ name: 'call.m4a', type: '' })).toBe('audio');
    expect(fileKind({ name: 'archive.zip', type: '' })).toBe('archive');
  });

  /** A PDF and a word-processed document are the pair a reader has to tell apart. */
  it('keeps a pdf and a document apart', () => {
    expect(fileKind({ name: 'a.pdf', type: 'application/pdf' })).toBe('pdf');
    expect(fileKind({ name: 'a.docx', type: 'application/msword' })).toBe('document');
  });

  it('answers with the fallback when it can tell nothing', () => {
    expect(fileKind({ name: 'scan0001', type: '' })).toBe('other');
    expect(fileKind({ name: 'data.bin', type: 'application/octet-stream' })).toBe('other');
  });
});

describe('isViewable', () => {
  it('names the five the browser renders on its own', () => {
    for (const type of ['image/png', 'application/pdf', 'text/plain', 'video/mp4', 'audio/mpeg']) {
      expect(isViewable({ type })).toBe(true);
    }
  });

  /** A browser draws neither, and drawing one needs a server or a whole engine. */
  it('refuses what it would have to render itself', () => {
    expect(isViewable({ type: 'application/vnd.ms-excel' })).toBe(false);
    expect(isViewable({ type: 'application/zip' })).toBe(false);
    expect(isViewable({ type: '' })).toBe(false);
  });
});

describe('splitName', () => {
  it('splits at the last dot, so the extension survives the truncation', () => {
    expect(splitName('quarterly-report-final.v7.pdf')).toEqual({
      stem: 'quarterly-report-final.v7',
      extension: '.pdf',
    });
  });

  it('leaves a name with nothing to split in one piece', () => {
    expect(splitName('scan0001')).toEqual({ stem: 'scan0001', extension: '' });
    expect(splitName('.gitignore')).toEqual({ stem: '.gitignore', extension: '' });
    expect(splitName('trailing.')).toEqual({ stem: 'trailing.', extension: '' });
  });
});

describe('selectFiles', () => {
  const png = () => makeFile('one.png', { type: 'image/png' });

  it('appends for a multiple upload and replaces for a single one', () => {
    const first = selectFiles([png()], [], {});
    const second = selectFiles([makeFile('two.png', { type: 'image/png' })], first.files, {});
    expect(second.files.map((entry) => entry.name)).toEqual(['one.png', 'two.png']);

    const single = selectFiles([makeFile('two.png', { type: 'image/png' })], first.files, {
      multiple: false,
    });
    expect(single.files.map((entry) => entry.name)).toEqual(['two.png']);
  });

  /** Silence leaves the reader looking for a file that never appeared. */
  it('keeps a refused file in the list, with its reason', () => {
    const { files, rejected } = selectFiles(
      [makeFile('doc.pdf', { type: 'application/pdf' })],
      [],
      {
        accept: 'image/*',
      },
    );
    expect(files).toHaveLength(1);
    expect(files[0]?.status).toBe('rejected');
    expect(files[0]?.reason).toBe('type');
    expect(rejected).toEqual(files);
  });

  it('judges a file once and reports the first reason only', () => {
    const wrong = makeFile('big.pdf', { size: 9000, type: 'application/pdf' });
    const { files } = selectFiles([wrong], [], { accept: 'image/*', maxSize: 10 });
    expect(files[0]?.reason).toBe('type');
  });

  it('answers each restriction with its own reason', () => {
    const reason = (rules: Parameters<typeof selectFiles>[2], file = png()) =>
      selectFiles([file], [], rules).files[0]?.reason;

    expect(reason({ maxSize: 10 })).toBe('size');
    expect(reason({ minSize: 1000 })).toBe('minSize');
    expect(reason({ maxTotalSize: 10 })).toBe('totalSize');
    expect(reason({ validate: () => 'custom' })).toBe('custom');
  });

  it('refuses past the count, and says which rule refused it', () => {
    const files = [png(), makeFile('two.png', { size: 100, type: 'image/png' })];
    expect(selectFiles(files, [], { maxFiles: 1 }).files[1]?.reason).toBe('maxFiles');
    expect(selectFiles(files, [], { multiple: false }).files[1]?.reason).toBe('multiple');
  });

  /**
   * The platform gives a dropped folder a size of nought, an empty type and a
   * name with no dot in it. Every surveyed implementation either ignores it or
   * adds a zero-byte row with the folder's name on it.
   */
  it('refuses a folder dropped into a zone that does not take folders', () => {
    const folder = makeFile('invoices', { size: 0 });
    expect(selectFiles([folder], [], {}).files[0]?.reason).toBe('directory');
    expect(selectFiles([folder], [], { directory: true }).files[0]?.status).toBe('ready');
  });

  describe('duplicates', () => {
    const twice = (policy: 'reject' | 'allow' | 'replace') => {
      const first = selectFiles([png()], [], { duplicates: policy });
      return selectFiles([png()], first.files, { duplicates: policy });
    };

    it('refuses the second copy by default', () => {
      const { files } = twice('reject');
      expect(files).toHaveLength(2);
      expect(files[1]?.reason).toBe('duplicate');
    });

    it('keeps both when asked to', () => {
      const { files } = twice('allow');
      expect(files.every((entry) => entry.status === 'ready')).toBe(true);
      expect(new Set(files.map((entry) => entry.key)).size).toBe(2);
    });

    it('replaces the first, keeping its place', () => {
      const { files } = twice('replace');
      expect(files).toHaveLength(1);
      expect(files[0]?.status).toBe('ready');
    });
  });

  it('takes the identity from the consumer when they state one', () => {
    const rules = { fileKey: (file: File) => file.name.toLowerCase() };
    const first = selectFiles([makeFile('A.png', { type: 'image/png' })], [], rules);
    const second = selectFiles([makeFile('a.png', { type: 'image/png' })], first.files, rules);
    expect(second.files[1]?.reason).toBe('duplicate');
  });

  it('carries the path a directory selection gives a file', () => {
    const file = makeFile('page.png', { type: 'image/png' });
    Object.defineProperty(file, 'webkitRelativePath', { value: 'scans/2026/page.png' });
    expect(selectFiles([file], [], { directory: true }).files[0]?.path).toBe('scans/2026/page.png');
  });
});

describe('fileKey', () => {
  it('is the name, the size and the modification time', () => {
    expect(fileKey(makeFile('a.png', { size: 12, lastModified: 5 }))).toBe('a.png:12:5');
  });
});

describe('formatBytes', () => {
  it('grows through the decimal units a reader has met', () => {
    expect(formatBytes(0, 'en-GB')).toMatch(/0/);
    expect(formatBytes(512, 'en-GB')).toMatch(/512/);
    expect(formatBytes(248_000, 'en-GB')).toMatch(/248/);
    expect(formatBytes(4_100_000, 'en-GB')).toMatch(/4\.1/);
    expect(formatBytes(88_400_000, 'en-GB')).toMatch(/88/);
  });

  it('reads in the locale it is given', () => {
    expect(formatBytes(4_100_000, 'pt-BR')).toMatch(/4,1/);
  });

  it('answers a number that is not one with nought', () => {
    expect(formatBytes(Number.NaN, 'en-GB')).toMatch(/0/);
    expect(formatBytes(-5, 'en-GB')).toMatch(/0/);
  });
});

describe('formatDuration', () => {
  it('reads in minutes once there are minutes to read', () => {
    expect(formatDuration(12, 'en-GB')).toMatch(/12/);
    expect(formatDuration(80, 'en-GB')).toMatch(/1 min/);
    expect(formatDuration(3700, 'en-GB')).toMatch(/1 hr/);
  });

  it('drops a trailing nought rather than saying it', () => {
    expect(formatDuration(120, 'en-GB')).toBe('2 mins');
  });
});

describe('uploadSummary', () => {
  const entry = (over: Partial<UploadFile>): UploadFile => ({
    key: over.key ?? 'k',
    name: 'a.png',
    size: 100,
    type: 'image/png',
    kind: 'image',
    status: 'ready',
    loaded: 0,
    attempts: 0,
    ...over,
  });

  it('counts every status and leaves a refused file out of the bytes', () => {
    const summary = uploadSummary([
      entry({ key: '1', status: 'success' }),
      entry({ key: '2', status: 'uploading', loaded: 50 }),
      entry({ key: '3', status: 'rejected', reason: 'type' }),
    ]);
    expect(summary.counts.success).toBe(1);
    expect(summary.counts.rejected).toBe(1);
    expect(summary.size).toBe(200);
    expect(summary.loaded).toBe(150);
    expect(summary.percent).toBe(75);
  });

  it('says the queue is pending while any file still owes something', () => {
    expect(uploadSummary([entry({ status: 'queued' })]).pending).toBe(true);
    expect(uploadSummary([entry({ status: 'error' })]).pending).toBe(false);
    expect(uploadSummary([entry({ status: 'rejected' })]).pending).toBe(false);
  });

  it('is complete only when every file that entered the queue arrived', () => {
    expect(uploadSummary([entry({ status: 'success' })]).complete).toBe(true);
    expect(
      uploadSummary([entry({ key: '1', status: 'success' }), entry({ key: '2', status: 'error' })])
        .complete,
    ).toBe(false);
    expect(uploadSummary([]).complete).toBe(false);
  });
});

describe('estimateRemaining', () => {
  it('reads the rate over the window rather than over the whole transfer', () => {
    const samples = [
      { at: 0, loaded: 0 },
      { at: 1000, loaded: 100 },
    ];
    expect(estimateRemaining(samples, { loaded: 100, size: 300 })).toBe(2);
  });

  it('says nothing when it has nothing to say', () => {
    expect(estimateRemaining([{ at: 0, loaded: 0 }], { loaded: 0, size: 100 })).toBeNull();
    expect(
      estimateRemaining(
        [
          { at: 0, loaded: 10 },
          { at: 1000, loaded: 10 },
        ],
        { loaded: 10, size: 100 },
      ),
    ).toBeNull();
  });
});

describe('toAdapter', () => {
  /** A bare function cannot suspend, so it says so rather than being asked. */
  it('normalizes a bare function, and refuses to claim it can pause', () => {
    const send = async () => undefined;
    expect(toAdapter(send)).toEqual({ send, pausable: false });
    expect(toAdapter({ send, pausable: true }).pausable).toBe(true);
  });
});

describe('isPending and filesOf', () => {
  it('names the statuses that still owe the reader something', () => {
    expect(isPending({ status: 'uploading' })).toBe(true);
    expect(isPending({ status: 'stalled' })).toBe(true);
    expect(isPending({ status: 'success' })).toBe(false);
  });

  it('gives back only the entries that hold bytes', () => {
    const file = makeFile('a.png');
    const list = [
      {
        key: '1',
        name: 'a.png',
        size: 1,
        type: '',
        kind: 'image',
        status: 'ready',
        loaded: 0,
        attempts: 0,
        file,
      },
      {
        key: '2',
        name: 'b.png',
        size: 1,
        type: '',
        kind: 'image',
        status: 'success',
        loaded: 0,
        attempts: 0,
      },
    ] satisfies UploadFile[];
    expect(filesOf(list)).toEqual([file]);
  });
});

describe('createUploadRunner', () => {
  let patches: Array<[string, UploadPatch]>;
  const onPatch = (key: string, patch: UploadPatch) => {
    patches.push([key, patch]);
  };
  const statuses = (key: string) =>
    patches
      .filter(([k, patch]) => k === key && patch.status !== undefined)
      .map(([, p]) => p.status);

  beforeEach(() => {
    patches = [];
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs a file and reports what the adapter resolved with', async () => {
    const runner = createUploadRunner({ adapter: async () => ({ id: 7 }), onPatch });
    runner.enqueue('a', makeFile('a.png'));
    await vi.runAllTimersAsync();

    expect(statuses('a')).toEqual(['queued', 'uploading', 'success']);
    expect(patches.at(-1)?.[1].response).toEqual({ id: 7 });
    runner.destroy();
  });

  it('holds the queue to the concurrency it was given', async () => {
    let running = 0;
    let peak = 0;
    const runner = createUploadRunner({
      concurrency: 2,
      adapter: async () => {
        running += 1;
        peak = Math.max(peak, running);
        await new Promise((resolve) => setTimeout(resolve, 10));
        running -= 1;
      },
      onPatch,
    });

    for (const key of ['a', 'b', 'c', 'd']) runner.enqueue(key, makeFile(`${key}.png`));
    await vi.runAllTimersAsync();

    expect(peak).toBe(2);
    expect(statuses('d')).toEqual(['queued', 'uploading', 'success']);
    runner.destroy();
  });

  it('reports a failure once the retries are spent, and carries the error', async () => {
    const failure = new Error('nope');
    const runner = createUploadRunner({
      adapter: async () => {
        throw failure;
      },
      retries: 1,
      retryDelay: 10,
      onPatch,
    });

    runner.enqueue('a', makeFile('a.png'));
    await vi.runAllTimersAsync();

    /* Queued, run, queued again for the backoff, run again, then the failure. */
    expect(statuses('a')).toEqual(['queued', 'uploading', 'queued', 'uploading', 'error']);
    expect(patches.at(-1)?.[1].error).toBe(failure);
    runner.destroy();
  });

  /** An upload is a POST, and a POST retried is a second record. */
  it('does not retry unless it was asked to', async () => {
    const send = vi.fn(async () => {
      throw new Error('nope');
    });
    const runner = createUploadRunner({ adapter: send, onPatch });
    runner.enqueue('a', makeFile('a.png'));
    await vi.runAllTimersAsync();

    expect(send).toHaveBeenCalledTimes(1);
    expect(statuses('a')).toEqual(['queued', 'uploading', 'error']);
    runner.destroy();
  });

  it('aborts the adapter’s own signal when the reader cancels', async () => {
    let seen: AbortSignal | undefined;
    const runner = createUploadRunner({
      adapter: async (_file, context) => {
        seen = context.signal;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      },
      onPatch,
    });

    runner.enqueue('a', makeFile('a.png'));
    await vi.advanceTimersByTimeAsync(1);
    runner.cancel('a');

    expect(seen?.aborted).toBe(true);
    expect(statuses('a')).toContain('canceled');
    runner.destroy();
  });

  it('marks a run stalled when no progress arrives, and clears it on the next', async () => {
    let report: ((loaded: number) => void) | undefined;
    const runner = createUploadRunner({
      stallAfter: 100,
      adapter: async (_file, context) => {
        report = (loaded) => context.progress(loaded, 100);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      },
      onPatch,
    });

    runner.enqueue('a', makeFile('a.png'));
    await vi.advanceTimersByTimeAsync(150);
    expect(statuses('a')).toContain('stalled');

    report?.(50);
    expect(statuses('a').at(-1)).toBe('uploading');
    runner.destroy();
  });

  /**
   * An adapter that can suspend awaits the handshake between chunks, which is
   * the only place it can: a pause asked for while `send` is inside a chunk
   * takes effect at the end of that chunk and not before.
   */
  it('suspends an adapter that honors the handshake, and lets it go again', async () => {
    const seen: string[] = [];
    const runner = createUploadRunner({
      adapter: {
        pausable: true,
        async send(_file, context) {
          for (let chunk = 0; chunk < 3; chunk += 1) {
            await new Promise((resolve) => setTimeout(resolve, 10));
            await context.whenResumed();
            seen.push(`chunk ${chunk}`);
          }
        },
      },
      onPatch,
    });

    runner.enqueue('a', makeFile('a.png'));
    await vi.advanceTimersByTimeAsync(15);
    expect(seen).toEqual(['chunk 0']);

    runner.pause('a');
    await vi.advanceTimersByTimeAsync(50);
    expect(seen).toEqual(['chunk 0']);
    expect(statuses('a').at(-1)).toBe('paused');

    runner.resume('a');
    await vi.runAllTimersAsync();
    expect(seen).toEqual(['chunk 0', 'chunk 1', 'chunk 2']);
    runner.destroy();
  });

  it('says whether the adapter it was given can be paused at all', () => {
    expect(createUploadRunner({ adapter: async () => undefined, onPatch }).pausable).toBe(false);
    expect(
      createUploadRunner({ adapter: { send: async () => undefined, pausable: true }, onPatch })
        .pausable,
    ).toBe(true);
  });

  it('forgets a removed file rather than reporting on it', async () => {
    const runner = createUploadRunner({
      adapter: async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      },
      onPatch,
    });

    runner.enqueue('a', makeFile('a.png'));
    await vi.advanceTimersByTimeAsync(1);
    patches = [];
    runner.remove('a');
    await vi.runAllTimersAsync();

    expect(patches).toEqual([]);
    runner.destroy();
  });

  it('abandons everything it holds when the family goes away', async () => {
    let seen: AbortSignal | undefined;
    const runner = createUploadRunner({
      adapter: async (_file, context) => {
        seen = context.signal;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      },
      onPatch,
    });

    runner.enqueue('a', makeFile('a.png'));
    await vi.advanceTimersByTimeAsync(1);
    runner.destroy();

    expect(seen?.aborted).toBe(true);
  });
});
