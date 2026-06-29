import { ayahNumber, toWestern } from './arabicNumerals';
import { normalizeSurah, surahOrder } from './surahNormalizer';

export class VerseIndexEntry {
  constructor(
    public readonly verse: string,
    public readonly surah: string,
    public readonly ayah: string,
    public readonly page: string,
  ) {}

  normalizedSurah(): string {
    return normalizeSurah(this.surah);
  }

  surahOrder(): number {
    return surahOrder(this.surah);
  }

  ayahStart(): number {
    return ayahNumber(this.ayah);
  }

  pageParts(): [number, number] {
    const page = toWestern(this.page);
    const match = page.match(/(\d+)\s*\/\s*(\d+)/);
    return match ? [parseInt(match[1], 10), parseInt(match[2], 10)] : [0, 0];
  }

  volume(): number {
    return this.pageParts()[0];
  }

  pageNumber(): number {
    return this.pageParts()[1];
  }
}

export interface SurahGroup {
  surah: string;
  entries: VerseIndexEntry[];
}
