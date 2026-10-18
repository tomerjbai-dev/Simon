import '@fontsource/heebo/400.css';
import '@fontsource/heebo/500.css';
import '@fontsource/heebo/700.css';
import './styles.css';
import { createInitialState } from './state';
import { render } from './ui';

const root = document.querySelector<HTMLElement>('#app');
if (root) {
  render(root, createInitialState());
}
