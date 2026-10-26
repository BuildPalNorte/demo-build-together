'use client';

import React, { useMemo } from 'react';
import { Surface } from '@heroui/react';
import { ParticipantData, ConnectionData } from '@/hooks/use-network-realtime';
import { FILAMENT_SCORE } from '@/lib/events/constants';

export function ActivityFeed({
  participants,
  connections,
}: {
  participants: ParticipantData[];
  connections: ConnectionData[];
}) {
  const rows = useMemo(() => {
    const names = new Map(participants.map((person) => [person.id, person.displayName]));
    const joins = participants.map((person) => ({
      id: `p-${person.id}`,
      hot: false,
      title: person.displayName,
      detail: person.discipline,
      at: new Date(person.createdAt).getTime(),
    }));
    const threads = connections
      .filter((link) => link.score >= FILAMENT_SCORE)
      .map((link) => ({
        id: `c-${link.id}`,
        hot: true,
        title: `${names.get(link.sourceId) || 'Alguien'} y ${names.get(link.targetId) || 'alguien'}`,
        detail: link.reason,
        at: new Date(link.createdAt).getTime(),
      }));
    return [...joins, ...threads].sort((a, b) => b.at - a.at).slice(0, 5);
  }, [participants, connections]);

  return (
    <Surface variant="default" className="stage-panel" aria-live="polite">
      <h2 className="text-[17px] font-semibold tracking-[-0.02em]">Ahora en el taller</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-[16px] text-[var(--mist)]">Nadie ha entrado.</p>
      ) : (
        <ul className="mt-3">
          {rows.map((row) => (
            <li key={row.id} className="feed-row flex gap-3 py-2.5">
              <span className={`pip mt-1.5 ${row.hot ? 'hot' : 'quiet'}`} aria-hidden="true" />
              <span className="min-w-0">
                <span className="block truncate text-[16px] font-medium">{row.title}</span>
                <span className="mt-0.5 block truncate text-[14px] text-[var(--mist)]">{row.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}
