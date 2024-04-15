import { Picture } from './components/Picture';
import { Name } from './components/Name';
import { PersonalDetails } from './components/PersonalDetails';
import { Skills } from './components/Skills';
import { Languages } from './components/Languages';
import { Experience } from './components/Experience/Experience';
import { Education } from './components/Education';
import { Certifications } from './components/Certifications';
import { Layout } from './Layout';


export const App = () => {
  return <div class="contents print:text-xs">
    <Layout>
      <Picture />
      <div class="flex col-span-2 p-2 items-center">
        <div class="flex flex-col">
          <Name />
          <PersonalDetails />
        </div>
      </div>
    </Layout>
    <Layout>
      <aside class="bg-dark-green text-white px-8 py-3 flex flex-col gap-8">
        <Skills />
        <Languages />
      </aside>
      <main class="col-span-2 p-2 flex flex-col gap-6">
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