import { toWestern } from './arabicNumerals';

export function normalize(page: string): string {
  return toWestern(page.trim()).replace(/\s*\/\s*/g, '/');
}

export function pagesByVolume(page: string): Record<number, number[]> {
  const normalized = normalize(page);
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

  const normalized = normalize(page);
  return normalized === '' ? [''] : [normalized];
}

export function format(volume: number, pages: number[]): string {
  const unique = [...new Set(pages)].sort((a, b) => a - b);

  if (unique.length === 1) {
    return `${volume}/${unique[0]}`;
  }

  const anchor = `${volume}/${unique[0]}`;
  const extras = unique.slice(1).sort((a, b) => b - a);

  return [...extras.map(String), anchor].join(' ،');
}

export function formatMerged(pagesByVol: Record<number, number[]>): string {
  const volumes = Object.keys(pagesByVol).map(Number).sort((a, b) => a - b);
  const parts: string[] = [];

  for (const volume of volumes) {
    const pages = [...new Set(pagesByVol[volume])].sort((a, b) => a - b);
    parts.push(format(volume, pages));
  }

  return parts.join(' ،');
}
