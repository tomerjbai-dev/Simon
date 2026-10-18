import '@fontsource/heebo/400.css';
import '@fontsource/heebo/500.css';
import '@fontsource/heebo/700.css';
import './styles.css';
import { createApp } from './app';
import { createAudio } from './audio';

const root = document.querySelector<HTMLElement>('#app');
if (root) {
  createApp(root, createAudio());
}
