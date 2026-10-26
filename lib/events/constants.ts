export const DEFAULT_EVENT_SLUG = 'tec-matamoros-2026';
export const DEFAULT_EVENT_NAME = 'Build Together — Tec de Matamoros';
export const HOST_PASSCODE = 'tec2026';

export const DISCIPLINES = [
  'Sistemas Computacionales',
  'Industrial',
  'Mecatrónica',
  'Electrónica',
  'Civil',
  'Ambiental',
  'Química',
  'Administración / Negocios',
  'Otra',
] as const;

export type Discipline = (typeof DISCIPLINES)[number];

export const SKILLS = [
  'Programación',
  'Inteligencia Artificial',
  'Diseño UX/UI',
  'Robótica',
  'Electrónica',
  'Análisis de Datos',
  'Marketing',
  'Negocios',
  'Diseño 3D',
  'Liderazgo',
  'Comunicación',
] as const;

export type Skill = (typeof SKILLS)[number];

export const INTERESTS = [
  'Inteligencia Artificial',
  'Videojuegos',
  'Robótica',
  'Aplicaciones',
  'Medio Ambiente',
  'Música',
  'Fútbol',
  'Cine',
  'Fotografía',
  'Anime',
  'Deportes',
  'Arte',
] as const;

export type Interest = (typeof INTERESTS)[number];

/** Any real overlap. Most of the room scores here, so it is not drawn in color. */
export const STRONG_MATCH_SCORE = 8;

/** The matches worth crossing the aula for. These are the glowing filaments. */
export const FILAMENT_SCORE = 16;

/** Short career name drawn under a badge. Discipline is text, not a hue. */
export const DISCIPLINE_SHORT: Record<string, string> = {
  'Sistemas Computacionales': 'Sistemas',
  Industrial: 'Industrial',
  Mecatrónica: 'Mecatrónica',
  Electrónica: 'Electrónica',
  Civil: 'Civil',
  Ambiental: 'Ambiental',
  Química: 'Química',
  'Administración / Negocios': 'Negocios',
  Otra: 'Otra',
};
