import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Annotation } from './types';
import { categories } from './categories';

const CARD_GAP = 12;

/**
 * Resolves overlapping annotation cards.
 * Groups items whose ideal ranges overlap, centers each group on its items'
 * average ideal Y, then does a forward pass to push groups down if needed.
 */
function resolveOverlaps(
  items: Array<{ id: string; idealY: number; height: number }>,
  gap: number
): Record<string, number> {
  if (!items.length) return {};

  const sorted = [...items].sort((a, b) => a.idealY - b.idealY);

  const groups: (typeof sorted)[] = [];
  let group = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = group[group.length - 1];
    const prevBottom = prev.idealY + prev.height / 2 + gap;
    const currTop = sorted[i].idealY - sorted[i].height / 2;
    if (currTop < prevBottom) {
      group.push(sorted[i]);
    } else {
      groups.push(group);
      group = [sorted[i]];
    }
  }
  groups.push(group);

  const tops: Record<string, number> = {};
  let prevGroupBottom = 0;

  for (const grp of groups) {
    const totalH = grp.reduce((s, item) => s + item.height, 0) + gap * (grp.length - 1);
    const centerIdeal = grp.reduce((s, item) => s + item.idealY, 0) / grp.length;
    let top = Math.max(prevGroupBottom, Math.max(0, centerIdeal - totalH / 2));
    for (const item of grp) {
      tops[item.id] = top;
      top += item.height + gap;
    }
    prevGroupBottom = top + gap;
  }

  return tops;
}

export function AnnotationLayer({ annotations }: { annotations: Annotation[] }) {
  // Keep DOM element references in a ref — never in state (React may introspect
  // state values, hitting read-only getters on DOM elements).
  const colElsRef = useRef<Record<string, Element>>({});
  // Increment to signal that colElsRef has been populated and a re-render is needed.
  const [colElsVersion, setColElsVersion] = useState(0);
  // Top positions (px relative to column top) keyed by annotation id.
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isReady = Object.keys(positions).length > 0;

  // Phase 1: map each annotation to its column element via DOM lookup.
  useEffect(() => {
    const cols: Record<string, Element> = {};
    document.querySelectorAll('[data-section]').forEach((sectionEl) => {
      const colEl = sectionEl.querySelector('[data-ann-col]');
      if (!colEl) return;
      annotations.forEach((ann) => {
        if (sectionEl.querySelector(`[data-ann="${ann.id}"]`)) {
          cols[ann.id] = colEl;
        }
      });
    });
    colElsRef.current = cols;
    setColElsVersion((v) => v + 1);
    setPositions({});
  }, [annotations]);

  // Phase 2: after cards have rendered (invisible) into their columns,
  // measure heights and ideal Y positions, then compute non-overlapping layout.
  useEffect(() => {
    if (colElsVersion === 0) return;

    requestAnimationFrame(() => {
      const byCol = new Map<Element, Array<{ id: string; idealY: number; height: number }>>();

      document.querySelectorAll('[data-section]').forEach((sectionEl) => {
        const colEl = sectionEl.querySelector('[data-ann-col]');
        if (!colEl) return;
        const colRect = colEl.getBoundingClientRect();

        annotations.forEach((ann) => {
          if (colElsRef.current[ann.id] !== colEl) return;
          const mark = sectionEl.querySelector(`[data-ann="${ann.id}"]`);
          if (!mark) return;
          const markRect = mark.getBoundingClientRect();
          const idealY = markRect.top + markRect.height / 2 - colRect.top;
          const height = cardRefs.current[ann.id]?.offsetHeight ?? 72;

          if (!byCol.has(colEl)) byCol.set(colEl, []);
          byCol.get(colEl)!.push({ id: ann.id, idealY, height });
        });
      });

      const newPositions: Record<string, number> = {};
      byCol.forEach((items, _colEl) => {
        const tops = resolveOverlaps(items, CARD_GAP);
        Object.assign(newPositions, tops);
      });

      setPositions(newPositions);
    });
  }, [colElsVersion, annotations]);

  // Click: toggle active annotation (highlights it, dims others).
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const mark = (e.target as HTMLElement).closest<HTMLElement>('[data-ann]');
      if (mark) {
        e.stopPropagation();
        const id = mark.dataset.ann!;
        setActiveId((prev) => {
          if (prev !== id) {
            window.posthog?.capture('lyrics_annotation_viewed', {
              category: annotations.find((a) => a.id === id)?.category,
              phrase: annotations.find((a) => a.id === id)?.originalPhrase
            });
          }
          return prev === id ? null : id;
        });
      } else {
        setActiveId(null);
      }
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [annotations]);

  // Build portal map: column element → annotations that belong to it.
  const byCol = new Map<Element, Annotation[]>();
  annotations.forEach((ann) => {
    const colEl = colElsRef.current[ann.id];
    if (!colEl) return;
    if (!byCol.has(colEl)) byCol.set(colEl, []);
    byCol.get(colEl)!.push(ann);
  });

  const portals = Array.from(byCol.entries()).map(([colEl, anns]) =>
    createPortal(
      <>
        {anns.map((ann) => (
          <div
            key={ann.id}
            ref={(el) => { cardRefs.current[ann.id] = el; }}
            className="absolute w-full transition-opacity duration-200"
            style={{
              top: positions[ann.id] ?? 0,
              opacity: !isReady
                ? 0
                : activeId === null || activeId === ann.id
                  ? 1
                  : 0.35
            }}
          >
            <CardContent annotation={ann} />
          </div>
        ))}
      </>,
      colEl
    )
  );

  const activeAnn = activeId ? annotations.find((a) => a.id === activeId) : null;

  return (
    <>
      {portals}
      {activeAnn && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg p-4 pb-8">
          <button
            onClick={() => setActiveId(null)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
          <CardContent annotation={activeAnn} />
        </div>
      )}
    </>
  );
}

function CardContent({ annotation }: { annotation: Annotation }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium text-gray-800">{annotation.originalPhrase}</span>
        {annotation.category && (
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded ${categories[annotation.category].style}`}
          >
            {categories[annotation.category].display}
          </span>
        )}
      </div>
      <p className="text-gray-600 leading-snug">{annotation.body}</p>
    </div>
  );
}
