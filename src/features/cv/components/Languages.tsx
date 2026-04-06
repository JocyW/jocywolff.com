import { useId } from 'react';
import { SectionHeadline } from './SectionHeadline';

export const Languages = () => {
  const id = useId();
  return <div>
    <SectionHeadline title="Languages" id={id} />
    <div className="contents" role="region" aria-labelledby={id}>
      <div>
        German: Native
      </div>
      <div>
        English: Fluent
      </div>
    </div>
  </div>;
};
