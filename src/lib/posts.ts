import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

export const THEMES = {
  'problem-solving': '문제 해결',
  adoption: '도입',
  learned: '배운 것',
  performance: '성능 개선',
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

// 연재 번호: 구분자(-·_·#) 뒤 끝 숫자. top10 처럼 붙은 숫자는 번호로 보지 않는다
const SERIES_NO = /[-_#]+(\d+)$/;

// 연재 이름: slug 에서 날짜와 끝 번호를 뗀 것(2023-08-29-project-preg-birth-1 → project-preg-birth)
function seriesKey(id: string): string {
  return id.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(SERIES_NO, '');
}

// 같은 날 올린 연재 글(#8·#9 등)은 끝 번호로 순서를 정한다. 번호 없는 글은 그날 맨 뒤
function seriesNo(id: string): number {
  const m = id.match(SERIES_NO);
  return m ? Number(m[1]) : Infinity;
}

// 이전/다음 글 링크에 붙일 한 줄 설명. 없거나 제목과 같으면 생략
export function navDescription(post: Post): string | undefined {
  const desc = post.data.description?.trim();
  return desc && desc !== post.data.title.trim() ? desc : undefined;
}

export type Adjacent = { prev?: Post; next?: Post; series?: { index: number; total: number } };

// 이전 글·다음 글. 같은 연재가 2편 이상이면 연재 안에서, 아니면 같은 갈래(코딩테스트/그 밖) 안에서 날짜순
export function adjacentPosts(posts: Post[], post: Post): Adjacent {
  const key = seriesKey(post.id);
  const series = posts.filter((p) => seriesKey(p.id) === key);
  const pool = series.length > 1 ? series : posts.filter((p) => p.data.category === post.data.category);
  const ordered = [...pool].sort((a, b) =>
    a.data.date.getTime() - b.data.date.getTime() || seriesNo(a.id) - seriesNo(b.id) || a.id.localeCompare(b.id));
  const i = ordered.findIndex((p) => p.id === post.id);
  return {
    prev: ordered[i - 1],
    next: ordered[i + 1],
    series: series.length > 1 ? { index: i + 1, total: ordered.length } : undefined,
  };
}
