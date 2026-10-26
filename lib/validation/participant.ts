import { z } from 'zod';
import { DISCIPLINES, SKILLS, INTERESTS, DEFAULT_EVENT_SLUG } from '../events/constants';

export const registerParticipantSchema = z.object({
  eventSlug: z.string().default(DEFAULT_EVENT_SLUG),
  displayName: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(40, 'El nombre no puede exceder 40 caracteres')
    .regex(/^[^<>]*$/, 'El nombre contiene caracteres inválidos'),
  discipline: z.enum(DISCIPLINES as unknown as [string, ...string[]], {
    error: 'Selecciona una disciplina válida',
  }),
  skills: z
    .array(z.enum(SKILLS as unknown as [string, ...string[]]))
    .min(1, 'Selecciona al menos una habilidad')
    .max(4, 'Selecciona como máximo 4 habilidades'),
  interests: z
    .array(z.enum(INTERESTS as unknown as [string, ...string[]]))
    .min(1, 'Selecciona al menos un área de interés')
    .max(3, 'Selecciona como máximo 3 áreas de interés'),
  consent: z.literal(true, {
    error: 'Debes aceptar compartir tu perfil dentro de la red del taller',
  }),
  visitorId: z.string().uuid('Identificador de visitante inválido'),
});

export type RegisterParticipantInputSchema = z.infer<typeof registerParticipantSchema>;
