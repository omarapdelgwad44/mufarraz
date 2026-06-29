import { formatPreview, toWestern } from './arabicNumerals';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function pageRefParts(page: string): string[] {
  const western = toWestern(page).trim();
  const match = western.match(/^(\d+\/\d+)(.*)$/);

  if (!match) {
    return [formatPreview(page)];
  }

  const parts = [formatPreview(match[1])];

  for (const segment of match[2].matchAll(/[،,]\s*(\d+)/g)) {
    parts.push(formatPreview(segment[1]));
  }

  return parts;
}

export function renderPageRefHtml(page: string, extraClass = ''): string {
  const parts = pageRefParts(page);
  const inner = parts
    .map((part) => `<bdi dir="ltr">${escapeHtml(part)}</bdi>`)
    .join('<span class="idx-page-ref-sep" dir="ltr"> ،</span>');

  const classes = ['idx-page-ref', extraClass].filter(Boolean).join(' ');

  return `<span class="${classes}"><span class="idx-page-ref-inner" dir="ltr">${inner}</span></span>`;
}
