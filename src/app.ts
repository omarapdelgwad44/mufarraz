import { t, toggleLocale, getLocale } from './i18n';
import { parseDocx } from './lib/verseIndexParser';
import { sortAndGroup } from './lib/verseIndexSorter';
import { exportDocx } from './lib/verseIndexExporter';
import { buildPreviewReport, PreviewReport } from './lib/previewReport';
import { renderPreviewPanel, PreviewTab } from './lib/previewPanel';
import { formatPreviewCount } from './lib/arabicNumerals';

const MAX_SIZE = 10 * 1024 * 1024;
const TEMPLATE_URL = `${import.meta.env.BASE_URL}template.docx`;

interface State {
  file: File | null;
  fileName: string | null;
  entryCount: number | null;
  surahCount: number | null;
  ready: boolean;
  processing: boolean;
  downloadBlob: Blob | null;
  error: string | null;
  preview: PreviewReport | null;
  previewTab: PreviewTab;
}

const state: State = {
  file: null,
  fileName: null,
  entryCount: null,
  surahCount: null,
  ready: false,
  processing: false,
  downloadBlob: null,
  error: null,
  preview: null,
  previewTab: 'merges',
};

let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  const existing = document.querySelector('.toast');
  existing?.remove();
  if (toastTimer) clearTimeout(toastTimer);

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : ''}`;
  toast.style.top = getLocale() === 'ar' ? '1.25rem' : '1.25rem';
  toast.style.insetInlineStart = getLocale() === 'ar' ? '1.25rem' : 'auto';
  toast.style.insetInlineEnd = getLocale() === 'ar' ? 'auto' : '1.25rem';
  toast.textContent = message;
  document.body.appendChild(toast);

  toastTimer = setTimeout(() => toast.remove(), 3800);
}

function resetState(): void {
  state.file = null;
  state.fileName = null;
  state.entryCount = null;
  state.surahCount = null;
  state.ready = false;
  state.processing = false;
  state.downloadBlob = null;
  state.error = null;
  state.preview = null;
  state.previewTab = 'merges';
}

function render(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="idx-shell">
      <div class="idx-grid-bg pointer-events-none absolute inset-0" aria-hidden="true"></div>
      <div class="idx-ornament -start-16 top-24 h-56 w-56" aria-hidden="true"></div>
      <div class="idx-ornament end-0 top-1/3 h-72 w-72" aria-hidden="true"></div>

      <header class="idx-header">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="#" class="group flex items-center gap-3 no-underline" id="brand-link">
            <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-lg text-white shadow-lg shadow-accent/20">۞</span>
            <span>
              <span class="idx-brand block group-hover:text-accent-deep">${t('app_name')}</span>
              <span class="block text-xs font-medium text-muted">${t('app_tagline')}</span>
            </span>
          </a>
          <nav class="flex items-center gap-2 sm:gap-3">
            <button type="button" class="idx-btn-secondary !px-4 !py-2 text-xs sm:text-sm" id="locale-btn">${t('locale_switch')}</button>
          </nav>
        </div>
      </header>

      <main>
        <div class="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
          <section class="idx-fade-up mb-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <span class="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white/70 px-4 py-1.5 text-xs font-semibold tracking-wide text-accent-deep">
                <span class="h-1.5 w-1.5 rounded-full bg-accent"></span>
                ${t('hero_badge')}
              </span>
              <h1 class="idx-display mb-5 text-5xl leading-[1.15] text-ink sm:text-6xl">
                ${t('hero_title')}
                <span class="block text-accent-deep">${t('hero_title_em')}</span>
              </h1>
              <p class="max-w-xl text-base leading-8 text-ink-soft sm:text-lg">${t('hero_lead')}</p>
            </div>
            <div class="grid grid-cols-3 gap-3 sm:gap-4">
              <div class="idx-stat">
                <div class="idx-stat-value">${state.entryCount ?? '—'}</div>
                <div class="mt-2 text-sm text-muted">${t('stat_entries')}</div>
              </div>
              <div class="idx-stat">
                <div class="idx-stat-value">${state.surahCount ?? '—'}</div>
                <div class="mt-2 text-sm text-muted">${t('stat_surahs')}</div>
              </div>
              <div class="idx-stat">
                <div class="idx-stat-value text-[1.65rem] sm:text-4xl">${state.ready ? '✓' : '…'}</div>
                <div class="mt-2 text-sm text-muted">${state.ready ? t('stat_ready') : t('stat_pending')}</div>
              </div>
            </div>
          </section>

          <section class="idx-fade-up-delay grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div class="idx-card">
              <div class="mb-6 flex items-center justify-between gap-3">
                <div>
                  <h2 class="text-lg font-bold text-ink">${t('upload_title')}</h2>
                  <p class="mt-1 text-sm text-muted">${t('upload_formats')}</p>
                </div>
                <span class="rounded-full bg-parchment-deep px-3 py-1 text-xs font-semibold text-ink-soft">DOCX</span>
              </div>

              <input type="file" id="file-input" class="sr-only" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document">

              <label for="file-input" class="idx-upload ${state.fileName ? 'is-ready' : ''}" id="upload-label">
                <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-2xl text-accent-deep">📄</span>
                <span>
                  <span class="block text-base font-semibold text-ink">${t('upload_cta')}</span>
                  <span class="mt-1 block text-sm text-muted">${t('upload_label')}</span>
                </span>
                ${state.fileName ? `<span class="rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent-deep">${state.fileName}</span>` : ''}
                ${state.processing && !state.ready ? `<span class="text-sm text-muted">${t('uploading')}</span>` : ''}
              </label>

              ${state.error ? `<p class="mt-3 text-sm font-medium text-red-700">${state.error}</p>` : ''}

              <div class="mt-6 flex flex-wrap gap-3">
                <button type="button" class="idx-btn-primary" id="process-btn" ${!state.file || state.processing ? 'disabled' : ''}>
                  ${state.processing && !state.ready ? t('processing') : t('sort_action')}
                </button>
                ${state.ready ? `<button type="button" class="idx-btn-success" id="download-btn">${t('download_action')}</button>` : ''}
                ${state.fileName || state.ready ? `<button type="button" class="idx-btn-secondary" id="reset-btn">${t('reset_action')}</button>` : ''}
              </div>

              ${state.preview ? `
                <button type="button" class="idx-preview-cue" id="preview-cue-btn">
                  <span class="idx-preview-cue-icon" aria-hidden="true">👁</span>
                  <span class="idx-preview-cue-body">
                    <span class="idx-preview-cue-title">${t('preview_cue_title')}</span>
                    <span class="idx-preview-cue-lead">${t('preview_cue_lead')}</span>
                    <span class="idx-preview-cue-stats">
                      <span>${formatPreviewCount(state.preview.beforeCount)} ${t('preview_before_label')}</span>
                      <span aria-hidden="true">→</span>
                      <span>${formatPreviewCount(state.preview.afterCount)} ${t('preview_after_label')}</span>
                      <span>· ${formatPreviewCount(state.preview.mergeOperations)} ${t('preview_merge_label')}</span>
                    </span>
                  </span>
                  <span class="idx-preview-cue-action">
                    <span>${t('preview_cue_action')}</span>
                    <span class="idx-preview-cue-arrow" aria-hidden="true">↓</span>
                  </span>
                </button>
              ` : state.fileName && !state.processing ? `
                <div class="idx-preview-cue idx-preview-cue-muted">
                  <span class="idx-preview-cue-icon" aria-hidden="true">📋</span>
                  <span class="idx-preview-cue-body">
                    <span class="idx-preview-cue-lead">${t('preview_cue_hint')}</span>
                  </span>
                </div>
              ` : ''}
            </div>

            <aside class="space-y-5">
              <div class="idx-card-muted">
                <h3 class="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-gold">${t('panel_workflow')}</h3>
                <div class="space-y-3">
                  ${[1, 2, 3, 4].map((n) => `
                    <div class="idx-step">
                      <span class="idx-step-num">${n}</span>
                      <p class="text-sm leading-7 text-ink-soft">${t(`step_${n}` as 'step_1')}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
              <div class="idx-card-notes">
                <div class="idx-notes-head">
                  <span class="idx-notes-emblem" aria-hidden="true">◈</span>
                  <div>
                    <h3 class="idx-notes-title">${t('panel_notes')}</h3>
                    <p class="idx-notes-sub">${t('panel_notes_sub')}</p>
                  </div>
                </div>
                <ul class="idx-notes-list">
                  <li class="idx-note">
                    <span class="idx-note-bullet" aria-hidden="true"></span>
                    <p class="idx-note-text">
                      <span class="idx-note-lead">${t('note_1')}</span>
                      <span class="idx-note-examples">
                        <span class="idx-page-ref">${t('note_1_example_a')}</span>
                        <span class="idx-note-sep">${t('note_1_or')}</span>
                        <span class="idx-page-ref">${t('note_1_example_b')}</span>
                      </span>
                    </p>
                  </li>
                  <li class="idx-note">
                    <span class="idx-note-bullet" aria-hidden="true"></span>
                    <p class="idx-note-text">
                      <span class="idx-note-lead">${t('note_2')}</span>
                      <span class="idx-note-examples">
                        <span class="idx-mark-ref">${t('note_2_mark_a')}</span>
                        <span class="idx-note-sep">${getLocale() === 'ar' ? 'و' : 'and'}</span>
                        <span class="idx-mark-ref">${t('note_2_mark_b')}</span>
                      </span>
                    </p>
                  </li>
                  <li class="idx-note idx-note-highlight">
                    <span class="idx-note-bullet" aria-hidden="true"></span>
                    <p class="idx-note-text">${t('note_3')}</p>
                  </li>
                </ul>
              </div>
            </aside>
          </section>

          ${state.preview ? renderPreviewPanel(state.preview, state.previewTab) : ''}
        </div>
      </main>

      <footer class="mx-auto max-w-6xl px-5 py-10 text-center text-sm text-muted sm:px-8">
        <p>${t('app_name')} · ${t('app_description')}</p>
      </footer>
    </div>
  `;

  bindEvents();
}

function bindEvents(): void {
  document.getElementById('locale-btn')?.addEventListener('click', () => {
    toggleLocale();
    render();
  });

  document.getElementById('brand-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    resetState();
    render();
  });

  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      state.error = t('error_size');
      state.file = null;
      state.fileName = null;
      render();
      return;
    }

    state.file = file;
    state.fileName = file.name;
    state.error = null;
    state.ready = false;
    state.downloadBlob = null;
    state.entryCount = null;
    state.surahCount = null;
    state.preview = null;
    render();
  });

  document.getElementById('process-btn')?.addEventListener('click', async () => {
    if (!state.file || state.processing) return;

    state.processing = true;
    state.error = null;
    render();

    try {
      const buffer = await state.file.arrayBuffer();
      const entries = await parseDocx(buffer);
      const groups = sortAndGroup(entries);
      const blob = await exportDocx(groups, TEMPLATE_URL);

      state.entryCount = entries.length;
      state.surahCount = groups.length;
      state.preview = buildPreviewReport(entries, groups);
      state.previewTab = state.preview.mergeOperations > 0 ? 'merges' : 'after';
      state.downloadBlob = blob;
      state.ready = true;
      showToast(t('success'));
    } catch (err) {
      const code = err instanceof Error ? err.message : 'process';
      state.error =
        code === 'parse_failed' ? t('error_parse')
        : code === 'invalid_docx' ? t('error_invalid')
        : t('error_process');
      showToast(state.error, 'error');
    } finally {
      state.processing = false;
      render();
    }
  });

  document.getElementById('download-btn')?.addEventListener('click', () => {
    if (!state.downloadBlob) return;

    const baseName = state.fileName?.replace(/\.docx$/i, '') ?? 'verse-index';
    const url = URL.createObjectURL(state.downloadBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}-sorted.docx`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('reset-btn')?.addEventListener('click', () => {
    resetState();
    render();
  });

  document.querySelectorAll('[data-preview-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const tab = (button as HTMLElement).dataset.previewTab as PreviewTab | undefined;
      if (!tab || !state.preview) return;
      state.previewTab = tab;
      render();
    });
  });

  document.getElementById('preview-cue-btn')?.addEventListener('click', () => {
    document.getElementById('idx-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function mountApp(): void {
  render();
}
