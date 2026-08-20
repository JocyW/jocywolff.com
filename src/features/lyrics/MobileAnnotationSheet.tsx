import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import type { Annotation } from './types';
import { AnnotationCardContent } from './AnnotationCardContent';

export function MobileAnnotationSheet({
  annotations,
  activeId,
  onClose
}: {
  annotations: Annotation[];
  activeId: string | null;
  onClose: () => void;
}) {
  const activeAnn = activeId
    ? annotations.find((a) => a.id === activeId)
    : null;

  const [displayAnn, setDisplayAnn] = useState<Annotation | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const prevActiveIdRef = useRef<string | null>(null);

  useEffect(() => {
    const desktopLayoutQuery = window.matchMedia('(min-width: 1024px)');
    const updateLayout = () => setIsCompactLayout(!desktopLayoutQuery.matches);

    updateLayout();
    desktopLayoutQuery.addEventListener('change', updateLayout);
    return () => desktopLayoutQuery.removeEventListener('change', updateLayout);
  }, []);

  useEffect(() => {
    if (!isCompactLayout) {
      prevActiveIdRef.current = null;
      setDisplayAnn(null);
      setIsSheetOpen(false);
      return;
    }

    if (activeAnn) {
      const isSwitching =
        isSheetOpen &&
        prevActiveIdRef.current !== null &&
        prevActiveIdRef.current !== activeAnn.id;
      prevActiveIdRef.current = activeAnn.id;

      if (isSwitching && 'startViewTransition' in document) {
        (document as any).startViewTransition(() => {
          flushSync(() => setDisplayAnn(activeAnn));
        });
      } else {
        // Set content while still off-screen, then slide up in the next frame.
        setDisplayAnn(activeAnn);
        requestAnimationFrame(() => setIsSheetOpen(true));
      }
    } else {
      prevActiveIdRef.current = null;
      setIsSheetOpen(false);
      const t = setTimeout(() => setDisplayAnn(null), 300);
      return () => clearTimeout(t);
    }
  }, [activeAnn, isCompactLayout]);

  return (
    // Always in DOM so the translate transition has a starting point; off-screen when closed.
    <div
      aria-hidden={!isSheetOpen}
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg p-4 pb-8 transition-transform duration-300 ease-in-out ${isSheetOpen ? 'translate-y-0' : 'translate-y-full'}`}
    >
      {isSheetOpen && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg leading-none"
          aria-label="Close"
        >
          ✕
        </button>
      )}
      {displayAnn && <AnnotationCardContent annotation={displayAnn} mobile />}
    </div>
  );
}
