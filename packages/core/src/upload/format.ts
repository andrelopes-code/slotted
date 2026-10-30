/**
 * The two numbers a row says out loud, formatted by `Intl` rather than by a
 * table of words.
 *
 * Vaadin's answer is an array of nine English strings an application
 * translates; Ark's is a locale and `Intl`, which is this one. A library that
 * shipped its own unit names would be shipping a translation nobody asked it
 * for.
 */

/** The units `Intl.NumberFormat` sanctions, in the order a size grows through. */
const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte'] as const;

/**
 * A size in bytes, in the largest unit that leaves a number a person reads.
 *
 * Decimal rather than binary: the platform reports `File.size` in bytes and
 * every operating system a reader has met shows a 1 000 000-byte file as 1 MB.
 * A library that showed 976.6 kB would be right and alone.
 */
export function formatBytes(bytes: number, locale?: string): string {
  const value = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  let step = 0;
  let scaled = value;
  while (scaled >= 1000 && step < UNITS.length - 1) {
    scaled /= 1000;
    step += 1;
  }

  const unit = UNITS[step] ?? 'byte';
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit,
    unitDisplay: 'short',
    maximumFractionDigits: step === 0 ? 0 : scaled < 10 ? 1 : 0,
  }).format(scaled);
}

/**
 * A duration in seconds, as the largest two units that carry meaning.
 *
 * `Intl.DurationFormat` is not available across the browsers this library
 * supports, so the parts are composed from `Intl.NumberFormat`, which is. The
 * result is "1 min 20 s" rather than "80 s", because a reader waiting for an
 * upload reads minutes.
 */
export function formatDuration(seconds: number, locale?: string): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : 0;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;

  const parts: Array<[number, 'hour' | 'minute' | 'second']> =
    hours > 0
      ? [
          [hours, 'hour'],
          [minutes, 'minute'],
        ]
      : minutes > 0
        ? [
            [minutes, 'minute'],
            [rest, 'second'],
          ]
        : [[rest, 'second']];

  return parts
    .filter(([value], index) => index === 0 || value > 0)
    .map(([value, unit]) =>
      new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'short' }).format(value),
    )
    .join(' ');
}
