export const SectionHeadline = ({ title, id }: { title: string; id: string }) => <h3
  id={id}
  className="font-bold print:text-2xl text-4xl  border-b-4 border-b-current pb-2 mb-2">
  {title}
</h3>;
