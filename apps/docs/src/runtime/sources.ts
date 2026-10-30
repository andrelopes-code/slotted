import { byExampleId, type Framework } from './frameworks';

/** Build-time only: the text of each example, shown beside its preview. */
const sources: Record<Framework, Map<string, string>> = {
  react: byExampleId(
    import.meta.glob<string>('../../examples/react/**/*.tsx', {
      query: '?raw',
      import: 'default',
      eager: true,
    }),
  ),
  angular: byExampleId(
    import.meta.glob<string>('../../examples/angular/**/*.ts', {
      query: '?raw',
      import: 'default',
      eager: true,
    }),
  ),
};

export function hasExample(framework: Framework, id: string): boolean {
  return sources[framework].has(id);
}

export function exampleSource(framework: Framework, id: string): string {
  const source = sources[framework].get(id);
  if (source === undefined) throw new Error(`No ${framework} example "${id}"`);
  return source;
}
