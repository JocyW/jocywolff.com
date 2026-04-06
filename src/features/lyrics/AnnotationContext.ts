import { createContext } from 'react';

export const AnnotationContext = createContext<{
  activeId: string | null;
  activate: (id: string) => void;
}>({
  activeId: null,
  activate: () => {}
});
