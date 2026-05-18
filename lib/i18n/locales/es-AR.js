/**
 * Argentine Spanish locale for Cynthia Studio.
 * Extends es.js with Argentina-specific terminology and expressions.
 * Uses 'vos' and unique Argentine vocabulary.
 */
import { es } from '../es.js';

export const esAR = {
  ...es,
  nav: {
    ...es.nav,
  },
  character: {
    ...es.character,
  },
  storyboard: {
    ...es.storyboard,
  },
  cineStudio: {
    ...es.cineStudio,
  },
  landing: {
    ...es.landing,
    hero_subtitle: 'Creá tus personajes una vez. Usálos en imágenes, videos, avisos y escenas cinematográficas.',
  },
  common: {
    ...es.common,
  },
};

export default esAR;
