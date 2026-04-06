import type { Annotation } from './types';
import { categories } from './categories';

export function AnnotationCard({ annotation }: { annotation: Annotation }) {
  return (
    <div className="text-sm flex flex-col gap-1">
      {annotation.category && (
        <span
          className={`text-xs font-medium px-1.5 py-0.5 rounded self-start ${categories[annotation.category].style}`}
        >
          {categories[annotation.category].display}
        </span>
      )}
      <p className="text-gray-600 leading-snug">{annotation.body}</p>
    </div>
  );
}
