import { Route, Router } from '@solidjs/router';
import { CV } from './pages/cv/CV';
import { Bingo } from './pages/bingo/Bingo';

export const App = () => {
  return <div class="md:mx-[1.6cm] flex flex-col md:gap-[1.4cm]">
    <Router>
      <Route path="/" component={CV} />
      <Route path="/bingo" component={Bingo} />
    </Router></div>;
};