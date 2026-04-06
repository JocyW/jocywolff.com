import type { Song } from './types';
import { Section } from './Section';

export function LyricsDisplay({ song }: { song: Song }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{song.title}</h1>
        <p className="text-gray-500">{song.artist}</p>
      </div>
      {song.sections.map((section) => (
        <Section key={section.id} section={section} />
      ))}
    </div>
  );
}
