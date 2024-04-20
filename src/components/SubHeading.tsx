import type { JSX } from 'solid-js';


export type SubHeadingProps = {
  children: JSX.Element
} & JSX.HTMLAttributes<HTMLHeadingElement>

export const SubHeading = ({ children, ...props }: SubHeadingProps) => {
  return <h2 class="text-gray-600 print:text-3xl text-4xl" {...props}>
    {children}
  </h2>;
};