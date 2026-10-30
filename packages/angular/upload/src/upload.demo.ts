import { fileKind } from '@slotted/core/upload';
import type { UploadAdapter, UploadFile, UploadStatus } from '@slotted/core/upload';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { SlUpload } from './upload';

/**
 * What the reference page needs and an application does not: files that exist
 * without a picker, and a sender that behaves like a network without being one.
 *
 * Every demonstration on the page is a live upload — the same directive, the
 * same rules, the same DOM — against these two. Nothing there is drawn by hand.
 */

export interface DemoSeed {
  name: string;
  size: number;
  type: string;
  status?: UploadStatus;
  loaded?: number;
  reason?: UploadFile['reason'];
}

/**
 * A photograph, painted rather than fetched: the page has no network, and an
 * `img` on a blob of zeroes is the broken image the viewer showed the first
 * time it was opened in a browser. The hue comes from the file's own name, so
 * four photographs of one claim are four different pictures.
 */
function demoPhoto(name: string) {
  if (typeof document === 'undefined') return undefined;

  let hue = 0;
  for (const character of name) hue = (hue * 31 + character.charCodeAt(0)) % 360;

  /*
   * Three shapes rather than one, because a set of photographs is not all one
   * shape and the stage has to hold every one of them: a wide frame, a portrait
   * one, and the tall scan a phone makes of a document, which is the picture
   * that ran out of the viewer when the stage sized it by percentage.
   */
  const shapes = [
    [960, 640],
    [720, 960],
    [720, 2160],
  ] as const;
  const [width, height] = shapes[hue % 3] ?? shapes[0];

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const paint = canvas.getContext('2d');
  if (paint === null) return undefined;

  const ground = paint.createLinearGradient(0, 0, canvas.width, canvas.height);
  ground.addColorStop(0, `hsl(${hue} 58% 38%)`);
  ground.addColorStop(1, `hsl(${(hue + 45) % 360} 55% 66%)`);
  paint.fillStyle = ground;
  paint.fillRect(0, 0, canvas.width, canvas.height);

  paint.fillStyle = `hsl(${(hue + 190) % 360} 42% 20%)`;
  paint.beginPath();
  paint.moveTo(0, canvas.height);
  paint.lineTo(canvas.width * 0.36, canvas.height * 0.42);
  paint.lineTo(canvas.width * 0.66, canvas.height);
  paint.closePath();
  paint.fill();

  paint.fillStyle = 'rgba(255, 255, 255, 0.86)';
  paint.font = '40px system-ui, sans-serif';
  paint.fillText(name, 40, canvas.height - 48);

  const encoded = canvas.toDataURL('image/jpeg', 0.82);
  const binary = atob(encoded.slice(encoded.indexOf(',') + 1));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/**
 * A one page PDF, written rather than fetched, so the viewer's frame has a real
 * document in it on a page with no network. It is the smallest thing a PDF can
 * be and still be one: a catalogue, a page tree, a page, a font and a stream,
 * with the cross-reference table the byte offsets of what came before.
 */
function demoPdf(name: string) {
  const marks = [
    `BT /F1 26 Tf 64 742 Td (${name.replace(/[()\\]/g, ' ')}) Tj ET`,
    'BT /F1 12 Tf 64 706 Td (Claim CLM-2026-0914) Tj ET',
    '0.85 0.87 0.9 rg 64 120 468 560 re f',
  ].join('\n');
  const objects = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>',
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
    `<</Length ${marks.length}>>\nstream\n${marks}\nendstream`,
  ];

  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(body.length);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const table = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) body += `${String(offset).padStart(10, '0')} 00000 n \n`;
  body += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${table}\n%%EOF\n`;
  return body;
}

/** A real `File`, so the object URL, the thumbnail and the adapter are all real. */
export function demoFile({ name, size, type }: DemoSeed): File {
  const body =
    type === 'application/pdf'
      ? demoPdf(name)
      : ((type.startsWith('image/') ? demoPhoto(name) : undefined) ?? new Uint8Array(0));
  const file = new File([body], name, { type, lastModified: 1_757_500_000_000 });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

export function demoEntry(seed: DemoSeed): UploadFile {
  const file = demoFile(seed);
  const status = seed.status ?? 'success';
  return {
    key: `${seed.name}:${seed.size}:1757500000000`,
    file,
    name: seed.name,
    size: seed.size,
    type: seed.type,
    kind: fileKind(file),
    status,
    loaded: seed.loaded ?? (status === 'success' ? seed.size : 0),
    total: seed.size,
    attempts: status === 'ready' ? 0 : 1,
    ...(seed.reason === undefined ? {} : { reason: seed.reason }),
  };
}

/**
 * A sender that moves bytes at a stated rate rather than instantly, so the bar,
 * the percentage, the remaining time and the concurrency limit are all readable
 * on a page nobody has to click through.
 */
export function demoAdapter({
  bytesPerSecond = 900_000,
  fails = false,
  pausable = false,
  stalls = false,
}: {
  bytesPerSecond?: number;
  fails?: boolean;
  pausable?: boolean;
  stalls?: boolean;
} = {}): UploadAdapter {
  return {
    pausable,
    async send(file, { progress, signal, whenResumed }) {
      const step = bytesPerSecond / 10;
      for (let loaded = 0; loaded < file.size; loaded += step) {
        await whenResumed();
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        if (stalls && loaded > file.size * 0.43) await new Promise(() => undefined);
        await new Promise((resolve) => setTimeout(resolve, 100));
        progress(Math.min(loaded + step, file.size), file.size);
      }
      if (fails) throw new Error('The server refused the file.');
      return { id: file.name };
    },
  };
}

/** The claim every demonstration on this page is about. */
export const CLAIM = {
  form: { name: 'claim-form-2026-0914.pdf', size: 248_000, type: 'application/pdf' },
  notes: {
    name: 'loss-adjuster-notes.docx',
    size: 86_000,
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  estimate: {
    name: 'repair-estimate-northgate-motors.xlsx',
    size: 96_000,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  review: {
    name: 'settlement-review-board.pptx',
    size: 2_400_000,
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  },
  front: { name: 'damage-front-quarter.jpg', size: 4_100_000, type: 'image/jpeg' },
  rear: { name: 'damage-rear-bumper.jpg', size: 3_200_000, type: 'image/jpeg' },
  airbag: { name: 'interior-airbag.jpg', size: 2_800_000, type: 'image/jpeg' },
  dashcam: { name: 'dashcam-clip-0914-0731.mp4', size: 88_400_000, type: 'video/mp4' },
  call: { name: 'adjuster-call-recording.m4a', size: 11_200_000, type: 'audio/mp4' },
  archive: { name: 'policy-archive-2019-2024.zip', size: 41_800_000, type: 'application/zip' },
  police: { name: 'police-report-scan.pdf', size: 7_900_000, type: 'application/pdf' },
  medical: { name: 'medical-certificate.pdf', size: 1_400_000, type: 'application/pdf' },
  witness: { name: 'witness-statement-a-okafor.pdf', size: 312_000, type: 'application/pdf' },
  garage: { name: 'garage-invoice-11482.pdf', size: 188_000, type: 'application/pdf' },
  logbook: { name: 'v5-logbook-scan.pdf', size: 512_000, type: 'application/pdf' },
  unnamed: { name: 'scan0001', size: 18_600_000, type: '' },
  long: {
    name: '2026-09-14-northgate-motors-consolidated-repair-estimate-and-parts-schedule-revision-seven.pdf',
    size: 1_900_000,
    type: 'application/pdf',
  },
  arabic: {
    name: 'تقرير-الحادث-المفصل-من-شرطة-المرور.pdf',
    size: 640_000,
    type: 'application/pdf',
  },
} satisfies Record<string, DemoSeed>;

/**
 * The family, seeded with files that are already in the state the scene is
 * about — so a scene can start at `error` or `paused` without a reader waiting
 * for one to happen.
 */
@Component({
  selector: 'div[slUploadDemo]',
  standalone: true,
  exportAs: 'slUploadDemo',
  imports: [SlUpload],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      #upload="slUpload"
      (reject)="rejected = $event"
      [accept]="accept()"
      [adapter]="adapter()"
      [autoUpload]="autoUpload()"
      [concurrency]="concurrency()"
      [description]="description()"
      [directory]="directory()"
      [disabled]="disabled()"
      [files]="seeded()"
      [invalid]="invalid()"
      [label]="label()"
      [layout]="layout()"
      [maxFiles]="maxFiles()"
      [maxRows]="maxRows()"
      [maxSize]="maxSize()"
      [multiple]="multiple()"
      [preview]="preview()"
      [readOnly]="readOnly()"
      [required]="required()"
      [size]="size()"
      [stallAfter]="stallAfter()"
      [variant]="variant()"
      slUpload
    >
      <ng-content />
    </div>
  `,
})
export class SlUploadDemo {
  readonly seed = input<readonly DemoSeed[]>([]);
  readonly accept = input<string | undefined>(undefined);
  readonly adapter = input<UploadAdapter | undefined>(undefined);
  readonly autoUpload = input(true);
  readonly concurrency = input<number | undefined>(undefined);
  readonly description = input<string | undefined>(undefined);
  readonly directory = input(false);
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly label = input<string | undefined>(undefined);
  readonly layout = input<'list' | 'grid' | undefined>(undefined);
  readonly maxFiles = input<number | undefined>(undefined);
  readonly maxRows = input<number | undefined>(undefined);
  readonly maxSize = input<number | undefined>(undefined);
  readonly multiple = input(false);
  readonly preview = input<'auto' | 'none' | undefined>(undefined);
  readonly readOnly = input(false);
  readonly required = input(false);
  readonly size = input<'sm' | 'md' | 'lg' | undefined>(undefined);
  readonly stallAfter = input<number | undefined>(undefined);
  readonly variant = input<'dropzone' | 'button' | 'field' | undefined>(undefined);

  rejected: readonly UploadFile[] = [];

  readonly seeded = computed(() => this.seed().map(demoEntry));
}
