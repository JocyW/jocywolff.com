import { ExperienceEntry } from './Experience/ExperienceEntity';
import { SectionHeadline } from './SectionHeadline';
import { createUniqueId } from 'solid-js';

export const Education = () => {
  const id = createUniqueId();
  return <div>
    <div class="text-dark-green contents">
      <SectionHeadline title="Education" id={id} />
    </div>
    <div role="region" class="text-dark-green" aria-labelledby={id}>
      <ExperienceEntry
        title="Bachelor of Science - Business Information Systems"
        company="FOM University of Applied Sciences for Economics and Management"
        startDate="Oct 2021"
        endDate="Dec 2021"
        location="Düsseldorf"
      >
        Part-time, Grade: 1.9
      </ExperienceEntry>
    </div>
  </div>;
};