import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 글 두 갈래: Medium 에서 옮긴 글(source: medium), 저널에서 쓴 새 글(source: journal)
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    theme: z.enum(['problem-solving', 'adoption', 'learned']).optional(),
    tags: z.array(z.string()).default([]),
    source: z.enum(['medium', 'journal']).default('journal'),
    original: z.string().optional(),
  }),
});

export const collections = { blog };
