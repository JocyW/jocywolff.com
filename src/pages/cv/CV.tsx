import { Layout } from './Layout';
import { Picture } from './components/Picture';
import { Name } from './components/Name';
import { PersonalDetails } from './components/PersonalDetails';
import { Skills } from './components/Skills';
import { Languages } from './components/Languages';
import { Experience } from './components/Experience/Experience';
import { Education } from './components/Education';
import { Certifications } from './components/Certifications';

export const CV = () => {
  return <div class="print:text-xs">
    <Layout>
      <Picture />
      <div class="flex col-span-2 p-2 items-center">
        <div class="flex flex-col px-6 md:px-0 pb-6 md:pb-0 print:pb-0 print:px-0">
          <Name />
          <PersonalDetails />
        </div>
      </div>
    </Layout>
    <Layout>
      <aside class="bg-dark-green text-white px-8 py-8 flex flex-col gap-8 md:py-3 print:py-5">
        <Skills />
        <Languages />
      </aside>
      <main class="md:col-span-2 print:col-span-2 md:p-2 flex flex-col gap-6 px-8 print:p-2 print:py-4">
        <Experience />
        <Education />
        <Certifications />
      </main>
    </Layout>
    <div class="print:hidden">
      This page was optimised for a print view.
    </div>
  </div>;
};