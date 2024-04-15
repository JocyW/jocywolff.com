import { ExperienceEntry } from './ExperienceEntity';
import { SectionHeadline } from '../SectionHeadline';


export const Experience = () => {
  return <div class="pt-1">
    <div class="contents text-dark-green">
      <SectionHeadline title="Experience" />
    </div>
    <div class="flex flex-col gap-5 px-2">
      <ExperienceEntry
        company="Santander Auto Software"
        title="Senior Software Engineer"
        startDate="May 2022"
        endDate="Present"
        location="Remote"
        skills={[
          'Typescript', 'React', 'Kotlin', 'SpringBoot', 'GraphQL'
        ]}
      >
        SDE-2 on a Europe-wide greenfield initiative. Building a leasing system from the ground up with an
        international system; focusing on Frontend Engineering.
        <ul class="list-disc pl-4">
          <li>
            Identified process gaps autonomously, devising and implementing software solutions to address
            them
            effectively.
          </li>
          <li>
            Played a key role in crafting original software patterns, laying the groundwork for scalable and
            efficient
            systems.
          </li>
          <li>
            Defined essential requirements for the initial go-live, ensuring a smooth and successful
            launch.
          </li>
          <li>
            Designed the interviewing process to test and onboard top engineering talent clearing the high
            bar of the program.
          </li>
          <li>
            Engineered patterns enabling seamless scalability from a small team to over 50 engineers and
            from a
            single-country MVP to supporting multiple processes across various countries.
          </li>
        </ul>
      </ExperienceEntry>
      <ExperienceEntry
        company="Santander Germany"
        title="Frontend Engineer"
        startDate="Nov 2021"
        endDate="May 2022"
        location="Mönchengladbach"
        skills={['React', 'Redux', 'Web components']}
      >
        Lead frontend engineer on the customer-facing digital financing journey for mobility.
        <ul class="list-disc pl-4">
          <li>Led the overhaul of an existing frontend application, streamlining complex and unwieldy code
            into a more maintainable and efficient hook-based React application.
          </li>
          <li>Spearheaded the adoption of contemporary frontend development practices, implementing
            backend-side state management to replace a redux-based frontend state machine.
          </li>
          <li>Pioneered the effort to enable white labelling of the frontend application, allowing seamless
            customization for different prominent mobility partners.
          </li>
          <li>Collaborated closely with backend engineers, designers, and product managers to ensure alignment
            and successful implementation of white labelling features.
          </li>
        </ul>
      </ExperienceEntry>
      <ExperienceEntry
        company="Santander Germany"
        title="Dual Student"
        startDate="Jun 2018"
        endDate="Nov 2021"
        location="Mönchengladbach"
        skills={['Ruby on rails', 'Vue.js', 'Node.js', 'PostgreSQL']}
      >
        Filled the role of technical lead for a team of students. Developed internal web software with various
        frontend and backend technologies.
        <ul class="list-disc pl-4">
          <li>
            Guided and mentored a team of student developers, fostering collaboration and maximizing
            productivity in our projects.
          </li>
          <li>
            Led the development effort to replace multiple HR applications, including the internal job
            postings portal and telephone directory, with a unified and streamlined solution.
          </li>
          <li>
            Acted as lead engineer, product owner, and platforms engineer, ensuring cohesion between
            technical development, product vision, and platform architecture.
          </li>
          <li>
            Implemented agile practices to facilitate iterative development cycles, enabling rapid
            deployment of new features and continuous improvement.
          </li>
          <li>
            Worked closely with HR stakeholders to understand requirements, gather feedback, and iterate on
            solutions to meet their evolving needs.
          </li>
        </ul>
      </ExperienceEntry>
      <ExperienceEntry
        company="Paragon eSports e.V."
        title="Co-Developer of Paragon League"
        startDate="2013"
        endDate="2017"
        location="Remote"
        skills={['PHP', 'Laravel', 'Websockets', 'MySQL']}
      >
        <div>
          Developed an online eSports tournament page from scratch in Laravel with PHP that hosted over 1.000
          events. Created a managed server software in PHP to enable a single administrator to manage
          tournaments
          with up to 500 participants, with real-time in-game statistics that deeply integrated with the web
          platform via HTTP APIs and Websockets.
        </div>
        <a href="https://league.paragon-esports.com">https://league.paragon-esports.com</a>
      </ExperienceEntry>
    </div>
  </div>;
};
