import { ConnectionData, ParticipantData } from '@/hooks/use-network-realtime';

/**
 * A rehearsal room for `?demo=1` when nobody has joined yet.
 * Real registrations replace it as soon as the event has people.
 */
const at = (minutes: number) => new Date(Date.UTC(2026, 9, 25, 23, minutes, 0)).toISOString();

export const DEMO_PARTICIPANTS: ParticipantData[] = [
  {
    id: 'demo-sofia',
    displayName: 'Sofía Hernández',
    discipline: 'Sistemas Computacionales',
    skills: ['Programación', 'Inteligencia Artificial'],
    interests: ['Inteligencia Artificial', 'Videojuegos', 'Música'],
    goal: '',
    createdAt: at(1),
  },
  {
    id: 'demo-diego',
    displayName: 'Diego Salinas',
    discipline: 'Mecatrónica',
    skills: ['Robótica', 'Electrónica'],
    interests: ['Robótica', 'Inteligencia Artificial', 'Videojuegos'],
    goal: '',
    createdAt: at(3),
  },
  {
    id: 'demo-valeria',
    displayName: 'Valeria Cruz',
    discipline: 'Electrónica',
    skills: ['Electrónica', 'Análisis de Datos'],
    interests: ['Videojuegos', 'Anime', 'Aplicaciones'],
    goal: '',
    createdAt: at(5),
  },
  {
    id: 'demo-mateo',
    displayName: 'Mateo Ibarra',
    discipline: 'Industrial',
    skills: ['Análisis de Datos', 'Liderazgo'],
    interests: ['Fútbol', 'Deportes', 'Cine'],
    goal: '',
    createdAt: at(7),
  },
  {
    id: 'demo-renata',
    displayName: 'Renata Solís',
    discipline: 'Ambiental',
    skills: ['Comunicación', 'Análisis de Datos'],
    interests: ['Fotografía', 'Medio Ambiente', 'Arte'],
    goal: '',
    createdAt: at(9),
  },
  {
    id: 'demo-camila',
    displayName: 'Camila Ortiz',
    discipline: 'Química',
    skills: ['Análisis de Datos', 'Diseño 3D'],
    interests: ['Arte', 'Fotografía', 'Anime'],
    goal: '',
    createdAt: at(11),
  },
  {
    id: 'demo-emilio',
    displayName: 'Emilio Garza',
    discipline: 'Civil',
    skills: ['Diseño 3D', 'Liderazgo'],
    interests: ['Fútbol', 'Deportes', 'Fotografía'],
    goal: '',
    createdAt: at(13),
  },
  {
    id: 'demo-luis',
    displayName: 'Luis Paredes',
    discipline: 'Administración / Negocios',
    skills: ['Negocios', 'Marketing'],
    interests: ['Música', 'Cine', 'Aplicaciones'],
    goal: '',
    createdAt: at(15),
  },
];

export const DEMO_CONNECTIONS: ConnectionData[] = [
  {
    id: 'demo-c1',
    sourceId: 'demo-sofia',
    targetId: 'demo-diego',
    score: 19,
    reason: 'Interés mutuo en Inteligencia Artificial y Videojuegos · Programación + Electrónica: habilidades complementarias',
    createdAt: at(20),
  },
  {
    id: 'demo-c2',
    sourceId: 'demo-renata',
    targetId: 'demo-camila',
    score: 18,
    reason: 'Interés mutuo en Fotografía y Arte',
    createdAt: at(21),
  },
  {
    id: 'demo-c3',
    sourceId: 'demo-diego',
    targetId: 'demo-valeria',
    score: 17,
    reason: 'Ambos comparten interés en Videojuegos · Robótica + Electrónica: habilidades complementarias',
    createdAt: at(22),
  },
  {
    id: 'demo-c4',
    sourceId: 'demo-mateo',
    targetId: 'demo-luis',
    score: 16,
    reason: 'Ambos comparten interés en Cine',
    createdAt: at(23),
  },
  {
    id: 'demo-c5',
    sourceId: 'demo-sofia',
    targetId: 'demo-valeria',
    score: 14,
    reason: 'Ambos comparten interés en Videojuegos · Programación + Electrónica: habilidades complementarias',
    createdAt: at(24),
  },
  {
    id: 'demo-c6',
    sourceId: 'demo-emilio',
    targetId: 'demo-mateo',
    score: 11,
    reason: 'Interés mutuo en Fútbol y Deportes',
    createdAt: at(25),
  },
  {
    id: 'demo-c7',
    sourceId: 'demo-luis',
    targetId: 'demo-sofia',
    score: 9,
    reason: 'Ambos comparten interés en Música',
    createdAt: at(26),
  },
  {
    id: 'demo-c8',
    sourceId: 'demo-camila',
    targetId: 'demo-valeria',
    score: 8,
    reason: 'Ambos comparten interés en Anime · Diseño 3D + Electrónica: habilidades complementarias',
    createdAt: at(27),
  },
];
