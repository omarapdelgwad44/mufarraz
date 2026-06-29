import JSZip from 'jszip';
import { expand } from './pageReference';
import { toWestern } from './arabicNumerals';
import { normalizeSurah } from './surahNormalizer';
import { VerseIndexEntry } from './types';

const SKIP = new Set(['الآية', 'التخريج', 'رقم الصفحة']);

export async function parseDocx(buffer: ArrayBuffer): Promise<VerseIndexEntry[]> {
  const paragraphs = await extractParagraphs(buffer);
  const entries: VerseIndexEntry[] = [];
  const count = paragraphs.length;

  for (let index = 0; index < count; index++) {
    const text = paragraphs[index].trim();

    if (text === '' || SKIP.has(text)) continue;
    if (!text.startsWith('{') && !text.startsWith('﴿')) continue;

    let verse = text;
    index++;

    while (index < count && !/^\[/u.test(paragraphs[index].trim()) && paragraphs[index].trim() !== '') {
      const next = paragraphs[index].trim();
      if (SKIP.has(next)) break;
      verse += ` ${next}`;
      index++;
    }

    if (index >= count) continue;

    const reference = paragraphs[index].trim().match(/^\[(.+?):\s*(.+?)\]$/u);
    if (!reference) continue;

    const surah = normalizeSurah(reference[1].trim());
    const ayah = toWestern(reference[2].trim());
    const pageField = toWestern((paragraphs[index + 1] ?? '').trim());

    for (const page of expand(pageField)) {
      entries.push(new VerseIndexEntry(verse, surah, ayah, page));
    }

    index++;
  }

  if (entries.length === 0) {
    throw new Error('parse_failed');
  }

  return entries;
}

async function extractParagraphs(buffer: ArrayBuffer): Promise<string[]> {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file('word/document.xml')?.async('string');

  if (!xml) throw new Error('invalid_docx');

  const paragraphMatches = [...xml.matchAll(/<w:p[^>]*>(.*?)<\/w:p>/gs)];
  const paragraphs: string[] = [];

  for (const match of paragraphMatches) {
    const textMatches = [...match[1].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)];
    paragraphs.push(textMatches.map((m) => m[1]).join(''));
  }

  return paragraphs;
}
