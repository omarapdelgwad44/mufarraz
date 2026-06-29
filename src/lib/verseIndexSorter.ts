import { toWestern } from './arabicNumerals';
import { format, pagesByVolume } from './pageReference';
import { VerseIndexEntry, SurahGroup } from './types';

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/gu, '');
}

function entryKey(entry: VerseIndexEntry): string {
  return `${normalizeText(entry.verse)}|${toWestern(entry.ayah)}`;
}

function compareEntries(a: VerseIndexEntry, b: VerseIndexEntry): number {
  const left = [a.surahOrder(), a.ayahStart(), a.volume(), a.pageNumber(), normalizeText(a.verse)];
  const right = [b.surahOrder(), b.ayahStart(), b.volume(), b.pageNumber(), normalizeText(b.verse)];

  for (let i = 0; i < left.length; i++) {
    if (left[i] < right[i]) return -1;
    if (left[i] > right[i]) return 1;
  }
  return 0;
}

function mergePages(entries: VerseIndexEntry[]): VerseIndexEntry[] {
  const clusters = new Map<string, VerseIndexEntry[]>();

  for (const entry of entries) {
    const key = entryKey(entry);
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key)!.push(entry);
  }

  const merged: VerseIndexEntry[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    const key = entryKey(entry);
    if (seen.has(key)) continue;
    seen.add(key);

    const cluster = clusters.get(key)!;
    const pagesByVol: Record<number, number[]> = {};

    for (const item of cluster) {
      for (const [volume, pages] of Object.entries(pagesByVolume(item.page))) {
        const vol = Number(volume);
        if (!pagesByVol[vol]) pagesByVol[vol] = [];
        pagesByVol[vol].push(...pages);
      }
    }

    const volumes = Object.keys(pagesByVol).map(Number).sort((a, b) => a - b);

    for (const volume of volumes) {
      const pages = [...new Set(pagesByVol[volume])].sort((a, b) => a - b);
      merged.push(
        new VerseIndexEntry(cluster[0].verse, cluster[0].surah, cluster[0].ayah, format(volume, pages)),
      );
    }
  }

  merged.sort((a, b) => {
    const left = [a.ayahStart(), a.volume(), a.pageNumber(), normalizeText(a.verse)];
    const right = [b.ayahStart(), b.volume(), b.pageNumber(), normalizeText(b.verse)];

    for (let i = 0; i < left.length; i++) {
      if (left[i] < right[i]) return -1;
      if (left[i] > right[i]) return 1;
    }
    return 0;
  });

  return merged;
}

export function sortAndGroup(entries: VerseIndexEntry[]): SurahGroup[] {
  const sorted = [...entries].sort(compareEntries);
  const groups: SurahGroup[] = [];
  let currentSurah: string | null = null;
  let bucket: VerseIndexEntry[] = [];

  for (const entry of sorted) {
    const surah = entry.normalizedSurah();

    if (currentSurah !== surah) {
      if (currentSurah !== null) {
        groups.push({ surah: currentSurah, entries: mergePages(bucket) });
      }
      currentSurah = surah;
      bucket = [];
    }

    bucket.push(entry);
  }

  if (currentSurah !== null && bucket.length > 0) {
    groups.push({ surah: currentSurah, entries: mergePages(bucket) });
  }

  return groups;
}
