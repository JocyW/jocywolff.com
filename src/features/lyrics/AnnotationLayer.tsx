import { useState, useEffect } from 'react';
import type { Annotation } from './types';
import { DesktopAnnotations } from './DesktopAnnotations';
import { MobileAnnotationSheet } from './MobileAnnotationSheet';

export function AnnotationLayer({
  annotations
}: {
  annotations: Annotation[];
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

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

  return (
    <>
      <DesktopAnnotations annotations={annotations} activeId={activeId} />
      <MobileAnnotationSheet
        annotations={annotations}
        activeId={activeId}
        onClose={() => setActiveId(null)}
      />
    </>
  );
}
