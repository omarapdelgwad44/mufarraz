import JSZip from 'jszip';
import { SurahGroup } from './types';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function paragraph(text: string, style: 'surah' | 'verse' | 'ayah' | 'page'): string {
  const escaped = escapeXml(text);

  let properties: string;
  if (style === 'surah') {
    properties =
      '<w:pPr><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Traditional Arabic" w:hAnsi="Traditional Arabic" w:cs="Traditional Arabic"/><w:b/><w:bCs/><w:color w:val="7030A0"/><w:sz w:val="24"/><w:rtl/></w:rPr></w:pPr>'
      + '<w:r><w:rPr><w:rFonts w:ascii="Traditional Arabic" w:hAnsi="Traditional Arabic" w:cs="Traditional Arabic"/><w:b/><w:bCs/><w:color w:val="7030A0"/><w:sz w:val="24"/><w:rtl/></w:rPr>';
  } else if (style === 'ayah' || style === 'page') {
    properties =
      '<w:pPr><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:rtl/><w:lang w:bidi="ar-EG"/></w:rPr></w:pPr>'
      + '<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:rtl/><w:lang w:bidi="ar-EG"/></w:rPr>';
  } else {
    properties =
      '<w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:rtl/><w:lang w:bidi="ar-EG"/></w:rPr></w:pPr>'
      + '<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:rtl/><w:lang w:bidi="ar-EG"/></w:rPr>';
  }

  return `<w:p>${properties}<w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
}

function tableProperties(): string {
  return '<w:tblPr>'
    + '<w:bidiVisual/>'
    + '<w:tblW w:w="9211" w:type="dxa"/>'
    + '<w:tblBorders>'
    + '<w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/>'
    + '<w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/>'
    + '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/>'
    + '<w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/>'
    + '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/>'
    + '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/>'
    + '</w:tblBorders>'
    + '<w:tblLayout w:type="fixed"/>'
    + '<w:tblLook w:val="0000" w:firstRow="0" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="0"/>'
    + '</w:tblPr>';
}

function tableGrid(): string {
  return '<w:tblGrid>'
    + '<w:gridCol w:w="5431"/>'
    + '<w:gridCol w:w="1980"/>'
    + '<w:gridCol w:w="1800"/>'
    + '</w:tblGrid>';
}

function surahHeaderRow(surah: string): string {
  return '<w:tr>'
    + '<w:tc>'
    + '<w:tcPr><w:tcW w:w="9211" w:type="dxa"/><w:gridSpan w:val="3"/></w:tcPr>'
    + paragraph(surah, 'surah')
    + '</w:tc>'
    + '</w:tr>';
}

function dataRow(verse: string, ayah: string, page: string): string {
  return '<w:tr>'
    + `<w:tc><w:tcPr><w:tcW w:w="5431" w:type="dxa"/></w:tcPr>${paragraph(verse, 'verse')}</w:tc>`
    + `<w:tc><w:tcPr><w:tcW w:w="1980" w:type="dxa"/></w:tcPr>${paragraph(ayah, 'ayah')}</w:tc>`
    + `<w:tc><w:tcPr><w:tcW w:w="1800" w:type="dxa"/></w:tcPr>${paragraph(page, 'page')}</w:tc>`
    + '</w:tr>';
}

function buildTableXml(groups: SurahGroup[]): string {
  const rows: string[] = [];

  for (const group of groups) {
    rows.push(surahHeaderRow(group.surah));
    for (const entry of group.entries) {
      rows.push(dataRow(entry.verse, entry.ayah, entry.page));
    }
  }

  return `<w:tbl>${tableProperties()}${tableGrid()}${rows.join('')}</w:tbl>`;
}

export async function exportDocx(groups: SurahGroup[], templateUrl: string): Promise<Blob> {
  const response = await fetch(templateUrl);
  if (!response.ok) throw new Error('template_missing');

  const templateBuffer = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(templateBuffer);

  let documentXml = await zip.file('word/document.xml')?.async('string');
  if (!documentXml) throw new Error('export_failed');

  const tableXml = buildTableXml(groups);
  const tableStart = documentXml.indexOf('<w:tbl>');
  if (tableStart === -1) throw new Error('export_failed');

  const tableEnd = documentXml.indexOf('</w:tbl>', tableStart);
  if (tableEnd === -1) throw new Error('export_failed');

  documentXml = documentXml.slice(0, tableStart) + tableXml + documentXml.slice(tableEnd + '</w:tbl>'.length);

  zip.file('word/document.xml', documentXml);

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}
