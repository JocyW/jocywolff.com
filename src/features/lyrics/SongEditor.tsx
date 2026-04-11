import React, { useState, useEffect, useRef } from 'react';
import type { Annotation, LyricLine, SectionType, LyricSection } from './types';

type SongMeta = {
  id: string;
  title: string;
  artist: string;
  language: string;
  album: string;
  year: string;
  spotifyId: string;
};

type AnnotationDraft = {
  originalPhrase: string;
  phrase: string;
  category: NonNullable<Annotation['category']>;
  body: string;
};

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

function emptyDraft(): AnnotationDraft {
  return { originalPhrase: '', phrase: '', category: 'idiom', body: '' };
}

function deriveSongId(meta: SongMeta): string {
  return (
    [meta.artist, meta.title]
      .filter(Boolean)
      .join('-')
      .toLowerCase()
      .replace(/\s+/g, '-') || 'song'
  );
}

function buildSong(id: string, sections: LyricSection[], meta: SongMeta) {
  return {
    id,
    title: meta.title,
    artist: meta.artist,
    language: meta.language,
    ...(meta.album ? { album: meta.album } : {}),
    ...(meta.year ? { year: parseInt(meta.year) } : {}),
    ...(meta.spotifyId ? { spotifyId: meta.spotifyId } : {}),
    sections
  };
}

const DEFAULT_META: SongMeta = {
  id: '',
  title: '',
  artist: '',
  language: '',
  album: '',
  year: '',
  spotifyId: ''
};

// ---- AutoTextarea ----

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

  function update<K extends keyof AnnotationDraft>(k: K, v: AnnotationDraft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  const canAdd = draft.originalPhrase.trim() && draft.body.trim();

  return (
    <div className="mt-1 ml-2 border-l-2 border-dark-green pl-3 flex flex-col gap-2 bg-gray-50 rounded-r p-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">Original phrase</label>
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
            update('category', e.target.value as NonNullable<Annotation['category']>)
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
          onClick={() => { if (canAdd) onAdd(draft); }}
          disabled={!canAdd}
          className="bg-dark-green text-white text-xs px-3 py-1 rounded hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {submitLabel}
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
  onEditAnnotation,
  onDeleteAnnotation
}: {
  line: LyricLine;
  syncedCount: number;
  onTranslationChange: (v: string) => void;
  onAddAnnotation: (draft: AnnotationDraft) => void;
  onEditAnnotation: (id: string, draft: AnnotationDraft) => void;
  onDeleteAnnotation: (id: string) => void;
}) {
  const [showAnnotationEditor, setShowAnnotationEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <div className="grid grid-cols-2 gap-3 items-start">
        <p className="text-sm text-gray-500 pt-1 leading-relaxed">{line.original}</p>
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
      {line.annotations.length > 0 && (
        <div className="mt-1 flex flex-col gap-1">
          {line.annotations.map((ann) =>
            editingId === ann.id ? (
              <AnnotationEditor
                key={ann.id}
                initialDraft={{
                  originalPhrase: ann.originalPhrase,
                  phrase: ann.phrase,
                  category: ann.category ?? 'idiom',
                  body: ann.body
                }}
                submitLabel="Save changes"
                onAdd={(draft) => {
                  onEditAnnotation(ann.id, draft);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
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
                  onClick={() => setEditingId(ann.id)}
                  className="text-gray-300 hover:text-dark-green shrink-0"
                  aria-label="Edit annotation"
                >
                  ✎
                </button>
                <button
                  onClick={() => onDeleteAnnotation(ann.id)}
                  className="text-gray-300 hover:text-red-400 shrink-0"
                  aria-label="Delete annotation"
                >
                  ×
                </button>
              </div>
            )
          )}
        </div>
      )}
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

// ---- Editor UI ----

function EditorUI({
  sections,
  meta,
  onMetaChange,
  onSectionLabelChange,
  onTranslationChange,
  onAddAnnotation,
  onEditAnnotation,
  onDeleteAnnotation,
  onSave
}: {
  sections: LyricSection[];
  meta: SongMeta;
  onMetaChange: (m: SongMeta) => void;
  onSectionLabelChange: (sectionId: string, label: string) => void;
  onTranslationChange: (sectionId: string, lineIdx: number, v: string) => void;
  onAddAnnotation: (sectionId: string, lineIdx: number, draft: AnnotationDraft) => void;
  onEditAnnotation: (
    sectionId: string,
    lineIdx: number,
    annotationId: string,
    draft: AnnotationDraft
  ) => void;
  onDeleteAnnotation: (sectionId: string, lineIdx: number, annotationId: string) => void;
  onSave: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [copied, setCopied] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave();
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function copyJson() {
    const id = meta.id.trim() || deriveSongId(meta);
    const json = JSON.stringify(buildSong(id, sections, meta), null, 2);
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

  function metaField(label: string, key: keyof SongMeta, placeholder: string) {
    return (
      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-gray-400">{label}</label>
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

  const allOriginals = React.useMemo(
    () => sections.flatMap((s) => s.lines.map((l) => l.original)),
    [sections]
  );

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

  const actionBtns = (
    <div className="flex gap-2 items-center">
      <a href="/lyrics-editor" className="text-sm text-gray-400 hover:text-gray-600">
        ← Back
      </a>
      <button
        onClick={copyJson}
        className="text-sm border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors"
      >
        {copied ? 'Copied!' : 'Copy JSON'}
      </button>
      <button
        onClick={save}
        disabled={saving}
        className="text-sm bg-dark-green text-white px-4 py-1.5 rounded hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        {savedMsg ? 'Saved ✓' : saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Lyrics Editor</h1>
        {actionBtns}
      </div>

      <div className="flex flex-col gap-2 p-4 border border-gray-100 rounded-lg bg-gray-50">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Song details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {metaField('ID', 'id', meta.id || deriveSongId(meta))}
          {metaField('Title', 'title', 'Song title')}
          {metaField('Artist', 'artist', 'Artist name')}
          {metaField('Language', 'language', 'e.g. de, nl, fr')}
          {metaField('Album', 'album', 'Album name (optional)')}
          {metaField('Year', 'year', 'e.g. 2019 (optional)')}
          {metaField('Spotify track ID', 'spotifyId', 'e.g. 4uLU6hMCjMI75M1A2tKUQC')}
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
                onEditAnnotation={(id, draft) =>
                  onEditAnnotation(section.id, lineIdx, id, draft)
                }
                onDeleteAnnotation={(id) =>
                  onDeleteAnnotation(section.id, lineIdx, id)
                }
              />
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end pt-2">{actionBtns}</div>
    </div>
  );
}

// ---- Main export ----

export function SongEditor() {
  const songId = new URLSearchParams(window.location.search).get('id') ?? '';
  const [meta, setMeta] = useState<SongMeta>(DEFAULT_META);
  const [sections, setSections] = useState<LyricSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!songId) { setNotFound(true); setLoading(false); return; }
    fetch(`/api/songs/${encodeURIComponent(songId)}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((song) => {
        if (!song) return;
        setSections(song.sections ?? []);
        setMeta({
          id: song.id ?? '',
          title: song.title ?? '',
          artist: song.artist ?? '',
          language: song.language ?? '',
          album: song.album ?? '',
          year: song.year ? String(song.year) : '',
          spotifyId: song.spotifyId ?? ''
        });
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [songId]);

  async function handleSave() {
    const id = meta.id.trim() || deriveSongId(meta);
    const song = buildSong(id, sections, meta);
    const res = await fetch(`/api/songs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(song),
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) return;
    if (id !== songId) {
      await fetch(`/api/songs/${encodeURIComponent(songId)}`, { method: 'DELETE' });
      window.history.replaceState({}, '', `/lyrics-editor/edit?id=${encodeURIComponent(id)}`);
    }
    if (!meta.id.trim()) {
      setMeta((m) => ({ ...m, id }));
    }
  }

  function updateSection(
    sectionId: string,
    updater: (s: LyricSection) => LyricSection
  ) {
    setSections((prev) => prev.map((s) => (s.id === sectionId ? updater(s) : s)));
  }

  function handleSectionLabelChange(sectionId: string, label: string) {
    updateSection(sectionId, (s) => ({ ...s, label, type: labelToSectionType(label) }));
  }

  function handleTranslationChange(sectionId: string, lineIdx: number, v: string) {
    const targetOriginal =
      sections.find((s) => s.id === sectionId)?.lines[lineIdx]?.original ?? '';
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
    window.posthog?.capture('lyrics_annotation_added', { category: draft.category });
  }

  function handleEditAnnotation(
    sectionId: string,
    lineIdx: number,
    annotationId: string,
    draft: AnnotationDraft
  ) {
    updateSection(sectionId, (s) => {
      const lines = s.lines.map((l, i) => {
        if (i !== lineIdx) return l;
        return {
          ...l,
          annotations: l.annotations.map((a) =>
            a.id === annotationId
              ? {
                  ...a,
                  originalPhrase: draft.originalPhrase.trim(),
                  phrase: draft.phrase.trim(),
                  body: draft.body.trim(),
                  category: draft.category
                }
              : a
          )
        };
      });
      return { ...s, lines };
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
        return { ...l, annotations: l.annotations.filter((a) => a.id !== annotationId) };
      });
      return { ...s, lines };
    });
    window.posthog?.capture('lyrics_annotation_deleted');
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Loading…</p>;
  }

  if (notFound) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-500">Song not found.</p>
        <a href="/lyrics-editor" className="text-sm text-dark-green hover:underline">
          ← Back to editor
        </a>
      </div>
    );
  }

  return (
    <EditorUI
      sections={sections}
      meta={meta}
      onMetaChange={setMeta}
      onSectionLabelChange={handleSectionLabelChange}
      onTranslationChange={handleTranslationChange}
      onAddAnnotation={handleAddAnnotation}
      onEditAnnotation={handleEditAnnotation}
      onDeleteAnnotation={handleDeleteAnnotation}
      onSave={handleSave}
    />
  );
}
