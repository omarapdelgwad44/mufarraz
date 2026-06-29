const ARABIC_INDIC: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

const EXTENDED_ARABIC_INDIC: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

const MAP = { ...ARABIC_INDIC, ...EXTENDED_ARABIC_INDIC };

export function toWestern(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (ch) => MAP[ch] ?? ch);
}

export function ayahNumber(ayah: string): number {
  const normalized = toWestern(ayah);
  const match = normalized.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

const WESTERN_TO_ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';

export function toArabicIndic(value: string): string {
  return value.replace(/\d/g, (digit) => WESTERN_TO_ARABIC_INDIC[Number(digit)]);
}
