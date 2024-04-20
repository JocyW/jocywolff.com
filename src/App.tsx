import { Route, Router } from '@solidjs/router';
import { CV } from './pages/cv/CV';
import { Bingo } from './pages/bingo/Bingo';

export const App = () => {
  return <div class="md:mx-[1.6cm] flex flex-col md:gap-[1.4cm]">
    <nav class="bg-dark-green print:hidden flex gap-4 px-6 py-4">
      <a href="/" class="font-extrabold text-white hover:underline focus:underline">CV</a>
      <a href="/bingo" class="font-extrabold text-white hover:underline focus:underline">Bingo</a>
    </nav>
    <Router>
      <Route path="/" component={CV} />
      <Route path="/bingo" component={Bingo} />
    </Router></div>;
};