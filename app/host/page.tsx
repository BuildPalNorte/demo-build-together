'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Alert, Button, Card, Chip, Input, Modal, TextField, buttonVariants } from '@heroui/react';
import { useNetworkRealtime } from '@/hooks/use-network-realtime';
import { Mark } from '@/components/brand/Mark';

export default function HostDashboardPage() {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { stats, status, isLoading, refreshNow } = useNetworkRealtime({
    eventSlug: 'tec-matamoros-2026',
    pollIntervalMs: 2000,
  });

  useEffect(() => {
    const saved = localStorage.getItem('bt_host_passcode');
    if (saved) {
      setPasscode(saved);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (!passcode.trim()) return;
    setIsAuthenticated(true);
    localStorage.setItem('bt_host_passcode', passcode.trim());
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const handleResetEvent = async () => {
    setIsResetting(true);
    setResetMessage(null);
    try {
      const res = await fetch('/api/host/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${passcode}`,
        },
        body: JSON.stringify({ slug: 'tec-matamoros-2026', passcode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo vaciar la red.');
      setResetMessage(
        `Listo. Salieron ${data.deletedParticipants} personas y ${data.deletedConnections} coincidencias.`
      );
      setShowConfirmModal(false);
      refreshNow();
    } catch (err: unknown) {
      setResetMessage(err instanceof Error ? err.message : 'No se pudo vaciar la red.');
    } finally {
      setIsResetting(false);
    }
  };

  const figure = (value: number) => (isLoading ? '—' : value);
  const statusLabel =
    status === 'live' ? 'En vivo' : status === 'reconnecting' || status === 'error' ? 'Reconectando' : 'Sincronizando';

  return (
    <div className="host-page">
      <div className="host-wrap">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <Mark className="h-10 w-10 shrink-0" />
            <div>
              <h1 className="host-title">Taller</h1>
              <Chip
                variant="tertiary"
                className={`mt-2 h-auto gap-2 bg-transparent px-0 text-[17px] font-medium text-[var(--mist)] ${status === 'reconnecting' || status === 'error' ? 'is-bad' : ''}`}
              >
                <i className="pip" aria-hidden="true" />
                <Chip.Label>Tec de Matamoros · {statusLabel}</Chip.Label>
              </Chip>
            </div>
          </div>
          <Link href="/stage" target="_blank" className={buttonVariants({ variant: 'primary' })}>
            Abrir proyector
          </Link>
        </header>

        {!isAuthenticated ? (
          <Card className="host-card">
            <form onSubmit={handleLogin}>
              <Card.Header>
                <Card.Title>Código de anfitrión</Card.Title>
                <Card.Description>El mismo que está en las variables del taller.</Card.Description>
              </Card.Header>
              <Card.Content className="mt-4 gap-3">
                <TextField
                  aria-label="Código de anfitrión"
                  type="password"
                  isRequired
                  fullWidth
                  value={passcode}
                  onChange={setPasscode}
                >
                  <Input placeholder="Código" />
                </TextField>
                <Button type="submit" fullWidth>
                  Entrar
                </Button>
              </Card.Content>
            </form>
          </Card>
        ) : (
          <div>
            <div className="figures">
              <div>
                <b>{figure(stats.totalBuilders)}</b>
                <span>Personas</span>
              </div>
              <div>
                <b>{figure(stats.totalConnections)}</b>
                <span>Coincidencias</span>
              </div>
              <div>
                <b>{figure(stats.disciplinesCount)}</b>
                <span>Carreras</span>
              </div>
            </div>

            <Card className="host-card">
              <Card.Header>
                <Card.Title>Enlaces</Card.Title>
              </Card.Header>
              <Card.Footer className="mt-4 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <Button onPress={handleCopyLink}>{copied ? 'Enlace copiado' : 'Copiar enlace de estudiantes'}</Button>
                <Link href="/" target="_blank" className={buttonVariants({ variant: 'ghost', className: 'bar-btn' })}>
                  Ver el registro
                </Link>
              </Card.Footer>
            </Card>

            <Card className="host-card">
              <Card.Header>
                <Card.Title>Vaciar la red</Card.Title>
                <Card.Description className="max-w-xl">
                  Quita a las personas y las coincidencias de tec-matamoros-2026. El siguiente grupo vuelve a escanear el código.
                </Card.Description>
              </Card.Header>
              <Card.Content className="mt-3 gap-3">
                {resetMessage && (
                  <Alert>
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title className="text-[17px]">{resetMessage}</Alert.Title>
                    </Alert.Content>
                  </Alert>
                )}
                <Button variant="ghost" className="danger-text" onPress={() => setShowConfirmModal(true)}>
                  Vaciar la red del taller
                </Button>
              </Card.Content>
            </Card>
          </div>
        )}
      </div>

      <Modal.Backdrop
        isOpen={showConfirmModal}
        onOpenChange={(open) => {
          if (!isResetting) setShowConfirmModal(open);
        }}
        isDismissable={!isResetting}
        isKeyboardDismissDisabled={isResetting}
        variant="opaque"
      >
        <Modal.Container placement="center" className="bt-sheet-wrap">
          <Modal.Dialog className="bt-sheet bt-confirm" aria-labelledby="vaciar-titulo">
            <Modal.Header>
              <Modal.Heading id="vaciar-titulo">¿Vaciar la red?</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p>Se borran los gafetes y las coincidencias de esta sesión. No se puede deshacer.</p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" className="danger-text" onPress={handleResetEvent} isDisabled={isResetting}>
                {isResetting ? 'Vaciando' : 'Sí, vaciar'}
              </Button>
              <Button onPress={() => setShowConfirmModal(false)} isDisabled={isResetting}>
                Cancelar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
