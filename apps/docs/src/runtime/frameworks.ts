import type { CodeLanguage } from '../lib/highlight';

/**
 * The frameworks the site documents. A framework is one entry here, one
 * directory under `examples/`, and one runtime module beside this file
 * exporting `render(id)` for the build and `mount(element, id)` for the
 * browser.
 */
export const FRAMEWORKS = ['react', 'angular'] as const;

export type Framework = (typeof FRAMEWORKS)[number];

export const FRAMEWORK_LABELS: Record<Framework, string> = {
  react: 'React',
  angular: 'Angular',
};

export const EXAMPLE_LANGUAGES: Record<Framework, CodeLanguage> = {
  react: 'tsx',
  /* A component file with its template inline: TypeScript around, Angular template inside. */
  angular: 'angular-ts',
};

/** The extension of an example file, which is also the extension its code tab names. */
export const EXAMPLE_EXTENSIONS: Record<Framework, string> = {
  react: 'tsx',
  angular: 'ts',
};

/** `../../examples/react/field/basic.tsx` → `field/basic`. */
export function exampleId(path: string): string {
  const match = /examples\/[^/]+\/(.+)\.[a-z]+$/.exec(path);
  if (!match?.[1]) throw new Error(`${path} is not an example path`);
  return match[1];
}

export function byExampleId<T>(modules: Record<string, T>): Map<string, T> {
  return new Map(Object.entries(modules).map(([path, value]) => [exampleId(path), value]));
}
