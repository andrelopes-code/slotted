import { describe, expect, it } from 'vitest';

import { matchesAccept } from './index';

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
