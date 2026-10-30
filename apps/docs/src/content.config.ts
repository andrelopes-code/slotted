import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const foundations = defineCollection({
  loader: glob({ base: './src/content/foundations', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().int(),
  }),
});

/** One entry per family, written once for every framework. */
const components = defineCollection({
  loader: glob({ base: './src/content/components', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = { foundations, components };
