import { toWestern } from './arabicNumerals';
import { VerseIndexEntry, SurahGroup } from './types';

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/gu, '');
}

function entryKey(entry: VerseIndexEntry): string {
  return `${normalizeText(entry.verse)}|${toWestern(entry.ayah)}`;
}

export interface PreviewMergeCase {
  surah: string;
  verse: string;
  ayah: string;
  beforePages: string[];
  afterPage: string;
}

export interface PreviewReport {
  before: VerseIndexEntry[];
  after: VerseIndexEntry[];
  merges: PreviewMergeCase[];
  beforeCount: number;
  afterCount: number;
  mergeOperations: number;
}

export function buildPreviewReport(
  rawEntries: VerseIndexEntry[],
  groups: SurahGroup[],
): PreviewReport {
  const after = groups.flatMap((group) => group.entries);
  const rawByKey = new Map<string, VerseIndexEntry[]>();

  for (const entry of rawEntries) {
    const key = entryKey(entry);
    if (!rawByKey.has(key)) rawByKey.set(key, []);
    rawByKey.get(key)!.push(entry);
  }

  const merges: PreviewMergeCase[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    for (const entry of group.entries) {
      const key = entryKey(entry);
      if (seen.has(key)) continue;
      seen.add(key);

      const sources = rawByKey.get(key) ?? [];
      const beforePages = sources.map((source) => source.page);

      if (sources.length <= 1 && beforePages.length <= 1) {
        continue;
      }

      merges.push({
        surah: entry.normalizedSurah(),
        verse: entry.verse,
        ayah: entry.ayah,
        beforePages,
        afterPage: entry.page,
      });
    }
  }

  return {
    before: rawEntries,
    after,
    merges,
    beforeCount: rawEntries.length,
    afterCount: after.length,
    mergeOperations: merges.length,
  };
}

export function truncateVerse(verse: string, max = 72): string {
  if (verse.length <= max) return verse;
  return `${verse.slice(0, max)}…`;
}
