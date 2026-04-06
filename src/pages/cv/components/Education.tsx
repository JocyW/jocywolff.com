import { useId } from 'react';
import { ExperienceEntry } from './Experience/ExperienceEntity';
import { SectionHeadline } from './SectionHeadline';

export const Education = () => {
  const id = useId();
  return <div>
    <div className="text-dark-green contents">
      <SectionHeadline title="Education" id={id} />
    </div>
    <div role="region" className="text-dark-green" aria-labelledby={id}>
      <ExperienceEntry
        title="Bachelor of Science - Business Information Systems"
        company="FOM University of Applied Sciences for Economics and Management"
        startDate="Oct 2018"
        endDate="Dec 2021"
        location="Düsseldorf"
      >
        Part-time, Grade: 1.9
      </ExperienceEntry>
    </div>
  </div>;
};
