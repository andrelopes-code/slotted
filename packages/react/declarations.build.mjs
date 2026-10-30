import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * `tsc` copies a component's stylesheet imports into its declaration file, but
 * the stylesheets reach the consumer inside `dist/styles.css`, never as
 * `@slotted/styles`. Each import becomes an empty line, so the declaration
 * maps still point at the right source lines.
 */
const typesDirectory = fileURLToPath(new URL('dist/types', import.meta.url));
const stylesheetImport = /^import\s+['"][^'"]+\.css['"];?$/gm;

const entries = await readdir(typesDirectory, { recursive: true, withFileTypes: true });
for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith('.d.ts')) continue;
  const path = join(entry.parentPath, entry.name);
  const declaration = await readFile(path, 'utf8');
  const stripped = declaration.replace(stylesheetImport, '');
  if (stripped !== declaration) await writeFile(path, stripped);
}
