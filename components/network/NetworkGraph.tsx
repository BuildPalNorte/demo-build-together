'use client';

import React, { useRef, useEffect, useLayoutEffect, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { DISCIPLINE_SHORT, FILAMENT_SCORE } from '@/lib/events/constants';
import { ParticipantData, ConnectionData } from '@/hooks/use-network-realtime';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button, CloseButton, ListBox, ScrollShadow, Select, Separator, Surface } from '@heroui/react';
import type { Key } from '@heroui/react';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

type Hue = { core: string; glow: string };

const HUES: Record<string, Hue> = {
  'Sistemas Computacionales': { core: '#0e171c', glow: '112, 176, 204' },
  Industrial: { core: '#1a130c', glow: '214, 156, 92' },
  Mecatrónica: { core: '#171120', glow: '168, 128, 214' },
  Electrónica: { core: '#1a170c', glow: '214, 194, 108' },
  Civil: { core: '#0e141f', glow: '110, 150, 214' },
  Ambiental: { core: '#0d1a13', glow: '104, 192, 140' },
  Química: { core: '#1e1016', glow: '214, 118, 148' },
  'Administración / Negocios': { core: '#1a120e', glow: '214, 144, 118' },
  Otra: { core: '#141416', glow: '170, 170, 180' },
};

function hueFor(discipline: string) {
  return HUES[discipline] ?? HUES.Otra;
}

function readTheme() {
  const style = getComputedStyle(document.documentElement);
  const pick = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    field: pick('--field', '#07070c'),
    label: pick('--paper', '#f5f5f7'),
  };
}

interface GraphNode {
  id: string;
  name: string;
  first: string;
  discipline: string;
  shortDiscipline: string;
  skills: string[];
  interests: string[];
  goal: string;
  createdAt: number;
  initials: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphLink {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  score: number;
  reason: string;
  createdAt: string;
}

export interface NetworkGraphProps {
  participants: ParticipantData[];
  connections: ConnectionData[];
  highlightParticipantId?: string | null;
  focusedParticipantId?: string | null;
  onSelectParticipant?: (participant: ParticipantData | null) => void;
  className?: string;
  isStageMode?: boolean;
  emptyCopy?: string | null;
  padTop?: number;
  padRight?: number;
  padBottom?: number;
  padLeft?: number;
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function linkEnds(link: GraphLink) {
  const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
  const targetId = typeof link.target === 'object' ? link.target.id : link.target;
  return { sourceId, targetId };
}

function curvatureOf(id: string, score: number) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i) * (i + 1)) % 997;
  const sign = hash % 2 === 0 ? 1 : -1;
  return sign * (score >= FILAMENT_SCORE ? 0.08 : 0.2);
}

function threadControl(start: { x: number; y: number }, end: { x: number; y: number }, id: string, score: number) {
  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const bend = curvatureOf(id, score) * Math.min(len, 36);
  return { cx: mx + (-dy / len) * bend, cy: my + (dx / len) * bend };
}

/** Each person keeps their two best threads. Matches of 16+ are always drawn. */
export function threadsToDraw(connections: ConnectionData[]) {
  const byNode = new Map<string, ConnectionData[]>();
  for (const link of connections) {
    for (const id of [link.sourceId, link.targetId]) {
      const list = byNode.get(id) ?? [];
      list.push(link);
      byNode.set(id, list);
    }
  }
  const keep = new Map<string, ConnectionData>();
  for (const link of connections) {
    if (link.score >= FILAMENT_SCORE) keep.set(link.id, link);
  }
  for (const list of byNode.values()) {
    list.sort((a, b) => b.score - a.score);
    for (const link of list.slice(0, 2)) keep.set(link.id, link);
  }
  return [...keep.values()];
}

function makeCenter(strength: number) {
  let nodes: GraphNode[] = [];
  const force = (alpha: number) => {
    for (const node of nodes) {
      node.vx = (node.vx ?? 0) - (node.x ?? 0) * strength * alpha;
      node.vy = (node.vy ?? 0) - (node.y ?? 0) * strength * alpha;
    }
  };
  force.initialize = (next: GraphNode[]) => {
    nodes = next;
  };
  return force;
}

function makeCollide(radius: number) {
  let nodes: GraphNode[] = [];
  const force = (alpha: number) => {
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = (b.x ?? 0) - (a.x ?? 0);
        let dy = (b.y ?? 0) - (a.y ?? 0);
        const dist = Math.hypot(dx, dy) || 0.01;
        const min = radius * 2;
        if (dist >= min) continue;
        const push = ((min - dist) / dist) * alpha;
        dx *= push;
        dy *= push;
        a.x = (a.x ?? 0) - dx;
        a.y = (a.y ?? 0) - dy;
        b.x = (b.x ?? 0) + dx;
        b.y = (b.y ?? 0) + dy;
      }
    }
  };
  force.initialize = (next: GraphNode[]) => {
    nodes = next;
  };
  return force;
}

export function NetworkGraph({
  participants,
  connections,
  highlightParticipantId,
  focusedParticipantId,
  onSelectParticipant,
  className = '',
  isStageMode = false,
  emptyCopy,
  padTop,
  padRight,
  padBottom,
  padLeft,
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const nodeByIdRef = useRef(new Map<string, GraphNode>());
  const linkByIdRef = useRef(new Map<string, GraphLink>());
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({
    nodes: [],
    links: [],
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);
  const [pinnedLinkId, setPinnedLinkId] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [fieldColor, setFieldColor] = useState('#07070c');
  const contrastRef = useRef(false);
  const themeRef = useRef({ field: '#07070c', label: '#f5f5f7' });

  const drawn = useMemo(() => {
    const quiet = threadsToDraw(connections);
    if (!selectedNodeId) return quiet;
    const keep = new Map(quiet.map((link) => [link.id, link]));
    for (const link of connections) {
      if (link.sourceId === selectedNodeId || link.targetId === selectedNodeId) keep.set(link.id, link);
    }
    return [...keep.values()];
  }, [connections, selectedNodeId]);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrast = window.matchMedia('(prefers-contrast: more)');
    const scheme = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      setReduceMotion(motion.matches);
      contrastRef.current = contrast.matches;
      const next = readTheme();
      themeRef.current = next;
      setFieldColor(next.field);
    };
    apply();
    motion.addEventListener('change', apply);
    contrast.addEventListener('change', apply);
    scheme.addEventListener('change', apply);
    return () => {
      motion.removeEventListener('change', apply);
      contrast.removeEventListener('change', apply);
      scheme.removeEventListener('change', apply);
    };
  }, []);

  useEffect(() => {
    if (focusedParticipantId) setSelectedNodeId(focusedParticipantId);
  }, [focusedParticipantId]);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const nodeById = nodeByIdRef.current;
    const linkById = linkByIdRef.current;
    const nodes = nodesRef.current;
    const links = linksRef.current;
    let structural = false;

    const nextIds = new Set(participants.map((person) => person.id));
    for (let i = nodes.length - 1; i >= 0; i -= 1) {
      if (nextIds.has(nodes[i].id)) continue;
      nodeById.delete(nodes[i].id);
      nodes.splice(i, 1);
      structural = true;
    }

    for (const person of participants) {
      const existing = nodeById.get(person.id);
      const first = firstName(person.displayName);
      const shortDiscipline = DISCIPLINE_SHORT[person.discipline] || person.discipline;
      if (existing) {
        existing.name = person.displayName;
        existing.first = first;
        existing.discipline = person.discipline;
        existing.shortDiscipline = shortDiscipline;
        existing.skills = person.skills;
        existing.interests = person.interests;
        existing.goal = person.goal;
        existing.createdAt = new Date(person.createdAt).getTime();
        existing.initials = initialsOf(person.displayName);
        continue;
      }
      const index = nodes.length;
      const angle = index * 2.399963;
      const ring = 26 * Math.sqrt(index + 1);
      const node: GraphNode = {
        id: person.id,
        name: person.displayName,
        first,
        discipline: person.discipline,
        shortDiscipline,
        skills: person.skills,
        interests: person.interests,
        goal: person.goal,
        createdAt: new Date(person.createdAt).getTime(),
        initials: initialsOf(person.displayName),
        x: Math.cos(angle) * ring,
        y: Math.sin(angle) * ring,
      };
      nodeById.set(person.id, node);
      nodes.push(node);
      structural = true;
    }

    const drawnIds = new Set(drawn.map((link) => link.id));
    for (let i = links.length - 1; i >= 0; i -= 1) {
      if (drawnIds.has(links[i].id)) continue;
      linkById.delete(links[i].id);
      links.splice(i, 1);
      structural = true;
    }

    for (const connection of drawn) {
      const existing = linkById.get(connection.id);
      if (existing) {
        existing.score = connection.score;
        existing.reason = connection.reason;
        existing.createdAt = connection.createdAt;
        continue;
      }
      const source = nodeById.get(connection.sourceId);
      const target = nodeById.get(connection.targetId);
      if (!source || !target) continue;
      const link: GraphLink = {
        id: connection.id,
        source,
        target,
        score: connection.score,
        reason: connection.reason,
        createdAt: connection.createdAt,
      };
      linkById.set(connection.id, link);
      links.push(link);
      structural = true;
    }

    if (!structural && graphData.nodes === nodes) return;
    setGraphData({ nodes, links });
  }, [participants, drawn, graphData.nodes]);

  useEffect(() => {
    let frame = 0;
    let raf = 0;
    const tune = () => {
      const fg = fgRef.current;
      if (!fg) {
        if (frame < 50) {
          frame += 1;
          raf = requestAnimationFrame(tune);
        }
        return;
      }
      fg.d3Force('charge')?.strength(isStageMode ? -90 : -72);
      const linkForce = fg.d3Force('link');
      linkForce?.distance((link: GraphLink) => (link.score >= FILAMENT_SCORE ? 72 : 110));
      linkForce?.strength((link: GraphLink) => (link.score >= FILAMENT_SCORE ? 0.4 : 0.14));
      fg.d3Force('collide', makeCollide(isStageMode ? 34 : 30));
      fg.d3Force('center', makeCenter(0.12));
      fg.d3ReheatSimulation?.();
    };
    tune();
    return () => cancelAnimationFrame(raf);
  }, [isStageMode, graphData]);

  const activeFocusId = selectedNodeId || hoveredNodeId;
  const connectedNodeIds = useMemo(() => {
    const set = new Set<string>();
    if (!activeFocusId) return set;
    set.add(activeFocusId);
    for (const link of drawn) {
      if (link.sourceId === activeFocusId) set.add(link.targetId);
      if (link.targetId === activeFocusId) set.add(link.sourceId);
    }
    return set;
  }, [activeFocusId, drawn]);

  const showAllLabels = participants.length <= 16;

  const paintNode = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isYou = highlightParticipantId === node.id;
      const isSelected = selectedNodeId === node.id;
      const isHovered = hoveredNodeId === node.id;
      const isConnected = !activeFocusId || connectedNodeIds.has(node.id);
      const dimmed = Boolean(activeFocusId) && !isConnected;
      const hue = hueFor(node.discipline);
      const radius = (isStageMode ? 16 : 14) + (isYou ? 1 : 0);
      if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) {
        node.x = 0;
        node.y = 0;
        node.vx = 0;
        node.vy = 0;
        return;
      }
      const x = node.x as number;
      const y = node.y as number;
      const contrast = contrastRef.current;

      ctx.save();
      ctx.globalAlpha = dimmed ? 0.28 : 1;

      if (!dimmed) {
        const glowR = radius * (contrast ? 1.3 : 1.8);
        const halo = ctx.createRadialGradient(x, y, radius * 0.9, x, y, glowR);
        halo.addColorStop(0, `rgba(${hue.glow}, ${isYou ? 0.2 : 0.12})`);
        halo.addColorStop(1, `rgba(${hue.glow}, 0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Deep body: the center stays dark.
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = hue.core;
      ctx.fill();

      // Light bleeds in from the rim and fades toward the center.
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.clip();
      const rim = ctx.createRadialGradient(x, y, radius * 0.38, x, y, radius);
      rim.addColorStop(0, `rgba(${hue.glow}, 0)`);
      rim.addColorStop(0.62, `rgba(${hue.glow}, ${dimmed ? 0.1 : 0.22})`);
      rim.addColorStop(1, `rgba(${hue.glow}, ${contrast ? 1 : 0.92})`);
      ctx.fillStyle = rim;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(x, y, radius - 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${hue.glow}, 0.55)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      if (!dimmed && (isYou || isSelected || isHovered)) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 3.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(245,245,247,0.55)';
        ctx.lineWidth = 1 / Math.max(globalScale, 0.4);
        ctx.stroke();
      }

      ctx.fillStyle = '#f5f5f7';
      ctx.font = `600 ${Math.max(11, radius * 0.5)}px -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.initials, x, y + 0.5);

      const showLabel =
        !dimmed && (isStageMode || isYou || isSelected || isHovered || Boolean(selectedNodeId) || (showAllLabels && globalScale > 0.55));
      if (showLabel) {
        const size = (isStageMode ? 15 : 13) / globalScale;
        ctx.font = `500 ${size}px -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillStyle = themeRef.current.label;
        ctx.fillText(node.first, x, y + radius + 7 / globalScale);
      }

      ctx.restore();
    },
    [highlightParticipantId, selectedNodeId, hoveredNodeId, activeFocusId, connectedNodeIds, isStageMode, showAllLabels]
  );

  const paintLink = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const start = link.source;
      const end = link.target;
      if (!start || !end || !Number.isFinite(start.x) || !Number.isFinite(start.y) || !Number.isFinite(end.x) || !Number.isFinite(end.y)) return;
      const { sourceId, targetId } = linkEnds(link);
      const hot = link.score >= FILAMENT_SCORE;
      const focused =
        activeFocusId != null && (sourceId === activeFocusId || targetId === activeFocusId);
      const dimmed = activeFocusId != null && !focused;

      const { cx, cy } = threadControl(start, end, String(link.id ?? ''), link.score);
      const contrast = contrastRef.current;
      const activeLinkId = hoveredLinkId ?? pinnedLinkId;
      const reading = activeLinkId != null && String(link.id) === activeLinkId;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.quadraticCurveTo(cx, cy, end.x, end.y);
      ctx.lineCap = 'round';
      ctx.lineWidth = (hot || focused || reading ? 1.35 : 1) / globalScale;
      if (dimmed && !reading) ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      else if (hot || focused || reading) ctx.strokeStyle = contrast ? 'rgba(255,255,255,0.92)' : 'rgba(244,240,230,0.72)';
      else ctx.strokeStyle = contrast ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.16)';
      ctx.stroke();
      ctx.restore();
    },
    [activeFocusId, hoveredLinkId, pinnedLinkId]
  );

  const paintLinkPointer = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (link: any, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const start = link.source;
      const end = link.target;
      if (!start || !end || !Number.isFinite(start.x) || !Number.isFinite(start.y) || !Number.isFinite(end.x) || !Number.isFinite(end.y)) return;
      const { cx, cy } = threadControl(start, end, String(link.id ?? ''), link.score);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.quadraticCurveTo(cx, cy, end.x, end.y);
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      ctx.lineWidth = 16 / Math.max(globalScale, 0.45);
      ctx.stroke();
    },
    []
  );

  const fitRoom = useCallback(
    (duration = 650, options?: { ignoreSelection?: boolean }) => {
      const fg = fgRef.current;
      const box = containerRef.current;
      const nodes = nodesRef.current;
      if (!fg || !box || nodes.length === 0) return;
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const node of nodes) {
        if (node.x == null || node.y == null || Number.isNaN(node.x) || Number.isNaN(node.y)) continue;
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x);
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y);
      }
      if (!Number.isFinite(minX)) return;
      const reach = 46;
      minX -= reach;
      maxX += reach;
      minY -= reach;
      maxY += reach;
      const narrow = box.clientWidth < 720;
      const dossier =
        selectedNodeId && !options?.ignoreSelection ? Math.min(isStageMode ? 380 : 360, box.clientWidth * 0.46) : 0;
      const top = padTop ?? (isStageMode ? 108 : narrow ? 180 : 150);
      const bottom = padBottom ?? (narrow ? 120 : 88);
      const left = padLeft ?? 36;
      const right = Math.max(padRight ?? 36, dossier);
      const width = Math.max(box.clientWidth - left - right, 80);
      const height = Math.max(box.clientHeight - top - bottom, 80);
      const spanX = Math.max(maxX - minX, 80);
      const spanY = Math.max(maxY - minY, 80);
      const zoom = Math.max(0.08, Math.min(1.6, Math.min(width / spanX, height / spanY)));
      const shiftX = (left - right) / 2 / zoom;
      const shiftY = (top - bottom) / 2 / zoom;
      fg.centerAt((minX + maxX) / 2 - shiftX, (minY + maxY) / 2 - shiftY, duration);
      fg.zoom(zoom, duration);
    },
    [isStageMode, padTop, padRight, padBottom, padLeft, selectedNodeId]
  );

  const selectedIdRef = useRef(selectedNodeId);
  selectedIdRef.current = selectedNodeId;

  useEffect(() => {
    if (participants.length === 0) return;
    const id = window.setInterval(() => {
      if (!selectedIdRef.current) fitRoom(0);
    }, 500);
    const stop = window.setTimeout(() => {
      window.clearInterval(id);
      if (!selectedIdRef.current) fitRoom(reduceMotion ? 0 : 500);
    }, 4800);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(stop);
    };
  }, [participants.length, fitRoom, reduceMotion]);

  const openNode = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any) => {
      if (!node?.id) {
        selectedIdRef.current = null;
        setSelectedNodeId(null);
        onSelectParticipant?.(null);
        fitRoom(reduceMotion ? 0 : 480, { ignoreSelection: true });
        return;
      }
      selectedIdRef.current = node.id;
      setSelectedNodeId(node.id);
      onSelectParticipant?.(participants.find((person) => person.id === node.id) ?? null);
      const fg = fgRef.current;
      if (fg && Number.isFinite(node.x) && Number.isFinite(node.y)) {
        const box = containerRef.current;
        const duration = reduceMotion ? 0 : 480;
        const panel = box ? Math.min(isStageMode ? 380 : 320, box.clientWidth * 0.46) : 0;
        const zoom = Math.min(1.35, Math.max(fg.zoom?.() ?? 1, isStageMode ? 0.95 : 0.8));
        const shift = panel / 2 / zoom;
        fg.centerAt(node.x + shift, node.y, duration);
        fg.zoom(zoom, duration);
      }
    },
    [participants, onSelectParticipant, reduceMotion, isStageMode, fitRoom]
  );

  useEffect(() => {
    if (!selectedNodeId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') openNode(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedNodeId, openNode]);

  const shownLinkId = hoveredLinkId ?? pinnedLinkId;
  const hoveredThread = useMemo(() => {
    if (!shownLinkId) return null;
    const link = connections.find((item) => item.id === shownLinkId);
    if (!link) return null;
    const source = participants.find((person) => person.id === link.sourceId);
    const target = participants.find((person) => person.id === link.targetId);
    if (!source || !target) return null;
    return { link, source, target };
  }, [shownLinkId, connections, participants]);

  useEffect(() => {
    if (pinnedLinkId && !drawn.some((link) => link.id === pinnedLinkId)) setPinnedLinkId(null);
  }, [drawn, pinnedLinkId]);

  const selected = participants.find((person) => person.id === selectedNodeId) ?? null;
  const selectedLinks = useMemo(() => {
    if (!selectedNodeId) return [];
    return connections
      .filter((link) => link.sourceId === selectedNodeId || link.targetId === selectedNodeId)
      .map((link) => {
        const otherId = link.sourceId === selectedNodeId ? link.targetId : link.sourceId;
        return { link, other: participants.find((person) => person.id === otherId) };
      })
      .filter((item) => item.other)
      .sort((a, b) => b.link.score - a.link.score);
  }, [selectedNodeId, connections, participants]);

  const peopleByName = useMemo(
    () => [...participants].sort((a, b) => a.displayName.localeCompare(b.displayName, 'es')),
    [participants]
  );

  const summary =
    participants.length === 0
      ? 'La red abre cuando entra la primera persona.'
      : `${participants.length} personas. ${drawn.length} hilos dibujados. ${
          connections.filter((link) => link.score >= FILAMENT_SCORE).length
        } hilos de ${FILAMENT_SCORE} puntos o más.`;

  const paintField = useCallback((ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas;
    const width = canvas.clientWidth || dimensions.width;
    const height = canvas.clientHeight || dimensions.height;
    if (!width || !height) return;
    const dpr = canvas.width / width || 1;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const theme = themeRef.current;
    ctx.globalAlpha = 1;
    ctx.fillStyle = theme.field;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }, [dimensions.width, dimensions.height]);

  return (
    <div ref={containerRef} className={`plot ${participants.length > 0 ? 'is-live' : 'is-waiting'} ${className}`}>
      <div className="aurora" aria-hidden="true" />
      <div className="plot-dots" aria-hidden="true" />
      <p className="sr-only">{summary}</p>

      {dimensions.width > 0 && dimensions.height > 0 && participants.length > 0 && (
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          backgroundColor={fieldColor}
          onRenderFramePre={paintField}
          nodeCanvasObject={paintNode}
          nodeCanvasObjectMode={() => 'replace'}
          nodePointerAreaPaint={(node: { x?: number; y?: number }, color: string, ctx: CanvasRenderingContext2D) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x ?? 0, node.y ?? 0, 28, 0, Math.PI * 2);
            ctx.fill();
          }}
          linkCanvasObject={paintLink}
          linkCanvasObjectMode={() => 'replace'}
          linkPointerAreaPaint={paintLinkPointer}
          linkHoverPrecision={8}
          onNodeClick={openNode}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onNodeHover={(node: any) => setHoveredNodeId(node ? node.id : null)}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onLinkHover={(link: any) => setHoveredLinkId(link?.id ? String(link.id) : null)}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onLinkClick={(link: any) => {
            const id = link?.id ? String(link.id) : null;
            if (!id) return;
            setPinnedLinkId((current) => (current === id ? null : id));
          }}
          onBackgroundClick={() => {
            openNode(null);
            setPinnedLinkId(null);
          }}
          onEngineStop={() => {
            if (selectedIdRef.current) return;
            fitRoom(reduceMotion ? 0 : 600);
          }}
          cooldownTicks={260}
          d3AlphaDecay={0.018}
          d3VelocityDecay={0.32}
          enableNodeDrag
          minZoom={0.08}
          maxZoom={5}
        />
      )}

      {participants.length === 0 && emptyCopy !== null && (
        <p className="empty-room">{emptyCopy ?? 'La red abre cuando entra la primera persona.'}</p>
      )}

      <div className="legend">
        <span className="swatch-person">
          <i />
          Persona
        </span>
        <span className="swatch-thread">
          <i />
          {FILAMENT_SCORE} puntos o más
        </span>
      </div>

      {!isStageMode && participants.length > 0 && !selected && (
        <Select
          className="person-jump"
          aria-label="Ir a una persona"
          placeholder="Ir a una persona"
          variant="secondary"
          value={null}
          onChange={(key: Key | Key[] | null) => {
            const id = Array.isArray(key) ? key[0] : key;
            const node = id == null ? null : nodeByIdRef.current.get(String(id));
            if (node) openNode(node);
          }}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {peopleByName.map((person) => (
                <ListBox.Item key={person.id} id={person.id} textValue={person.displayName}>
                  {person.displayName}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      )}

      <div className="zoom-bar">
        <Button isIconOnly variant="ghost" aria-label="Acercar" onPress={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.3, 240)}>
          <ZoomIn size={18} />
        </Button>
        <Button isIconOnly variant="ghost" aria-label="Alejar" onPress={() => fgRef.current?.zoom(fgRef.current.zoom() / 1.3, 240)}>
          <ZoomOut size={18} />
        </Button>
        <Button isIconOnly variant="ghost" aria-label="Ver el salón completo" onPress={() => fitRoom(500)}>
          <Maximize2 size={16} />
        </Button>
      </div>

      {selected && (
        <Surface variant="default" className="dossier" aria-label={`Ficha de ${selected.displayName}`}>
          <ScrollShadow hideScrollBar className="dossier-scroll">
          <h3>{selected.displayName}</h3>
          <p className="mt-1 text-[14px] text-[var(--mist)]">{selected.discipline}</p>
          {selected.interests.length > 0 && (
            <p className="mt-3 text-[14px] leading-snug">{selected.interests.join(' · ')}</p>
          )}
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--mist)]">{selected.skills.join(' · ')}</p>
          <div className="quiet-list">
            <p className="text-[13px] text-[var(--faint)]">
              {selectedLinks.length === 0 ? 'Todavía sin coincidencias' : `${selectedLinks.length} coincidencias`}
            </p>
            <ul className="mt-2">
              {selectedLinks.map(({ link, other }, index) => (
                <li key={link.id}>
                  {index > 0 && <Separator className="match-rule" />}
                  <Button
                    variant="ghost"
                    fullWidth
                    className="match-row"
                    onPress={() => other && openNode(nodeByIdRef.current.get(other.id))}
                    onHoverStart={() => setHoveredLinkId(link.id)}
                    onHoverEnd={() => setHoveredLinkId(null)}
                  >
                    <span className="flex w-full items-baseline justify-between gap-3">
                      <span className="text-[14px]">{other?.displayName}</span>
                      <span className={`score ${link.score >= FILAMENT_SCORE ? 'hot' : ''}`}>{link.score}</span>
                    </span>
                    <span className="mt-0.5 block w-full text-[13px] leading-snug text-[var(--mist)]">{link.reason}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
          </ScrollShadow>
          <CloseButton className="dossier-close" aria-label="Cerrar ficha" onPress={() => openNode(null)} />
        </Surface>
      )}

      {hoveredThread && (
        <Surface variant="default" className="thread-note" aria-live="polite">
          <p className="thread-who">
            <span>
              {hoveredThread.source.displayName} y {hoveredThread.target.displayName}
            </span>
            <span className={`score ${hoveredThread.link.score >= FILAMENT_SCORE ? 'hot' : ''}`}>{hoveredThread.link.score}</span>
          </p>
          <p className="thread-why">{hoveredThread.link.reason}</p>
        </Surface>
      )}

    </div>
  );
}
