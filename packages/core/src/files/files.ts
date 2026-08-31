/**
 * The rules the `accept` attribute of `<input type="file">` states, applied
 * where the attribute does not reach.
 *
 * `accept` filters the picker's dialog and nothing else. It constrains neither
 * what the dialog ultimately yields nor what a drop delivers, so a component
 * that offers both affordances must apply the rules itself or accept by drop
 * what it refuses by picker.
 *
 * Written against FileUpload, its first caller. It is here rather than in each
 * framework package because both must answer identically: a drift between two
 * copies is drop and picker disagreeing in one framework and not the other.
 *
 * Nothing here touches the DOM. It takes a shape rather than a `File`, so it
 * is usable against anything that reports a name and a type.
 */

export interface AcceptableFile {
  name: string;
  type: string;
}

/** The media type without the parameters it may carry, folded to lower case. */
function mediaType(type: string) {
  return (type.split(';')[0] ?? '').trim().toLowerCase();
}

function matchesToken(file: AcceptableFile, token: string) {
  if (token.startsWith('.')) return file.name.toLowerCase().endsWith(token);

  const type = mediaType(file.type);
  if (type === '') return false;

  const [tokenType, tokenSubtype] = token.split('/');
  const [fileType, fileSubtype] = type.split('/');
  if (tokenSubtype === undefined || fileSubtype === undefined) return false;

  return (
    (tokenType === '*' || tokenType === fileType) &&
    (tokenSubtype === '*' || tokenSubtype === fileSubtype)
  );
}

/**
 * Whether `file` satisfies any one token of an `accept` list.
 *
 * An absent or empty list matches everything, which is what the attribute
 * means. The three token forms are the ones the attribute defines: an exact
 * media type, a type with a wildcard subtype, and an extension — the last
 * matched without regard to case, because a file called `REPORT.PDF` is a PDF.
 *
 * A file the platform gave no type matches only by extension. There is nothing
 * to compare a media type against, and guessing one from the name is how a
 * `.png` full of something else gets through.
 */
export function matchesAccept(file: AcceptableFile, accept: string) {
  const tokens = accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 0);

  if (tokens.length === 0) return true;
  return tokens.some((token) => matchesToken(file, token));
}

export type FileRejectionReason = 'type' | 'size' | 'multiple';

export interface FileRejection<TFile> {
  file: TFile;
  reason: FileRejectionReason;
}

/**
 * The restrictions a selection is held to. Each one is optional and an absent
 * one is no restriction at all, so `{}` accepts anything. Product defaults —
 * a single-file upload, for instance — belong to the component, which states
 * `multiple` on every call.
 */
export interface FileRestrictions {
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
}

export interface PartitionedFiles<TFile> {
  accepted: TFile[];
  rejected: FileRejection<TFile>[];
}

/**
 * Splits a selection into what may be kept and what must be reported back.
 *
 * A file is judged once and refused for one reason: the type is checked before
 * the size, so a file that is both the wrong kind and too large is reported as
 * the wrong kind. Two reasons for one file would be two messages about one
 * mistake.
 *
 * `multiple` is applied last, and only to the files that survived the other
 * two, so a single-file upload handed a refused file and two good ones keeps
 * the first good one. The extras are reported rather than dropped: truncating
 * in silence leaves the reader looking for a file that never appeared.
 */
export function partitionFiles<TFile extends { name: string; size?: number; type: string }>(
  files: readonly TFile[],
  { accept = '', maxSize, multiple = true }: FileRestrictions,
): PartitionedFiles<TFile> {
  const accepted: TFile[] = [];
  const rejected: FileRejection<TFile>[] = [];

  for (const file of files) {
    if (!matchesAccept(file, accept)) rejected.push({ file, reason: 'type' });
    else if (maxSize !== undefined && file.size !== undefined && file.size > maxSize) {
      rejected.push({ file, reason: 'size' });
    } else if (!multiple && accepted.length === 1) rejected.push({ file, reason: 'multiple' });
    else accepted.push(file);
  }

  return { accepted, rejected };
}
