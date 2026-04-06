import React, { useState, useEffect, useRef } from 'react';
import type { Annotation, LyricLine, SectionType, LyricSection } from './types';

type SongMeta = {
  title: string;
  artist: string;
  language: string;
  album: string;
  year: string;
};

type EditorState = {
  rawText: string;
  sections: LyricSection[];
  meta: SongMeta;
};

const LS_KEY = 'lyrics-editor-draft';

// ---- Similarity utilities ----

const SIMILARITY_THRESHOLD = 0.85;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

function similarity(a: string, b: string): number {
  const na = normalize(a),
    nb = normalize(b);
  if (na === nb) return 1;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  // Skip expensive Levenshtein when lengths differ too much
  if (Math.min(na.length, nb.length) / maxLen < SIMILARITY_THRESHOLD) return 0;
  return 1 - levenshtein(na, nb) / maxLen;
}

const SECTION_TYPE_MAP: Record<string, SectionType> = {
  intro: 'intro',
  verse: 'verse',
  'pre-chorus': 'pre-chorus',
  prechorus: 'pre-chorus',
  chorus: 'chorus',
  bridge: 'bridge',
  outro: 'outro',
  spoken: 'spoken'
};

function labelToSectionType(label: string): SectionType {
  const lower = label
    .toLowerCase()
    .replace(/\s+\d+$/, '')
    .trim();
  return SECTION_TYPE_MAP[lower] ?? 'verse';
}

function parseGeniusLyrics(text: string): LyricSection[] {
  const lines = text.split('\n');
  const sections: LyricSection[] = [];
  let current: LyricSection | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    const sectionMatch = line.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      if (current) sections.push(current);
      const label = sectionMatch[1];
      current = {
        id: crypto.randomUUID(),
        type: labelToSectionType(label),
        label,
        lines: []
      };
    } else if (line && current) {
      current.lines.push({ original: line, translation: '', annotations: [] });
    }
  }
  if (current) sections.push(current);
  return sections;
}

const CATEGORIES: Annotation['category'][] = [
  'idiom',
  'historical',
  'cultural_reference',
  'wordplay',
  'slang',
  'name'
];

const CATEGORY_LABELS: Record<NonNullable<Annotation['category']>, string> = {
  idiom: 'Idiom',
  historical: 'Historical',
  cultural_reference: 'Cultural Reference',
  wordplay: 'Wordplay',
  slang: 'Slang',
  name: 'Name'
};

type AnnotationDraft = {
  originalPhrase: string;
  phrase: string;
  category: NonNullable<Annotation['category']>;
  body: string;
};

function emptyDraft(): AnnotationDraft {
  return { originalPhrase: '', phrase: '', category: 'idiom', body: '' };
}

function AutoTextarea({
  value,
  onChange,
  placeholder,
  className
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`resize-none overflow-hidden ${className ?? ''}`}
    />
  );
}

// ---- Paste Step ----

function PasteStep({
  rawText,
  onRawTextChange,
  onParse
}: {
  rawText: string;
  onRawTextChange: (t: string) => void;
  onParse: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-gray-800">Lyrics Editor</h1>
      <p className="text-gray-500 text-sm">
        Paste lyrics from Genius (with{' '}
        <code className="bg-gray-100 px-1 rounded">[Section Name]</code>{' '}
        headers) then click Parse.
      </p>
      <textarea
        className="w-full h-96 border border-gray-300 rounded p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-dark-green"
        placeholder={'[Verse 1]\nLine one\nLine two\n\n[Chorus]\nLine one'}
        value={rawText}
        onChange={(e) => onRawTextChange(e.target.value)}
      />
      <div>
        <button
          onClick={onParse}
          disabled={!rawText.trim()}
          className="bg-dark-green text-white px-5 py-2 rounded hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          Parse lyrics
        </button>
      </div>
    </div>
  );
}

// ---- Annotation editor (inline) ----

function AnnotationEditor({
  initialDraft,
  submitLabel = 'Add annotation',
  onAdd,
  onCancel
}: {
  initialDraft?: AnnotationDraft;
  submitLabel?: string;
  onAdd: (draft: AnnotationDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<AnnotationDraft>(
    initialDraft ?? emptyDraft()
  );

  function update<K extends keyof AnnotationDraft>(
    k: K,
    v: AnnotationDraft[K]
  ) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  const canAdd = draft.originalPhrase.trim() && draft.body.trim();

  return (
    <div className="mt-1 ml-2 border-l-2 border-dark-green pl-3 flex flex-col gap-2 bg-gray-50 rounded-r p-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">
          Original phrase
        </label>
        <input
          type="text"
          className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-dark-green"
          placeholder="exact phrase in original language"
          value={draft.originalPhrase}
          onChange={(e) => update('originalPhrase', e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">
          Translated phrase <span className="font-normal">(optional)</span>
        </label>
        <input
          type="text"
          className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-dark-green"
          placeholder="corresponding phrase in translation"
          value={draft.phrase}
          onChange={(e) => update('phrase', e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">Category</label>
        <select
          className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-dark-green bg-white"
          value={draft.category}
          onChange={(e) =>
            update(
              'category',
              e.target.value as NonNullable<Annotation['category']>
            )
          }
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">Annotation</label>
        <AutoTextarea
          value={draft.body}
          onChange={(v) => update('body', v)}
          placeholder="Explain the phrase..."
          className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-dark-green w-full"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (canAdd) onAdd(draft);
          }}
          disabled={!canAdd}
          className="bg-dark-green text-white text-xs px-3 py-1 rounded hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          Add annotation
        </button>
        <button
          onClick={onCancel}
          className="text-gray-400 text-xs px-2 py-1 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---- Line row ----

function LineRow({
  line,
  syncedCount,
  onTranslationChange,
  onAddAnnotation,
  onDeleteAnnotation
}: {
  line: LyricLine;
  syncedCount: number;
  onTranslationChange: (v: string) => void;
  onAddAnnotation: (draft: AnnotationDraft) => void;
  onDeleteAnnotation: (id: string) => void;
}) {
  const [showAnnotationEditor, setShowAnnotationEditor] = useState(false);

  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <div className="grid grid-cols-2 gap-3 items-start">
        <p className="text-sm text-gray-500 pt-1 leading-relaxed">
          {line.original}
        </p>
        <div className="flex flex-col gap-1">
          <AutoTextarea
            value={line.translation}
            onChange={onTranslationChange}
            placeholder="Add translation…"
            className="border border-gray-200 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-dark-green"
          />
          {syncedCount > 1 && (
            <span className="text-xs text-amber-600 bg-amber-50 rounded px-1.5 py-0.5 w-fit">
              synced to {syncedCount} lines
            </span>
          )}
        </div>
      </div>
      {/* Existing annotations */}
      {line.annotations.length > 0 && (
        <div className="mt-1 flex flex-col gap-1">
          {line.annotations.map((ann) => (
            <div
              key={ann.id}
              className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1"
            >
              <span className="font-medium text-gray-800 shrink-0">
                "{ann.originalPhrase}"
              </span>
              <span className="text-gray-400 shrink-0">·</span>
              <span className="italic text-gray-400 shrink-0">
                {CATEGORY_LABELS[ann.category ?? 'idiom']}
              </span>
              <span className="text-gray-400 shrink-0">·</span>
              <span className="flex-1 truncate">{ann.body}</span>
              <button
                onClick={() => onDeleteAnnotation(ann.id)}
                className="text-gray-300 hover:text-red-400 shrink-0 ml-1"
                aria-label="Delete annotation"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {/* Add annotation */}
      {showAnnotationEditor ? (
        <AnnotationEditor
          onAdd={(draft) => {
            onAddAnnotation(draft);
            setShowAnnotationEditor(false);
          }}
          onCancel={() => setShowAnnotationEditor(false)}
        />
      ) : (
        <button
          onClick={() => setShowAnnotationEditor(true)}
          className="mt-1 text-xs text-gray-400 hover:text-dark-green transition-colors"
        >
          + Add annotation
        </button>
      )}
    </div>
  );
}

// ---- Edit Step ----

function EditStep({
  sections,
  onSectionLabelChange,
  onTranslationChange,
  onAddAnnotation,
  onDeleteAnnotation,
  onBack,
  onNext
}: {
  sections: LyricSection[];
  onSectionLabelChange: (sectionId: string, label: string) => void;
  onTranslationChange: (sectionId: string, lineIdx: number, v: string) => void;
  onAddAnnotation: (
    sectionId: string,
    lineIdx: number,
    draft: AnnotationDraft
  ) => void;
  onDeleteAnnotation: (
    sectionId: string,
    lineIdx: number,
    annotationId: string
  ) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const allOriginals = React.useMemo(
    () => sections.flatMap((s) => s.lines.map((l) => l.original)),
    [sections]
  );

  // For each line, count how many other lines have similar original text
  const syncedCounts = React.useMemo(
    () =>
      sections.map((s) =>
        s.lines.map(
          (l) =>
            allOriginals.filter(
              (o) => similarity(o, l.original) >= SIMILARITY_THRESHOLD
            ).length
        )
      ),
    [sections, allOriginals]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">
          Edit translations & annotations
        </h1>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ← Back
          </button>
          <button
            onClick={onNext}
            className="bg-dark-green text-white text-sm px-4 py-1.5 rounded hover:opacity-90 transition-opacity"
          >
            Export JSON →
          </button>
        </div>
      </div>

      {sections.map((section, sectionIdx) => (
        <div key={section.id} className="flex flex-col gap-1">
          <input
            type="text"
            value={section.label}
            onChange={(e) => onSectionLabelChange(section.id, e.target.value)}
            className="text-xs font-semibold uppercase tracking-wider text-gray-500 bg-transparent border-b border-dashed border-gray-200 focus:outline-none focus:border-dark-green w-fit"
          />
          <div className="border border-gray-100 rounded p-2">
            {section.lines.map((line, lineIdx) => (
              <LineRow
                key={lineIdx}
                line={line}
                syncedCount={syncedCounts[sectionIdx]?.[lineIdx] ?? 1}
                onTranslationChange={(v) =>
                  onTranslationChange(section.id, lineIdx, v)
                }
                onAddAnnotation={(draft) =>
                  onAddAnnotation(section.id, lineIdx, draft)
                }
                onDeleteAnnotation={(id) =>
                  onDeleteAnnotation(section.id, lineIdx, id)
                }
              />
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className="bg-dark-green text-white text-sm px-4 py-1.5 rounded hover:opacity-90 transition-opacity"
        >
          Export JSON →
        </button>
      </div>
    </div>
  );
}

// ---- Export Step ----

function ExportStep({
  sections,
  meta,
  onMetaChange,
  onBack
}: {
  sections: LyricSection[];
  meta: SongMeta;
  onMetaChange: (m: SongMeta) => void;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const song = {
    id:
      [meta.artist, meta.title]
        .filter(Boolean)
        .join('-')
        .toLowerCase()
        .replace(/\s+/g, '-') || 'song',
    title: meta.title,
    artist: meta.artist,
    language: meta.language,
    ...(meta.album ? { album: meta.album } : {}),
    ...(meta.year ? { year: parseInt(meta.year) } : {}),
    sections
  };

  const json = JSON.stringify(song, null, 2);

  function copy() {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      window.posthog?.capture('lyrics_exported', {
        song_title: meta.title,
        song_artist: meta.artist,
        section_count: sections.length
      });
    });
  }

  function field(label: string, key: keyof SongMeta, placeholder: string) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">{label}</label>
        <input
          type="text"
          className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-dark-green"
          placeholder={placeholder}
          value={meta[key]}
          onChange={(e) => onMetaChange({ ...meta, [key]: e.target.value })}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Export JSON</h1>
        <button
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Back to editing
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {field('Title', 'title', 'Song title')}
        {field('Artist', 'artist', 'Artist name')}
        {field('Language code', 'language', 'e.g. de, nl, fr')}
        {field('Album (optional)', 'album', 'Album name')}
        {field('Year (optional)', 'year', 'e.g. 2019')}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Song JSON</span>
          <button
            onClick={copy}
            className="text-sm bg-dark-green text-white px-3 py-1 rounded hover:opacity-90 transition-opacity"
          >
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
        </div>
        <textarea
          readOnly
          value={json}
          className="w-full h-96 border border-gray-200 rounded p-3 font-mono text-xs focus:outline-none bg-gray-50"
        />
      </div>
    </div>
  );
}

// ---- Main component ----

const DEFAULT_META: SongMeta = {
  title: '',
  artist: '',
  language: '',
  album: '',
  year: ''
};

function loadFromStorage(): Partial<EditorState> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function LyricsEditor() {
  const saved = loadFromStorage();

  const [step, setStep] = useState<'paste' | 'edit' | 'export'>('paste');
  const [rawText, setRawText] = useState<string>(saved.rawText ?? '');
  const [sections, setSections] = useState<LyricSection[]>(
    saved.sections ?? []
  );
  const [meta, setMeta] = useState<SongMeta>(saved.meta ?? DEFAULT_META);

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ rawText, sections, meta }));
  }, [rawText, sections, meta]);

  // If there's saved data go straight to edit
  useEffect(() => {
    if (sections.length > 0) setStep('edit');
  }, []);

  function handleParse() {
    const parsed = parseGeniusLyrics(rawText);
    setSections(parsed);
    setStep('edit');
    window.posthog?.capture('lyrics_parsed', {
      section_count: parsed.length,
      line_count: parsed.reduce((sum, s) => sum + s.lines.length, 0)
    });
  }

  function updateSection(
    sectionId: string,
    updater: (s: LyricSection) => LyricSection
  ) {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? updater(s) : s))
    );
  }

  function handleSectionLabelChange(sectionId: string, label: string) {
    updateSection(sectionId, (s) => ({
      ...s,
      label,
      type: labelToSectionType(label)
    }));
  }

  function handleTranslationChange(
    sectionId: string,
    lineIdx: number,
    v: string
  ) {
    const targetOriginal =
      sections.find((s) => s.id === sectionId)?.lines[lineIdx]?.original ?? '';
    // Propagate to all lines (across all sections) that are similar to the edited line
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        lines: s.lines.map((l, i) => {
          const isTarget = s.id === sectionId && i === lineIdx;
          const isSimilar =
            !isTarget &&
            similarity(l.original, targetOriginal) >= SIMILARITY_THRESHOLD;
          return isTarget || isSimilar ? { ...l, translation: v } : l;
        })
      }))
    );
  }

  function handleAddAnnotation(
    sectionId: string,
    lineIdx: number,
    draft: AnnotationDraft
  ) {
    updateSection(sectionId, (s) => {
      const lines = s.lines.map((l, i) => {
        if (i !== lineIdx) return l;
        const ann: Annotation = {
          id: crypto.randomUUID(),
          originalPhrase: draft.originalPhrase.trim(),
          phrase: draft.phrase.trim(),
          start: 0,
          end: 0,
          body: draft.body.trim(),
          category: draft.category
        };
        return { ...l, annotations: [...l.annotations, ann] };
      });
      return { ...s, lines };
    });
    window.posthog?.capture('lyrics_annotation_added', {
      category: draft.category
    });
  }

  function handleDeleteAnnotation(
    sectionId: string,
    lineIdx: number,
    annotationId: string
  ) {
    updateSection(sectionId, (s) => {
      const lines = s.lines.map((l, i) => {
        if (i !== lineIdx) return l;
        return {
          ...l,
          annotations: l.annotations.filter((a) => a.id !== annotationId)
        };
      });
      return { ...s, lines };
    });
    window.posthog?.capture('lyrics_annotation_deleted');
  }

  if (step === 'paste') {
    return (
      <PasteStep
        rawText={rawText}
        onRawTextChange={setRawText}
        onParse={handleParse}
      />
    );
  }

  if (step === 'edit') {
    return (
      <EditStep
        sections={sections}
        onSectionLabelChange={handleSectionLabelChange}
        onTranslationChange={handleTranslationChange}
        onAddAnnotation={handleAddAnnotation}
        onDeleteAnnotation={handleDeleteAnnotation}
        onBack={() => setStep('paste')}
        onNext={() => setStep('export')}
      />
    );
  }

  return (
    <ExportStep
      sections={sections}
      meta={meta}
      onMetaChange={setMeta}
      onBack={() => setStep('edit')}
    />
  );
}
