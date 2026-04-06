import type { ReactNode, HTMLAttributes } from 'react';

export type SubHeadingProps = {
  children: ReactNode
} & HTMLAttributes<HTMLHeadingElement>

export const SubHeading = ({ children, ...props }: SubHeadingProps) => {
  return <h2 className="text-gray-600 print:text-3xl text-4xl" {...props}>
    {children}
  </h2>;
};
