export type SkeletonShape = 'text' | 'block' | 'circle' | 'square';
export type SkeletonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SkeletonAnimation = 'shimmer' | 'pulse' | 'none';
export type SkeletonLive = 'polite' | 'off';

export const SKELETON_DEFAULT_ANIMATION: SkeletonAnimation = 'shimmer';
export const SKELETON_DEFAULT_SHAPE: SkeletonShape = 'text';
export const SKELETON_DEFAULT_SIZE: SkeletonSize = 'md';
export const SKELETON_DEFAULT_LIVE: SkeletonLive = 'polite';
export const SKELETON_DEFAULT_LINES = 3;
