import { SectionHeadline } from './SectionHeadline';
import { createUniqueId } from 'solid-js';

export const Languages = () => {
  const id = createUniqueId();
  return <div>
    <SectionHeadline title="Languages" id={id} />
    <div class="contents" role="region" aria-labelledby={id}>
      <div>
        German: Native
      </div>
      <div>
        English: Fluent
      </div>
    </div>
  </div>;
};