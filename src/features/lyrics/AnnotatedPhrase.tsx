import React, { useState, useContext } from 'react';
import { usePopper } from 'react-popper';
import type { Annotation } from './types';
import { categories } from './categories';
import { AnnotationContext } from './AnnotationContext';

export function AnnotatedPhrase({
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
            className={`text-xs font-medium px-1.5 py-0.5 rounded self-start ${categories[annotation.category].style}`}
          >
            {categories[annotation.category].display}
          </span>
        )}
        <p className="leading-snug">{annotation.body}</p>
      </div>
    </>
  );
}

export function highlightByPhrase(
  text: string,
  annotations: Annotation[]
): React.ReactNode {
  if (annotations.length === 0) return <span>{text}</span>;

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
