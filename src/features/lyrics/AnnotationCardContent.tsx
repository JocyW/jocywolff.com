import type { Annotation } from './types';
import { categories } from './categories';

export function AnnotationCardContent({
  annotation,
  mobile
}: {
  annotation: Annotation;
  mobile?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="font-medium text-gray-800"
          style={mobile ? { viewTransitionName: 'ann-phrase' } : undefined}
        >
          {annotation.originalPhrase}
        </span>
        {annotation.category && (
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded ${categories[annotation.category].style}`}
            style={mobile ? { viewTransitionName: 'ann-category' } : undefined}
          >
            {categories[annotation.category].display}
          </span>
        )}
      </div>
      <p
        className="text-gray-600 leading-snug"
        style={mobile ? { viewTransitionName: 'ann-body' } : undefined}
      >
        {annotation.body}
      </p>
    </div>
  );
}
