'use client';

import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Chip, Surface, ToggleButton, Toolbar } from '@heroui/react';
import { useNetworkRealtime } from '@/hooks/use-network-realtime';
import { NetworkGraph } from '@/components/network/NetworkGraph';
import { ActivityFeed } from '@/components/stage/ActivityFeed';
import { Mark } from '@/components/brand/Mark';
import { soundEffects } from '@/lib/audio/sound-effects';
import { FILAMENT_SCORE } from '@/lib/events/constants';
import { DEMO_CONNECTIONS, DEMO_PARTICIPANTS } from '@/lib/events/demo-room';

export default function StagePage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [showFeed, setShowFeed] = useState(true);
  const [joinUrl, setJoinUrl] = useState('');
  const [rehearsal, setRehearsal] = useState(false);
  const [personOpen, setPersonOpen] = useState(false);

  const { participants, connections, stats, status, isLoading } = useNetworkRealtime({
    eventSlug: 'tec-matamoros-2026',
    pollIntervalMs: 1200,
    enableSound: !muted,
  });

  useEffect(() => {
    setJoinUrl(window.location.origin);
    setMuted(soundEffects.getMuted());
    setRehearsal(new URLSearchParams(window.location.search).has('demo'));
  }, []);

  const preview = rehearsal && !isLoading && participants.length === 0;
  const room = preview ? DEMO_PARTICIPANTS : participants;
  const threads = preview ? DEMO_CONNECTIONS : connections;

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleSound = () => {
    const next = soundEffects.toggleMute();
    setMuted(next);
    if (!next) soundEffects.playConnectionFormed();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) rootRef.current?.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  const filamentCount = threads.filter((link) => link.score >= FILAMENT_SCORE).length;
  const peopleCount = preview ? room.length : stats.totalBuilders;
  const careerCount = preview ? new Set(room.map((person) => person.discipline)).size : stats.disciplinesCount;
  const statusLabel = preview
    ? 'Vista previa'
    : status === 'reconnecting' || status === 'error'
      ? 'Reconectando'
      : room.length > 0
        ? 'En vivo'
        : 'Sincronizando';
  const statusClass = preview ? 'preview' : status === 'reconnecting' || status === 'error' ? 'bad' : '';

  return (
    <div ref={rootRef} className="screen stage">
      <main className="stage-main">
        <div className="stage-field">
          <NetworkGraph
            participants={room}
            connections={threads}
            isStageMode
            className="h-full w-full"
            padTop={118}
            padRight={showFeed || personOpen ? 380 : 36}
            onSelectParticipant={(person) => setPersonOpen(Boolean(person))}
            padBottom={36}
            padLeft={36}
          />
        </div>
        {showFeed && !personOpen && (
          <aside className="stage-rail">
            <ActivityFeed participants={room} connections={threads} />
            <Surface variant="default" className="stage-qr">
              <div className="rounded-[12px] bg-white p-1.5">
                {joinUrl ? (
                  <QRCodeSVG value={joinUrl} size={108} level="M" bgColor="#ffffff" fgColor="#16140f" />
                ) : (
                  <div className="h-[108px] w-[108px] bg-[var(--raised)]" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[16px] font-medium leading-tight">Escanea y entra</p>
                <p className="mt-1 break-all text-[13px] leading-snug text-[var(--faint)]">
                  {joinUrl || 'Preparando el enlace'}
                </p>
              </div>
            </Surface>
          </aside>
        )}
      </main>

      <header className="glass-bar">
        <div className="brand">
          <Mark className="h-8 w-8 shrink-0" />
          <h1>Build Together</h1>
        </div>
        <div className="figures stage-figures">
          <div>
            <b>{peopleCount}</b>
            <span>Personas</span>
          </div>
          <div>
            <b>{filamentCount}</b>
            <span>Hilos fuertes</span>
          </div>
          <div className="hidden min-[1100px]:block">
            <b>{careerCount}</b>
            <span>Carreras</span>
          </div>
        </div>
        <Toolbar aria-label="Controles del proyector" className="bar-actions">
          <Chip variant="tertiary" className={`status ${statusClass}`}>
            <i className="pip" aria-hidden="true" />
            <Chip.Label>{statusLabel}</Chip.Label>
          </Chip>
          <ToggleButton variant="ghost" className="bar-toggle" isSelected={!muted} onChange={toggleSound}>
            {muted ? 'Mudo' : 'Sonido'}
          </ToggleButton>
          <ToggleButton variant="ghost" className="bar-toggle" isSelected={showFeed} onChange={setShowFeed}>
            Actividad
          </ToggleButton>
          <Button variant="ghost" className="bar-btn" onPress={toggleFullscreen}>
            {fullscreen ? 'Ventana' : 'Pantalla'}
          </Button>
        </Toolbar>
      </header>
    </div>
  );
}
