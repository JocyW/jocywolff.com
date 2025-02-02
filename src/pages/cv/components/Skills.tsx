import { SectionHeadline } from './SectionHeadline';
import { createUniqueId } from 'solid-js';

export const Skills = () => {
  const id = createUniqueId();
  return <div>
    <SectionHeadline title="Skills" id={id} />
    <p aria-labelledby={id} role="region">
      Typescript, React, Responsive design, Accessible design, Tailwind, Kotlin, SpringBoot, Java, GraphQL,
      RESTful,
      PostgreSQL, AWS, Github, Github Actions, Datadog, DGS, Apollo Router, Openshift, Web components, SCSS,
      Figma, Ruby
      on Rails, Vue.js, Node.js, PHP, Laravel, Websockets, Jenkins, Python
    </p>
  </div>;
};