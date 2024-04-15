import { ExperienceEntry } from './Experience/ExperienceEntity';
import { SectionHeadline } from './SectionHeadline';

export const Education = () => {
  return <div>

    <div class="contents text-dark-green">
      <SectionHeadline title="Education" />
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