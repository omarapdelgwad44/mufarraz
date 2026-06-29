import { t } from '../i18n';
import { formatPreview, formatPreviewCount } from './arabicNumerals';
import { renderPageRefHtml } from './previewPageRef';
import { PreviewReport, truncateVerse } from './previewReport';
import { VerseIndexEntry } from './types';

export type PreviewTab = 'merges' | 'before' | 'after';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderEntryRows(entries: VerseIndexEntry[]): string {
  if (entries.length === 0) {
    return `<tr><td colspan="4" class="idx-preview-empty">${t('preview_empty')}</td></tr>`;
  }

  return entries
    .map(
      (entry) => `
        <tr>
          <td class="idx-preview-surah">${escapeHtml(entry.normalizedSurah())}</td>
          <td class="idx-preview-verse" title="${escapeHtml(entry.verse)}">${escapeHtml(truncateVerse(entry.verse))}</td>
          <td class="idx-preview-ayah">${escapeHtml(formatPreview(entry.ayah))}</td>
          <td class="idx-preview-page">${renderPageRefHtml(entry.page)}</td>
        </tr>
      `,
    )
    .join('');
}

function renderMergeRows(merges: PreviewReport['merges']): string {
  if (merges.length === 0) {
    return `<tr><td colspan="4" class="idx-preview-empty">${t('preview_no_merges')}</td></tr>`;
  }

  return merges
    .map(
      (item) => `
        <tr class="idx-preview-merge-row">
          <td class="idx-preview-surah">${escapeHtml(item.surah)}</td>
          <td class="idx-preview-verse" title="${escapeHtml(item.verse)}">${escapeHtml(truncateVerse(item.verse))}</td>
          <td class="idx-preview-ayah">${escapeHtml(formatPreview(item.ayah))}</td>
          <td class="idx-preview-merge-cell" colspan="2">
            <div class="idx-merge-flow">
              <div class="idx-merge-group">
                <span class="idx-merge-label">${t('preview_col_before')}</span>
                <div class="idx-merge-pages-inline">
                  ${item.beforePages.map((page) => renderPageRefHtml(page, 'idx-page-ref-muted')).join('')}
                </div>
              </div>
              <span class="idx-merge-arrow" aria-hidden="true">←</span>
              <div class="idx-merge-group idx-merge-group-after">
                <span class="idx-merge-label">${t('preview_col_after')}</span>
                ${renderPageRefHtml(item.afterPage, 'idx-page-ref-result')}
              </div>
            </div>
          </td>
        </tr>
      `,
    )
    .join('');
}

export function renderPreviewPanel(preview: PreviewReport, activeTab: PreviewTab): string {
  const tabs: { id: PreviewTab; label: string; count: number }[] = [
    { id: 'merges', label: t('preview_tab_merges'), count: preview.mergeOperations },
    { id: 'before', label: t('preview_tab_before'), count: preview.beforeCount },
    { id: 'after', label: t('preview_tab_after'), count: preview.afterCount },
  ];

  const tableHead =
    activeTab === 'merges'
      ? `
        <tr>
          <th>${t('preview_col_surah')}</th>
          <th>${t('preview_col_verse')}</th>
          <th>${t('preview_col_ayah')}</th>
          <th colspan="2">${t('preview_col_merge')}</th>
        </tr>
      `
      : `
        <tr>
          <th>${t('preview_col_surah')}</th>
          <th>${t('preview_col_verse')}</th>
          <th>${t('preview_col_ayah')}</th>
          <th>${t('preview_col_page')}</th>
        </tr>
      `;

  const tableBody =
    activeTab === 'merges'
      ? renderMergeRows(preview.merges)
      : activeTab === 'before'
        ? renderEntryRows(preview.before)
        : renderEntryRows(preview.after);

  return `
    <section class="idx-preview-section idx-fade-up-delay" id="idx-preview">
      <div class="idx-card idx-preview-card">
        <div class="idx-preview-header">
          <div>
            <h2 class="text-lg font-bold text-ink">${t('preview_title')}</h2>
            <p class="mt-1 text-sm text-muted">${t('preview_lead')}</p>
          </div>
          <div class="idx-preview-summary">
            <span class="idx-preview-pill">${formatPreviewCount(preview.beforeCount)} ${t('preview_before_label')}</span>
            <span class="idx-preview-pill-arrow" aria-hidden="true">→</span>
            <span class="idx-preview-pill idx-preview-pill-accent">${formatPreviewCount(preview.afterCount)} ${t('preview_after_label')}</span>
            <span class="idx-preview-pill idx-preview-pill-gold">${formatPreviewCount(preview.mergeOperations)} ${t('preview_merge_label')}</span>
          </div>
        </div>

        <div class="idx-preview-tabs" role="tablist">
          ${tabs
            .map(
              (tab) => `
                <button
                  type="button"
                  class="idx-preview-tab ${activeTab === tab.id ? 'is-active' : ''}"
                  data-preview-tab="${tab.id}"
                  role="tab"
                  aria-selected="${activeTab === tab.id}"
                >
                  ${tab.label}
                  <span class="idx-preview-tab-count">${formatPreviewCount(tab.count)}</span>
                </button>
              `,
            )
            .join('')}
        </div>

        <div class="idx-preview-table-wrap">
          <table class="idx-preview-table">
            <thead>${tableHead}</thead>
            <tbody>${tableBody}</tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}
