import React, {
  useState,
  useRef,
  useLayoutEffect,
  useMemo,
  createContext,
  useContext
} from 'react';
import { usePopper } from 'react-popper';
import { categories } from './Annotation';

type Annotation = {
  id: string;
  phrase: string; // English phrase (for English highlighting)
  start: number;
  end: number;
  originalPhrase: string; // German phrase (for German highlighting)
  body: string;
  category?:
    | 'idiom'
    | 'historical'
    | 'cultural_reference'
    | 'wordplay'
    | 'slang'
    | 'name';
};

type LyricLine = {
  original: string;
  translation: string;
  annotations: Annotation[];
};

type SectionType =
  | 'intro'
  | 'verse'
  | 'pre-chorus'
  | 'chorus'
  | 'bridge'
  | 'outro'
  | 'spoken';

type LyricSection = {
  id: string;
  type: SectionType;
  label: string;
  lines: LyricLine[];
};

type Song = {
  id: string;
  title: string;
  artist: string;
  language: string;
  album?: string;
  year?: number;
  sections: LyricSection[];
};

const categoryColours: Record<NonNullable<Annotation['category']>, string> = {
  idiom: 'bg-blue-100 text-blue-800',
  wordplay: 'bg-purple-100 text-purple-800',
  cultural_reference: 'bg-amber-100 text-amber-800',
  historical: 'bg-stone-100 text-stone-800',
  slang: 'bg-green-100 text-green-800',
  name: 'bg-rose-100 text-rose-800'
};

function AnnotatedPhrase({
  text,
  annotation
}: {
  text: string;
  annotation: Annotation;
}) {
  const { activeId, activate } = useContext(AnnotationContext);
  const [referenceEl, setReferenceEl] = useState<HTMLElement | null>(null);
  const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null);
  const isActive = activeId === annotation.id;

  const { styles, attributes } = usePopper(referenceEl, popperEl, {
    placement: 'top',
    modifiers: [{ name: 'offset', options: { offset: [0, 6] } }]
  });

  return (
    <>
      <mark
        ref={setReferenceEl}
        data-ann={annotation.id}
        onClick={(e) => {
          e.stopPropagation();
          activate(annotation.id);
          window.posthog?.capture('lyrics_annotation_viewed', {
            category: annotation.category,
            phrase: annotation.originalPhrase
          });
        }}
        className="bg-yellow-200 rounded px-0.5 not-italic cursor-pointer"
      >
        {text}
      </mark>
      {/* Small-screen popper — hidden on lg where sidebar takes over */}
      <div
        ref={setPopperEl}
        style={{
          ...styles.popper,
          visibility: isActive ? 'visible' : 'hidden'
        }}
        {...attributes.popper}
        className="z-50 max-w-xs bg-gray-900 text-white text-sm rounded-lg px-3 py-2.5 shadow-lg flex flex-col gap-1 lg:hidden"
      >
        {annotation.category && (
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded self-start ${categoryColours[annotation.category]}`}
          >
            {annotation.category.replace('_', ' ')}
          </span>
        )}
        <p className="leading-snug">{annotation.body}</p>
      </div>
    </>
  );
}

function highlightByPhrase(text: string, annotations: Annotation[]) {
  if (annotations.length === 0) return <span>{text}</span>;

  // Build segments using originalPhrase positions
  const located = annotations
    .map((ann) => ({ ann, index: text.indexOf(ann.originalPhrase) }))
    .filter(({ index }) => index !== -1)
    .sort((a, b) => a.index - b.index);

  if (located.length === 0) return <span>{text}</span>;

  const segments: React.ReactNode[] = [];
  let cursor = 0;

  for (const { ann, index } of located) {
    if (index > cursor) {
      segments.push(
        <span key={`plain-${cursor}`}>{text.slice(cursor, index)}</span>
      );
    }
    segments.push(
      <AnnotatedPhrase
        key={ann.id}
        text={ann.originalPhrase}
        annotation={ann}
      />
    );
    cursor = index + ann.originalPhrase.length;
  }

  if (cursor < text.length) {
    segments.push(<span key="plain-end">{text.slice(cursor)}</span>);
  }

  return <>{segments}</>;
}

function AnnotationCard({ annotation }: { annotation: Annotation }) {
  return (
    <div className="text-sm flex flex-col gap-1">
      {annotation.category && (
        <span
          className={`text-xs font-medium px-1.5 py-0.5 rounded self-start ${categoryColours[annotation.category]}`}
        >
          {categories[annotation.category]?.display ?? 'Unknown'}
        </span>
      )}
      <p className="text-gray-600 leading-snug">{annotation.body}</p>
    </div>
  );
}

const COL_WIDTH = 340;

const AnnotationContext = createContext<{
  activeId: string | null;
  activate: (id: string) => void;
}>({
  activeId: null,
  activate: () => {}
});

function Section({ section }: { section: LyricSection }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [visibleId, setVisibleId] = useState<string | null>(null);
  // Per-card positions so cards hold their spot while fading out
  const [positions, setPositions] = useState<
    Record<string, { top: number; chevronY: number }>
  >({});

  const allAnnotations = useMemo(
    () => section.lines.flatMap((l) => l.annotations),
    [section.lines]
  );

  const activate = (id: string) =>
    setActiveId((prev) => (prev === id ? null : id));

  useLayoutEffect(() => {
    if (!activeId) {
      const t = setTimeout(() => setVisibleId(null), 150);
      return () => clearTimeout(t);
    }
    const container = containerRef.current;
    if (!container) return;

    const cRect = container.getBoundingClientRect();
    const markEl = container.querySelector<HTMLElement>(
      `[data-ann="${activeId}"]`
    );
    const cardEl = container.querySelector<HTMLElement>(
      `[data-card="${activeId}"]`
    );
    if (!markEl || !cardEl) return;

    const markCY =
      markEl.getBoundingClientRect().top +
      markEl.getBoundingClientRect().height / 2 -
      cRect.top;
    const cardH = cardEl.getBoundingClientRect().height || 72;
    const top = Math.max(0, markCY - cardH / 2);
    setPositions((prev) => ({
      ...prev,
      [activeId]: { top, chevronY: markCY }
    }));
    setVisibleId(activeId);
  }, [activeId, allAnnotations]);

  const chevronY = visibleId ? positions[visibleId]?.chevronY ?? 0 : 0;

  return (
    <AnnotationContext.Provider value={{ activeId, activate }}>
      <div
        ref={containerRef}
        className="relative flex gap-10"
        onClick={() => setActiveId(null)}
      >
        {/* Lyrics: two-column grid (German | English) */}
        <div className="flex-1 grid grid-cols-2 gap-x-6 content-start">
          <h3 className="col-span-2 text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
            {section.label}
          </h3>
          {section.lines.map((line, i) => (
            <React.Fragment key={i}>
              <p className="text-gray-400 text-sm self-start pb-1.5">
                {highlightByPhrase(line.original, line.annotations)}
              </p>
              <p className="text-gray-900 self-start pb-1.5">{line.translation}</p>
            </React.Fragment>
          ))}
        </div>

        {/* Vertical divider */}
        <div className="hidden lg:relative lg:block w-px bg-gray-200 shrink-0 self-stretch overflow-visible">
          {visibleId && (
            <span
              className="absolute bg-white text-gray-400 text-3xl leading-none select-none -translate-x-1/2 -translate-y-1/2 py-1 transition-opacity duration-150"
              style={{ top: chevronY, left: '50%', opacity: activeId ? 1 : 0 }}
            >
              ‹
            </span>
          )}
        </div>

        {/* Annotation column — cards retain position while fading */}
        <div
          className="hidden lg:block relative shrink-0 overflow-visible"
          style={{ width: COL_WIDTH, minHeight: 1 }}
        >
          {allAnnotations.map((ann) => (
            <div
              key={ann.id}
              data-card={ann.id}
              className="absolute transition-opacity duration-150"
              style={{
                width: COL_WIDTH,
                top: positions[ann.id]?.top ?? 0,
                left: 0,
                opacity: activeId === ann.id && visibleId === ann.id ? 1 : 0,
                pointerEvents: activeId === ann.id ? 'auto' : 'none'
              }}
            >
              <AnnotationCard annotation={ann} />
            </div>
          ))}
        </div>
      </div>
    </AnnotationContext.Provider>
  );
}

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
