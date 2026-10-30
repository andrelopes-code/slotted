/**
 * The rows as a file. CSV by RFC 4180: one record per line, CRLF between
 * records, fields separated by the delimiter, and a field that holds the
 * delimiter, a double quote or a line break wrapped in double quotes with
 * every double quote inside it doubled. The text of each cell is the grid's
 * own — the column's `format`, else the kind's — so what the reader saw is
 * what the file says.
 */

import { cellText, type FormatOptions } from './apply';
import type { GridColumn } from './types';

export interface CsvOptions extends FormatOptions {
  /** Default `,`. */
  readonly delimiter?: string | undefined;
  /** A first record of the column labels. Default `true`. */
  readonly header?: boolean | undefined;
  /**
   * A byte-order mark before the text, which is what makes Excel read the
   * file as UTF-8. Default `false`: a mark is a byte a parser has to know
   * about, and the consumer who targets Excel asks for it.
   */
  readonly bom?: boolean | undefined;
}

const NEEDS_QUOTES = /["\r\n]/;

export function csvField(text: string, delimiter: string): string {
  return NEEDS_QUOTES.test(text) || text.includes(delimiter)
    ? `"${text.replace(/"/g, '""')}"`
    : text;
}

export function toCsv<Row>(
  rows: readonly Row[],
  columns: readonly GridColumn<Row>[],
  options: CsvOptions,
): string {
  /* No columns is no file: an empty record per row would be a line of
     nothing with a header of nothing over it. */
  if (columns.length === 0) return '';
  const delimiter = options.delimiter ?? ',';
  const lines: string[] = [];
  if (options.header !== false) {
    lines.push(columns.map((column) => csvField(column.label, delimiter)).join(delimiter));
  }
  for (const row of rows) {
    lines.push(
      columns.map((column) => csvField(cellText(column, row, options), delimiter)).join(delimiter),
    );
  }
  return (options.bom ? '﻿' : '') + lines.join('\r\n') + (lines.length > 0 ? '\r\n' : '');
}
