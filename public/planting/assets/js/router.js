import { AILearning } from './pages/ai-learning.js';
import { AIPractice } from './pages/ai-practice.js';

const routes = {
  '': AILearning,
  '#/': AILearning,
  '#/ai-learning': AILearning,
  '#/ai-practice': AIPractice,
};

function render(Component) {
  const main = document.getElementById('app-main');
  main.innerHTML = '';
  const el = Component();
  if (typeof el === 'string') {
    main.innerHTML = el;
  } else if (el instanceof HTMLElement) {
    main.appendChild(el);
  }
  main.focus();
}

export const router = {
  init() {
    const onRoute = () => {
      const hash = window.location.hash || '#/';
      const Component = routes[hash] || AILearning;
      render(Component);
    };
    window.addEventListener('hashchange', onRoute);
    onRoute();
  }
};


