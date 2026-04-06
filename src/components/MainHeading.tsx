import type { ReactNode } from 'react';

export const MainHeading = ({ children }: { children: ReactNode }) => <h1
  className="print:text-5xl text-7xl leading-tight text-dark-green font-extrabold">{children}</h1>;
