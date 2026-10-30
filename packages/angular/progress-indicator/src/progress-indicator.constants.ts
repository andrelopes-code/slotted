export type ProgressSize = 'sm' | 'md' | 'lg';
export type ProgressTone = 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';
export type ProgressPlacement = 'inline' | 'page' | 'edge-start' | 'edge-end';
/** The geometry a component draws. Written to `data-shape`, never chosen. */
export type ProgressShape = 'linear' | 'circular' | 'morph';

export const PROGRESS_DEFAULT_SIZE: ProgressSize = 'md';
export const PROGRESS_DEFAULT_TONE: ProgressTone = 'accent';
export const PROGRESS_DEFAULT_PLACEMENT: ProgressPlacement = 'inline';
export const PROGRESS_DEFAULT_MIN = 0;
export const PROGRESS_DEFAULT_MAX = 100;
