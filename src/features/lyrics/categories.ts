import type { Annotation } from './types';

export const categories: Record<
  NonNullable<Annotation['category']>,
  { style: string; display: string }
> = {
  idiom: { style: 'bg-blue-100 text-blue-800', display: 'Idiom' },
  wordplay: { style: 'bg-purple-100 text-purple-800', display: 'Word play' },
  cultural_reference: {
    style: 'bg-amber-100 text-amber-800',
    display: 'Cultural reference'
  },
  historical: {
    style: 'bg-stone-100 text-stone-800',
    display: 'Historical reference'
  },
  slang: { style: 'bg-green-100 text-green-800', display: 'Slang' },
  name: { style: 'bg-rose-100 text-rose-800', display: 'Name' }
};
