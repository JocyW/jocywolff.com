import type { ReactNode } from 'react';

export const Layout = ({ children }: { children: ReactNode }) => {
  return <div className="md:grid md:grid-cols-3 gap-3 flex flex-col print:grid print:grid-cols-3">
    {children}
  </div>;
};
