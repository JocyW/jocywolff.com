import { useState, useEffect } from 'react';
import type { LyricSection, SectionType } from './types';

type SongSummary = { id: string; title: string; artist: string };

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
    const match = line.match(/^\[(.+)\]$/);
    if (match) {
      if (current) sections.push(current);
      const label = match[1];
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

function randomPlaceholderId(): string {
  return `new-song-${crypto.randomUUID().slice(0, 8)}`;
}

export function SongPicker() {
  const [songs, setSongs] = useState<SongSummary[]>([]);
  const [rawText, setRawText] = useState('');
  const [parsing, setParsing] = useState(false);

  useEffect(() => {
    fetch('/api/songs')
      .then((r) => (r.ok ? r.json() : []))
      .then(setSongs)
      .catch(() => {});
  }, []);

  async function handleParse() {
    if (!rawText.trim()) return;
    setParsing(true);
    const sections = parseGeniusLyrics(rawText);
    const id = randomPlaceholderId();
    try {
      await fetch(`/api/songs/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ id, title: '', artist: '', language: '', sections }),
        headers: { 'Content-Type': 'application/json' }
      });
    } catch {}
    window.location.href = `/lyrics-editor/edit?id=${encodeURIComponent(id)}`;
  }

  return (
    <div className="flex flex-col gap-6">
      {songs.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Load existing
            </h2>
            <div className="flex flex-col gap-1">
              {songs.map((song) => (
                <a
                  key={song.id}
                  href={`/lyrics-editor/edit?id=${encodeURIComponent(song.id)}`}
                  className="px-3 py-2 rounded border border-gray-200 hover:border-dark-green hover:bg-gray-50 text-sm transition-colors"
                >
                  {song.title || song.id} — {song.artist}
                </a>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-100" />
        </>
      )}
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
          onChange={(e) => setRawText(e.target.value)}
        />
        <div>
          <button
            onClick={handleParse}
            disabled={!rawText.trim() || parsing}
            className="bg-dark-green text-white px-5 py-2 rounded hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {parsing ? 'Creating…' : 'Parse lyrics'}
          </button>
        </div>
      </div>
    </div>
  );
}
