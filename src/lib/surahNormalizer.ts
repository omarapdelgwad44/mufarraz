import { SURAH_ORDER } from './surahOrder';

const ALIASES: Record<string, string> = {
  'آل عمـران': 'آل عمران',
  'آل عمران': 'آل عمران',
  'الأحـزاب': 'الأحزاب',
  'الأحزام': 'الأحزاب',
  'التوبـة': 'التوبة',
  'البقـرة': 'البقرة',
  'الزمـر': 'الزمر',
  'الذاريــات': 'الذاريات',
  'القمـر': 'القمر',
  'الزلزلــة': 'الزلزلة',
  'النسـاء': 'النساء',
  'الحديـد': 'الحديد',
};

export function normalizeSurah(name: string): string {
  let n = name.trim().replace(/\s+/gu, ' ');
  n = n.replace(/[ـۧ ]/g, '');
  return ALIASES[n] ?? n;
}

export function surahOrder(name: string): number {
  return SURAH_ORDER[normalizeSurah(name)] ?? 999;
}
