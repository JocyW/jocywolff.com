import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Annotation } from './types';
import { categories } from './categories';

const CARD_GAP = 12;

type Positioned = { top: number; colEl: Element };

/**
 * Resolves overlapping annotation cards.
 *
 * Groups items whose ideal ranges overlap, centers each group on its items'
 * average ideal Y, then does a forward pass to push groups down if they
 * overlap each other.
 */
function resolveOverlaps(
  items: Array<{ id: string; idealY: number; height: number }>,
  gap: number
): Record<string, number> {
  if (!items.length) return {};

  const sorted = [...items].sort((a, b) => a.idealY - b.idealY);

  // Build groups of items whose ideal ranges would visually overlap
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
    // Center the group on the average ideal, but don't go above the previous group
    let top = Math.max(prevGroupBottom, centerIdeal - totalH / 2);
    // Don't go above column top
    top = Math.max(0, top);
    for (const item of grp) {
      tops[item.id] = top;
      top += item.height + gap;
    }
    prevGroupBottom = top + gap;
  }

  return tops;
}

export function AnnotationLayer({ annotations }: { annotations: Annotation[] }) {
  // Map from annotation id → its column DOM element (determined by which section the mark is in)
  const [colEls, setColEls] = useState<Record<string, Element>>({});
  // Final computed positions: annotation id → { top (px relative to col), colEl }
  const [positioned, setPositioned] = useState<Record<string, Positioned>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isReady = Object.keys(positioned).length > 0;

  // Phase 1: discover which column element each annotation lives in.
  // This triggers a render so cards are rendered (invisible) into their columns.
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
    setColEls(cols);
    setPositioned({});
  }, [annotations]);

  // Phase 2: after cards have been rendered (invisible), measure heights
  // and ideal Y positions, then compute non-overlapping layout.
  useEffect(() => {
    if (Object.keys(colEls).length === 0) return;

    requestAnimationFrame(() => {
      const byCol = new Map<Element, Array<{ id: string; idealY: number; height: number }>>();

      document.querySelectorAll('[data-section]').forEach((sectionEl) => {
        const colEl = sectionEl.querySelector('[data-ann-col]');
        if (!colEl) return;
        const colRect = colEl.getBoundingClientRect();

        annotations.forEach((ann) => {
          if (colEls[ann.id] !== colEl) return;
          const mark = sectionEl.querySelector(`[data-ann="${ann.id}"]`);
          if (!mark) return;
          const markRect = mark.getBoundingClientRect();
          const idealY = markRect.top + markRect.height / 2 - colRect.top;
          const height = cardRefs.current[ann.id]?.offsetHeight ?? 72;

          if (!byCol.has(colEl)) byCol.set(colEl, []);
          byCol.get(colEl)!.push({ id: ann.id, idealY, height });
        });
      });

      const newPositioned: Record<string, Positioned> = {};
      byCol.forEach((items, colEl) => {
        const tops = resolveOverlaps(items, CARD_GAP);
        items.forEach(({ id }) => {
          if (tops[id] !== undefined) {
            newPositioned[id] = { top: tops[id], colEl };
          }
        });
      });

      setPositioned(newPositioned);
    });
  }, [colEls, annotations]);

  // Click: toggle active annotation (highlights it, dims others)
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

  // Group annotations by column for portals
  const byCol = new Map<Element, Annotation[]>();
  annotations.forEach((ann) => {
    const colEl = colEls[ann.id];
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
              top: positioned[ann.id]?.top ?? 0,
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
      {/* Mobile: show active annotation as bottom sheet */}
      {activeAnn && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg p-4">
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
