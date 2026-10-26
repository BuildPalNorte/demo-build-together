'use client';

import React, { useState, useEffect } from 'react';
import {
  DISCIPLINES,
  SKILLS,
  INTERESTS,
  DEFAULT_EVENT_SLUG,
  Discipline,
  Skill,
  Interest,
} from '@/lib/events/constants';
import {
  Alert,
  Button,
  CloseButton,
  Input,
  Label,
  Modal,
  Spinner,
  TextField,
  ToggleButton,
} from '@heroui/react';
import confetti from 'canvas-confetti';

export interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess: (data: { participant: any; newConnections: any[] }) => void;
  eventSlug?: string;
}

export function RegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  eventSlug = DEFAULT_EVENT_SLUG,
}: RegistrationModalProps) {
  const [visitorId, setVisitorId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [discipline, setDiscipline] = useState<Discipline | ''>('');
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccessState, setIsSuccessState] = useState(false);

  useEffect(() => {
    let vid = localStorage.getItem('bt_visitor_id');
    if (!vid) {
      vid = crypto.randomUUID();
      localStorage.setItem('bt_visitor_id', vid);
    }
    setVisitorId(vid);
    const savedName = localStorage.getItem('bt_display_name');
    if (savedName) setDisplayName(savedName);
  }, []);

  const toggleSkill = (skill: Skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((item) => item !== skill));
    } else if (selectedSkills.length < 4) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const toggleInterest = (interest: Interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((item) => item !== interest));
    } else if (selectedInterests.length < 3) {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!displayName.trim() || displayName.length < 2) {
      setErrorMessage('Escribe tu nombre, con al menos 2 letras.');
      return;
    }
    if (!discipline) {
      setErrorMessage('Elige tu carrera.');
      return;
    }
    if (selectedSkills.length === 0) {
      setErrorMessage('Elige al menos una habilidad.');
      return;
    }
    if (selectedInterests.length === 0) {
      setErrorMessage('Elige al menos un interés.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventSlug,
          displayName: displayName.trim(),
          discipline,
          skills: selectedSkills,
          interests: selectedInterests,
          consent: true,
          visitorId,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo completar el registro.');

      localStorage.setItem('bt_display_name', displayName.trim());

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduceMotion) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#f7f4ee', '#cfc3a2', '#ffffff'],
        });
      }

      setIsSuccessState(true);
      window.setTimeout(() => {
        setIsSuccessState(false);
        onSuccess(data);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
      isDismissable={!isSubmitting}
      isKeyboardDismissDisabled={isSubmitting}
      variant="opaque"
    >
      <Modal.Container placement="auto" scroll="inside" className="bt-sheet-wrap">
        <Modal.Dialog className="bt-sheet" aria-labelledby="registro-titulo">
          <div className="grabber" aria-hidden="true" />
          <Modal.Header>
            <div>
              <Modal.Heading id="registro-titulo">Únete a la red</Modal.Heading>
              <p className="mt-2 text-[17px] leading-snug text-[var(--mist)]">
                Nombre, carrera, lo que sabes y lo que te gusta. Sin correo.
              </p>
            </div>
            <CloseButton aria-label="Cerrar registro" isDisabled={isSubmitting} onPress={onClose} className="icon-btn" />
          </Modal.Header>

          <Modal.Body>
            {isSuccessState ? (
              <div className="arrival">
                <span className="arrival-orb" aria-hidden="true">
                  {displayName
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()}
                </span>
                <h3 className="mt-5 text-[28px] font-semibold tracking-[-0.04em]">Ya estás en el salón</h3>
                <p className="mx-auto mt-2 max-w-xs text-[17px] leading-snug text-[var(--mist)]">
                  Tu luz aparece en el proyector y busca coincidencias.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <TextField
                  autoFocus={isOpen}
                  isRequired
                  fullWidth
                  value={displayName}
                  onChange={setDisplayName}
                  className="gap-2"
                >
                  <Label>¿Cómo te llamas?</Label>
                  <Input placeholder="Sofía o Dan" maxLength={40} />
                </TextField>

                <fieldset>
                  <legend className="mb-2">Carrera</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {DISCIPLINES.map((item) => (
                      <ToggleButton
                        key={item}
                        className="choice-toggle"
                        isSelected={discipline === item}
                        onChange={(selected) => {
                          if (selected) setDiscipline(item);
                        }}
                      >
                        {item}
                      </ToggleButton>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-2 flex items-baseline justify-between">
                    <span>Habilidades</span>
                    <span className="ml-3 text-[15px] font-normal tabular-nums text-[var(--faint)]">
                      {selectedSkills.length}/4
                    </span>
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map((item) => (
                      <ToggleButton
                        key={item}
                        className="choice-toggle"
                        isSelected={selectedSkills.includes(item)}
                        onChange={() => toggleSkill(item)}
                      >
                        {item}
                      </ToggleButton>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-2 flex items-baseline justify-between">
                    <span>Intereses</span>
                    <span className="ml-3 text-[15px] font-normal tabular-nums text-[var(--faint)]">
                      {selectedInterests.length}/3
                    </span>
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((item) => (
                      <ToggleButton
                        key={item}
                        className="choice-toggle"
                        isSelected={selectedInterests.includes(item)}
                        onChange={() => toggleInterest(item)}
                      >
                        {item}
                      </ToggleButton>
                    ))}
                  </div>
                </fieldset>

                {errorMessage && (
                  <Alert status="danger">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title className="text-[16px] text-[var(--danger)]">{errorMessage}</Alert.Title>
                    </Alert.Content>
                  </Alert>
                )}

                <Button type="submit" fullWidth isDisabled={isSubmitting} isPending={isSubmitting}>
                  {({ isPending }) => (
                    <>
                      {isPending ? <Spinner color="current" size="sm" /> : null}
                      {isPending ? 'Entrando' : 'Entrar a la red'}
                    </>
                  )}
                </Button>
              </form>
            )}
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
