import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

export const THEMES = {
  'problem-solving': '문제 해결',
  adoption: '도입',
  learned: '배운 것',
} as const;

export async function allPosts(): Promise<Post[]> {
  const posts = await getCollection('blog');
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function byYear(posts: Post[]): [number, Post[]][] {
  const groups = new Map<number, Post[]>();
  for (const p of posts) {
    const y = p.data.date.getFullYear();
    groups.set(y, [...(groups.get(y) ?? []), p]);
  }
  return [...groups.entries()];
}

export function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}
