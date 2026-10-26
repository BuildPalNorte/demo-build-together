'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Chip, Toolbar, buttonVariants } from '@heroui/react';
import { useNetworkRealtime, ParticipantData } from '@/hooks/use-network-realtime';
import { NetworkGraph } from '@/components/network/NetworkGraph';
import { RegistrationModal } from '@/components/registration/RegistrationModal';
import { Mark } from '@/components/brand/Mark';
import { FILAMENT_SCORE } from '@/lib/events/constants';
import { DEMO_CONNECTIONS, DEMO_PARTICIPANTS } from '@/lib/events/demo-room';

export default function StudentHomePage() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<ParticipantData | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [rehearsal, setRehearsal] = useState(false);

  const { participants, connections, status, isLoading } = useNetworkRealtime({
    eventSlug: 'tec-matamoros-2026',
    pollIntervalMs: 1200,
  });

  useEffect(() => {
    setRehearsal(new URLSearchParams(window.location.search).has('demo'));
  }, []);

  const preview = rehearsal && !isLoading && participants.length === 0;
  const room = preview ? DEMO_PARTICIPANTS : participants;
  const threads = preview ? DEMO_CONNECTIONS : connections;

  useEffect(() => {
    const savedName = localStorage.getItem('bt_display_name');
    if (!savedName || preview) return;
    const found = room.find((person) => person.displayName === savedName);
    if (found) setRegisteredUser(found);
  }, [room, preview]);

  const bestForYou = useMemo(() => {
    if (!registeredUser) return null;
    return threads
      .filter((link) => link.sourceId === registeredUser.id || link.targetId === registeredUser.id)
      .map((link) => {
        const otherId = link.sourceId === registeredUser.id ? link.targetId : link.sourceId;
        const other = room.find((person) => person.id === otherId);
        return other ? { link, other } : null;
      })
      .filter((item): item is { link: (typeof connections)[number]; other: ParticipantData } => Boolean(item))
      .sort((a, b) => b.link.score - a.link.score)[0] ?? null;
  }, [registeredUser, threads, room]);

  const filamentCount = threads.filter((link) => link.score >= FILAMENT_SCORE).length;

  let lede = 'El talento existe. Solo falta conectarlo.';
  if (registeredUser && bestForYou) {
    lede = `${bestForYou.other.displayName} es tu hilo más fuerte, ${bestForYou.link.score} puntos. ${bestForYou.link.reason}.`;
  } else if (registeredUser) {
    lede = 'Tu gafete ya está en el salón. El primer hilo aparece cuando entra alguien compatible.';
  } else if (room.length > 0) {
    lede = preview
      ? 'Vista previa del salón, con ocho personas de ensayo. El registro real las reemplaza.'
      : filamentCount > 0
        ? `${room.length} personas en el salón. ${filamentCount} hilos de ${FILAMENT_SCORE} puntos o más.`
        : `${room.length} personas en el salón. Todavía sin un hilo de ${FILAMENT_SCORE} puntos.`;
  }

  const statusLabel = preview
    ? 'Vista previa'
    : status === 'reconnecting' || status === 'error'
      ? 'Reconectando'
      : room.length > 0
        ? 'En vivo'
        : 'Sincronizando';

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Build Together', text: 'Entra a la red del taller.', url });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const waitingAction = !registeredUser || Boolean(registeredUser && bestForYou);
  const statusClass = preview ? 'preview' : status === 'reconnecting' || status === 'error' ? 'bad' : '';

  return (
    <div className={`screen home${waitingAction ? ' has-action' : ''}`}>
      <NetworkGraph
        participants={room}
        connections={threads}
        highlightParticipantId={registeredUser?.id}
        focusedParticipantId={focusId}
        emptyCopy={null}
        padTop={156}
        padBottom={waitingAction ? 108 : 72}
      />

      <header className="glass-bar">
        <div className="brand">
          <Mark className="h-7 w-7 shrink-0" />
          <div>
            <p>Build Together</p>
            <span>Tec de Matamoros</span>
          </div>
        </div>
        <Toolbar aria-label="Acciones" className="bar-actions">
          <Chip variant="tertiary" className={`status ${statusClass}`}>
            <i className="pip" aria-hidden="true" />
            <Chip.Label>{statusLabel}</Chip.Label>
          </Chip>
          <Link href="/stage" className={buttonVariants({ variant: 'ghost', className: 'bar-btn' })}>
            Proyector
          </Link>
          <Button variant="ghost" className="bar-btn" onPress={share}>
            {copied ? 'Enlace copiado' : 'Compartir'}
          </Button>
        </Toolbar>
      </header>

      <section className="float-copy">
        <h1>{registeredUser ? registeredUser.displayName : 'La red del taller'}</h1>
        <p className="lede">{lede}</p>
      </section>

      {waitingAction && (
        <div className="float-action">
          {!registeredUser ? (
            <Button onPress={() => setIsRegisterOpen(true)}>Unirme a la red</Button>
          ) : (
            bestForYou && (
              <Button onPress={() => setFocusId(bestForYou.other.id)}>
                Ver a {bestForYou.other.displayName.split(' ')[0]}
              </Button>
            )
          )}
        </div>
      )}

      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={(data) => {
          setRegisteredUser(data.participant);
          setIsRegisterOpen(false);
        }}
      />
    </div>
  );
}
