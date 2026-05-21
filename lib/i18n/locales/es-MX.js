/**
 * Mexican Spanish locale for Cynthia Studio.
 * Extends es.js with Mexico-specific terminology and expressions.
 */
import { es } from '../es.js';

export const esMX = {
  ...es,
  nav: {
    ...es.nav,
  },
  character: {
    ...es.character,
  },
  landing: {
    ...es.landing,
    hero_subtitle: 'Crea personajes una vez. Úsalos en imágenes, videos, anuncios y escenas cinematográficas.',
  },
  common: {
    ...es.common,
  },
};

export default esMX;
