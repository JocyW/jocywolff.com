import { ExperienceEntry } from './Experience/ExperienceEntity';
import { SectionHeadline } from './SectionHeadline';

export const Certifications = () => {
  return <div>
    <div class="contents text-dark-green">
      <SectionHeadline title="Certificates" />
    </div>
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
  </div>;
};