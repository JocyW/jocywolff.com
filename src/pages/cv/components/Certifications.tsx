import { ExperienceEntry } from './Experience/ExperienceEntity';
import { SectionHeadline } from './SectionHeadline';
import { createUniqueId } from 'solid-js';

export const Certifications = () => {
  const id = createUniqueId();
  return <div>
    <div class="contents text-dark-green">
      <SectionHeadline title="Certificates" id={id} />
    </div>
    <div class="contents" role="region" aria-labelledby={id}>
      <ExperienceEntry
        title="BeTech & Business Program"
        company="Groupo Santander"
        startDate="Oct 2022"
        endDate="Aug 2023"
        location="Madrid, SÃO PAULO"
      >
        Participated in the international tech talent program with 90 colleagues from 20 different nations.
        Learned about technology trends like generative AI and no-trust banking. Created an MVP and business
        plan for the winning idea for an omnichannel application.
      </ExperienceEntry>
    </div>
  </div>;
};