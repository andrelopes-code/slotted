import { describe, expect, it } from 'vitest';

import { matchesAccept, partitionFiles } from './index';

const png = { name: 'diagram.png', type: 'image/png' };
const pdf = { name: 'report.pdf', type: 'application/pdf' };
const unknown = { name: 'notes.md', type: '' };

describe('matchesAccept', () => {
  it('accepts everything when the attribute says nothing', () => {
    expect(matchesAccept(png, '')).toBe(true);
    expect(matchesAccept(png, '   ')).toBe(true);
  });

  it('matches an exact media type', () => {
    expect(matchesAccept(png, 'image/png')).toBe(true);
    expect(matchesAccept(pdf, 'image/png')).toBe(false);
  });

  it('matches a wildcard subtype against the type alone', () => {
    expect(matchesAccept(png, 'image/*')).toBe(true);
    expect(matchesAccept(pdf, 'image/*')).toBe(false);
  });

  it('matches an extension, and does not care how it is capitalised', () => {
    expect(matchesAccept({ name: 'REPORT.PDF', type: '' }, '.pdf')).toBe(true);
    expect(matchesAccept(png, '.PNG')).toBe(true);
    expect(matchesAccept(png, '.pdf')).toBe(false);
  });

  it('does not mistake an extension for part of a longer one', () => {
    expect(matchesAccept({ name: 'archive.tar.gz', type: '' }, '.gz')).toBe(true);
    expect(matchesAccept({ name: 'notes.mdx', type: '' }, '.md')).toBe(false);
  });

  it('accepts a file that satisfies any one token in the list', () => {
    expect(matchesAccept(pdf, 'image/*,.pdf')).toBe(true);
    expect(matchesAccept(png, 'image/*, .pdf')).toBe(true);
    expect(matchesAccept(unknown, 'image/*,.pdf')).toBe(false);
  });

  it('ignores empty tokens left by a trailing or doubled comma', () => {
    expect(matchesAccept(pdf, '.pdf,')).toBe(true);
    expect(matchesAccept(pdf, ',,.pdf,,')).toBe(true);
    expect(matchesAccept(pdf, ',,,')).toBe(true);
  });

  it('compares media types without regard to case, as the specification does', () => {
    expect(matchesAccept({ name: 'a.png', type: 'IMAGE/PNG' }, 'image/png')).toBe(true);
    expect(matchesAccept(png, 'IMAGE/*')).toBe(true);
  });

  it('ignores the parameters a media type may carry', () => {
    expect(matchesAccept({ name: 'a.csv', type: 'text/csv;charset=utf-8' }, 'text/csv')).toBe(true);
    expect(matchesAccept({ name: 'a.csv', type: 'text/csv;charset=utf-8' }, 'text/*')).toBe(true);
  });

  it('refuses a file the platform gave no type and no matching extension', () => {
    expect(matchesAccept(unknown, 'image/*')).toBe(false);
    expect(matchesAccept({ name: 'noextension', type: '' }, '.png')).toBe(false);
  });

  it('does not treat a bare wildcard as a media type it can compare', () => {
    expect(matchesAccept(png, '*/*')).toBe(true);
    expect(matchesAccept(unknown, '*/*')).toBe(false);
  });
});

const images = [
  { name: 'one.png', type: 'image/png' },
  { name: 'two.jpg', type: 'image/jpeg' },
];

describe('partitionFiles', () => {
  it('accepts everything when nothing is asked of it', () => {
    expect(partitionFiles(images, {})).toEqual({ accepted: images, rejected: [] });
  });

  it('refuses a file the accept list does not cover, and says why', () => {
    const { accepted, rejected } = partitionFiles([...images, pdf], { accept: 'image/*' });
    expect(accepted).toEqual(images);
    expect(rejected).toEqual([{ file: pdf, reason: 'type' }]);
  });

  it('refuses a file larger than the limit, and says why', () => {
    const large = { name: 'big.png', size: 4000, type: 'image/png' };
    const small = { name: 'small.png', size: 10, type: 'image/png' };
    const { accepted, rejected } = partitionFiles([small, large], { maxSize: 1000 });
    expect(accepted).toEqual([small]);
    expect(rejected).toEqual([{ file: large, reason: 'size' }]);
  });

  it('treats a file exactly at the limit as within it', () => {
    const exact = { name: 'exact.png', size: 1000, type: 'image/png' };
    expect(partitionFiles([exact], { maxSize: 1000 }).accepted).toEqual([exact]);
  });

  it('ignores a size limit for a file that does not report a size', () => {
    expect(partitionFiles(images, { maxSize: 1 }).accepted).toEqual(images);
  });

  it('reports the extra files of a single-file selection rather than truncating', () => {
    const { accepted, rejected } = partitionFiles(images, { multiple: false });
    expect(accepted).toEqual([images[0]]);
    expect(rejected).toEqual([{ file: images[1], reason: 'multiple' }]);
  });

  it('counts only acceptable files towards the single-file limit', () => {
    const { accepted, rejected } = partitionFiles([pdf, ...images], {
      accept: 'image/*',
      multiple: false,
    });
    expect(accepted).toEqual([images[0]]);
    expect(rejected).toEqual([
      { file: pdf, reason: 'type' },
      { file: images[1], reason: 'multiple' },
    ]);
  });

  it('keeps every file of a multiple selection', () => {
    expect(partitionFiles(images, { multiple: true }).accepted).toEqual(images);
  });

  it('reports a file refused for its type once, not once per rule', () => {
    const wrong = { name: 'big.pdf', size: 9000, type: 'application/pdf' };
    expect(partitionFiles([wrong], { accept: 'image/*', maxSize: 10 }).rejected).toEqual([
      { file: wrong, reason: 'type' },
    ]);
  });

  it('answers an empty selection with an empty result', () => {
    expect(partitionFiles([], { accept: 'image/*', multiple: false })).toEqual({
      accepted: [],
      rejected: [],
    });
  });
});
