export type Annotation = {
  id: string;
  phrase: string;
  start: number;
  end: number;
  originalPhrase: string;
  body: string;
  category?:
    | 'idiom'
    | 'historical'
    | 'cultural_reference'
    | 'wordplay'
    | 'slang'
    | 'name';
};

export type LyricLine = {
  original: string;
  translation: string;
  annotations: Annotation[];
};

export type SectionType =
  | 'intro'
  | 'verse'
  | 'pre-chorus'
  | 'chorus'
  | 'bridge'
  | 'outro'
  | 'spoken';

export type LyricSection = {
  id: string;
  type: SectionType;
  label: string;
  lines: LyricLine[];
};

export type Song = {
  id: string;
  title: string;
  artist: string;
  language: string;
  album?: string;
  year?: number;
  sections: LyricSection[];
};
