import { describe, expect, it } from 'vitest';
import { VerseIndexEntry } from './types';
import { sortAndGroup } from './verseIndexSorter';

describe('sortAndGroup', () => {
  it('sorts entries by surah, ayah, and page', () => {
    const entries = [
      new VerseIndexEntry('{ب}', 'البقرة', '10', '2/20'),
      new VerseIndexEntry('{أ}', 'الفاتحة', '2', '1/5'),
      new VerseIndexEntry('{ج}', 'البقرة', '2', '1/15'),
    ];

    const groups = sortAndGroup(entries);

    expect(groups[0].surah).toBe('الفاتحة');
    expect(groups[0].entries[0].verse).toBe('{أ}');
    expect(groups[1].surah).toBe('البقرة');
    expect(groups[1].entries[0].ayah).toBe('2');
    expect(groups[1].entries[1].ayah).toBe('10');
  });

  it('merges already merged page field with another row', () => {
    const verse = '{ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلۡحَيُّ ٱلۡقَيُّومُ}';
    const entries = [
      new VerseIndexEntry(verse, 'البقرة', '255', '2/375'),
      new VerseIndexEntry(verse, 'البقرة', '255', '2/359 ،360'),
    ];

    const groups = sortAndGroup(entries);

    expect(groups[0].entries).toHaveLength(1);
    expect(groups[0].entries[0].page).toBe('2/359 ،360 ،375');
  });

  it('merges pages for same verse and ayah within volume', () => {
    const verse = '{ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلۡحَيُّ ٱلۡقَيُّومُ}';
    const entries = [
      new VerseIndexEntry(verse, 'البقرة', '255', '2/375'),
      new VerseIndexEntry(verse, 'البقرة', '255', '2/359'),
      new VerseIndexEntry(verse, 'البقرة', '255', '2/360'),
    ];

    const groups = sortAndGroup(entries);

    expect(groups[0].entries).toHaveLength(1);
    expect(groups[0].entries[0].page).toBe('2/359 ،360 ،375');
  });

  it('merges entries with arabic indic numerals', () => {
    const verse = '{ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلۡحَيُّ ٱلۡقَيُّومُ}';
    const entries = [
      new VerseIndexEntry(verse, 'البقرة', '٢٥٥', '٢/٣٧٥'),
      new VerseIndexEntry(verse, 'البقرة', '255', '2/359 ،360'),
    ];

    const groups = sortAndGroup(entries);

    expect(groups[0].entries).toHaveLength(1);
    expect(groups[0].entries[0].page).toBe('2/359 ،360 ،375');
  });

  it('merges pages for hamd verse across volumes', () => {
    const verse = '{ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ}';
    const entries = [
      new VerseIndexEntry(verse, 'الفاتحة', '2', '1/572'),
      new VerseIndexEntry(verse, 'الفاتحة', '2', '1/553'),
      new VerseIndexEntry(verse, 'الفاتحة', '2', '1/569'),
      new VerseIndexEntry(verse, 'الفاتحة', '2', '1/571'),
      new VerseIndexEntry(verse, 'الفاتحة', '2', '2/569'),
      new VerseIndexEntry(verse, 'الفاتحة', '2', '2/571'),
    ];

    const groups = sortAndGroup(entries);

    expect(groups[0].entries).toHaveLength(1);
    expect(groups[0].entries[0].page).toBe('1/553 ،569 ،571 ،572 ،2/569 ،571');
  });

  it('merges matching verse across volumes into one row', () => {
    const verse = '{إِنَّ اللَّهَ عِندَهُ عِلْمُ السَّاعَةِ وَيُنَزِّلُ الْغَيْثَ}';
    const entries = [
      new VerseIndexEntry(verse, 'لقمان', '34', '1/224'),
      new VerseIndexEntry(verse, 'لقمان', '34', '2/102'),
    ];

    const groups = sortAndGroup(entries);

    expect(groups[0].entries).toHaveLength(1);
    expect(groups[0].entries[0].page).toBe('1/224 ،2/102');
  });

  it('parses page references with spaces around slash', () => {
    const verse = '{الٓمٓ * تَنزِيلُ}';
    const entries = [
      new VerseIndexEntry(verse, 'السجدة', '1-2', '2/ 376'),
      new VerseIndexEntry(verse, 'السجدة', '1-2', '2/370'),
    ];

    const groups = sortAndGroup(entries);

    expect(groups[0].entries).toHaveLength(1);
    expect(groups[0].entries[0].page).toBe('2/370 ،376');
  });
});
