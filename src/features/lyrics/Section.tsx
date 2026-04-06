import React, {
  useState,
  useRef,
  useLayoutEffect,
  useMemo
} from 'react';
import type { LyricSection } from './types';
import { AnnotationContext } from './AnnotationContext';
import { highlightByPhrase } from './AnnotatedPhrase';
import { AnnotationCard } from './AnnotationCard';

const COL_WIDTH = 340;

export function Section({ section }: { section: LyricSection }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [visibleId, setVisibleId] = useState<string | null>(null);
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
              <p className="text-gray-900 self-start pb-1.5">
                {line.translation}
              </p>
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
