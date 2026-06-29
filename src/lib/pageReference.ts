import { toWestern } from './arabicNumerals';

export function pagesByVolume(page: string): Record<number, number[]> {
  const normalized = toWestern(page.trim());
  if (normalized === '') return {};

  const match = normalized.match(/^(\d+)\/(\d+)(.*)$/u);
  if (!match) return {};

  const volume = parseInt(match[1], 10);
  const pages = [parseInt(match[2], 10)];
  const extra = [...match[3].matchAll(/[،,]\s*(\d+)/gu)];

  for (const m of extra) {
    pages.push(parseInt(m[1], 10));
  }

  return { [volume]: pages };
}

export function expand(page: string): string[] {
  const expanded: string[] = [];

  for (const [volume, pages] of Object.entries(pagesByVolume(page))) {
    for (const pageNumber of pages) {
      expanded.push(`${volume}/${pageNumber}`);
    }
  }

  if (expanded.length > 0) return expanded;

  const normalized = toWestern(page.trim());
  return normalized === '' ? [''] : [normalized];
}

export function format(volume: number, pages: number[]): string {
  const unique = [...new Set(pages)].sort((a, b) => a - b);
  let formatted = `${volume}/${unique[0]}`;

  for (let i = 1; i < unique.length; i++) {
    formatted += ` ،${unique[i]}`;
  }

  return formatted;
}
