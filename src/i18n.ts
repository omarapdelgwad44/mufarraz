export type Locale = 'ar' | 'en';

const messages = {
  ar: {
    app_name: 'مُفَرَّز',
    app_tagline: 'أداة الفهرسة للمصححين اللغويين',
    app_description: 'ترتيب فهارس الآيات ودمج أرقام الصفحات بدقة، بصيغة Word جاهزة للعمل.',
    hero_badge: 'الفهرسة اللغوية',
    hero_title: 'فهرس مرتب',
    hero_title_em: 'بدقة المخطوطة',
    hero_lead: 'ارفع ملف الفهرس غير المرتب، واستلم نسخة مجمّعة حسب السور مع دمج الصفحات تلقائياً.',
    upload_title: 'رفع الملف',
    upload_label: 'ملف Word',
    upload_cta: 'اسحب الملف أو انقر للاختيار',
    upload_formats: 'صيغة .docx فقط — حتى 10 ميجابايت',
    sort_action: 'رتّب الفهرس الآن',
    download_action: 'حمّل النتيجة',
    reset_action: 'ابدأ من جديد',
    processing: 'جاري الترتيب والدمج…',
    uploading: 'جاري قراءة الملف…',
    panel_workflow: 'مسار العمل',
    panel_notes: 'ملاحظات',
    stat_entries: 'مدخلات',
    stat_surahs: 'سور',
    stat_ready: 'جاهز',
    stat_pending: 'بانتظار الملف',
    locale_switch: 'English',
    step_1: 'ارفع ملف الفهرس غير المرتب (.docx) بصيغة الإدخال: الآية، التخريج، رقم الصفحة.',
    step_2: 'يقرأ النظام الآيات والتخريج وأرقام الصفحات من ملفك.',
    step_3: 'يرتب المدخلات حسب ترتيب السور ثم رقم الآية ثم رقم الصفحة.',
    step_4: 'يُنتج ملفًا جديدًا بصيغة الإخراج المرتبة (مجمّعًا حسب السور).',
    note_1: 'تُدمَج الصفحات المتعددة لنفس الآية والتخريج داخل كل جزء، مثل: 1/569 ،571 أو 2/569 ،571.',
    note_2: 'تُحافظ العلامات الخاصة مثل * و(1) على نص الآية كما في الملف الأصلي.',
    note_3: 'يُنصح بمراجعة الناتج قبل الاعتماد النهائي.',
    success: 'تم ترتيب الفهرس بنجاح',
    error_parse: 'تعذر قراءة مدخلات الفهرس من الملف.',
    error_invalid: 'ملف Word غير صالح.',
    error_process: 'تعذرت معالجة الملف، تأكد من صيغة الملف.',
    error_size: 'حجم الملف يتجاوز 10 ميجابايت.',
  },
  en: {
    app_name: 'Mufarraz',
    app_tagline: 'Verse indexing for Arabic proofreaders',
    app_description: 'Sort verse indexes and merge page numbers into a ready-to-use Word file.',
    hero_badge: 'Linguistic indexing',
    hero_title: 'Sorted index',
    hero_title_em: 'manuscript precision',
    hero_lead: 'Upload an unsorted index and get a surah-grouped file with merged page numbers.',
    upload_title: 'Upload file',
    upload_label: 'Word file',
    upload_cta: 'Drag a file or click to choose',
    upload_formats: '.docx only — up to 10 MB',
    sort_action: 'Sort index now',
    download_action: 'Download result',
    reset_action: 'Start over',
    processing: 'Sorting and merging…',
    uploading: 'Reading file…',
    panel_workflow: 'Workflow',
    panel_notes: 'Notes',
    stat_entries: 'entries',
    stat_surahs: 'surahs',
    stat_ready: 'ready',
    stat_pending: 'waiting',
    locale_switch: 'العربية',
    step_1: 'Upload an unsorted index (.docx): verse, reference, page number.',
    step_2: 'The app reads verses, references, and page numbers from your file.',
    step_3: 'Entries are sorted by surah order, ayah number, then page.',
    step_4: 'A new grouped Word file is generated for download.',
    note_1: 'Multiple pages for the same verse merge per volume, e.g. 1/569 ،571.',
    note_2: 'Special marks like * and (1) are preserved in verse text.',
    note_3: 'Review the output before final use.',
    success: 'Index sorted successfully',
    error_parse: 'Could not read index entries from the file.',
    error_invalid: 'Invalid Word file.',
    error_process: 'Processing failed. Check the file format.',
    error_size: 'File exceeds 10 MB.',
  },
} as const;

export type MessageKey = keyof typeof messages.ar;

let currentLocale: Locale = 'ar';

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
}

export function t(key: MessageKey): string {
  return messages[currentLocale][key];
}

export function toggleLocale(): Locale {
  setLocale(currentLocale === 'ar' ? 'en' : 'ar');
  return currentLocale;
}
