export interface TokenDefinition {
  readonly name: string;
  readonly layer: 'primitive' | 'semantic' | 'component';
  readonly axis: 'base' | 'scheme' | 'density';
  readonly type: string;
  readonly root?: boolean;
  readonly literal?: string;
  readonly forcedColor?: string;
  readonly reducedMotion?: boolean;
  /** The value under `prefers-reduced-transparency: reduce`, the same in every theme. */
  readonly reducedTransparency?: string;
}

export interface TokenContract {
  readonly schemaVersion: number;
  readonly layers: readonly string[];
  readonly axes: readonly string[];
  readonly requiredSchemes: readonly string[];
  readonly requiredDensities: readonly string[];
  readonly tokens: readonly TokenDefinition[];
}
