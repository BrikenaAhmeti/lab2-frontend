import { Keyboard, Mic, PhoneCall, Radio } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { env } from '@/config/env';
import Button from '@/ui/atoms/Button';
import Badge from '@/ui/atoms/Badge';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import type { BookingMode } from '../hooks/useAppointments';

interface VoiceBookingPanelProps {
  mode: BookingMode;
  patientId?: string;
  departmentId?: string;
  serviceCatalogId?: string;
  staffProfileId?: string;
  scheduledAt?: string;
  className?: string;
}

type CallStatus = 'idle' | 'connecting' | 'listening' | 'ended' | 'error';

export default function VoiceBookingPanel({
  mode,
  patientId,
  departmentId,
  serviceCatalogId,
  staffProfileId,
  scheduledAt,
  className = '',
}: VoiceBookingPanelProps) {
  const [voiceError, setVoiceError] = useState('');
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const connectionTimer = useRef<number | null>(null);
  const isConfigured = Boolean(env.VAPI_PUBLIC_KEY && env.VAPI_ASSISTANT_ID);
  const selectedContextCount = useMemo(
    () => [patientId, departmentId, serviceCatalogId, staffProfileId, scheduledAt].filter(Boolean).length,
    [departmentId, patientId, scheduledAt, serviceCatalogId, staffProfileId]
  );
  const isCallActive = callStatus === 'connecting' || callStatus === 'listening';
  const statusLabel = {
    idle: 'Ready for a patient appointment call',
    connecting: 'Starting secure call',
    listening: 'Listening for appointment details',
    ended: 'Call ended',
    error: 'Assistant setup needs attention',
  }[callStatus];

  useEffect(() => {
    return () => {
      if (connectionTimer.current) {
        window.clearTimeout(connectionTimer.current);
      }
    };
  }, []);

  const startVoiceBooking = () => {
    if (connectionTimer.current) {
      window.clearTimeout(connectionTimer.current);
    }

    setVoiceError('');
    setCallStatus('connecting');

    const detail = {
      mode,
      patientId: patientId || null,
      departmentId: departmentId || null,
      serviceCatalogId: serviceCatalogId || null,
      staffProfileId: staffProfileId || null,
      scheduledAt: scheduledAt || null,
      assistantId: env.VAPI_ASSISTANT_ID || null,
    };

    window.dispatchEvent(new CustomEvent('medsphere:vapi-booking-requested', { detail }));

    connectionTimer.current = window.setTimeout(() => {
      if (!isConfigured) {
        setCallStatus('error');
        setVoiceError(
          'MedSphere AI Assistant is prepared, but voice credentials are not connected yet. Add VITE_VAPI_PUBLIC_KEY and VITE_VAPI_ASSISTANT_ID when the assistant is ready.'
        );
        return;
      }

      setCallStatus('error');
      setVoiceError('Voice credentials were found, but the MedSphere AI Assistant call handler is not connected yet.');
    }, 700);
  };

  const endVoiceBooking = () => {
    if (connectionTimer.current) {
      window.clearTimeout(connectionTimer.current);
      connectionTimer.current = null;
    }

    setCallStatus('ended');
    setVoiceError('');
  };

  return (
    <aside className={`panel p-5 ${className}`.trim()} aria-labelledby="voice-booking-title">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Mic className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="voice-booking-title" className="text-base font-semibold text-foreground">
              MedSphere AI Assistant
            </h2>
            <p className="text-sm text-muted">Patient appointment call</p>
          </div>
        </div>
        <Badge variant={isConfigured ? 'success' : 'warning'}>{isConfigured ? 'Ready' : 'Setup'}</Badge>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface/60 p-4">
        <div className="flex h-20 items-center justify-center gap-1.5" aria-hidden="true">
          {[18, 30, 46, 64, 38, 52, 72, 42, 58, 34, 48, 26].map((height, index) => (
            <span
              key={`${height}-${index}`}
              className={`w-1.5 rounded-full bg-primary/70 ${isCallActive ? 'animate-pulse' : ''}`}
              style={{ height, animationDelay: `${index * 70}ms` }}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted">
          <Radio className={`h-4 w-4 ${isCallActive ? 'text-success' : 'text-accent'}`} aria-hidden="true" />
          <span>{statusLabel}</span>
        </div>
        <p className="mt-2 text-center text-xs text-muted">
          {selectedContextCount > 0 ? `${selectedContextCount} appointment details selected` : 'No appointment details selected'}
        </p>
      </div>

      <div className="mt-5 grid gap-2">
        {isCallActive ? (
          <Button
            type="button"
            size="lg"
            variant="danger"
            className="w-full"
            leftIcon={<PhoneCall className="h-4 w-4" aria-hidden="true" />}
            onClick={endVoiceBooking}
          >
            End call
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            className="w-full"
            leftIcon={<PhoneCall className="h-4 w-4" aria-hidden="true" />}
            onClick={startVoiceBooking}
          >
            Start patient call
          </Button>
        )}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted">
          <Keyboard className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>Manual patient booking</span>
        </div>
      </div>

      {voiceError ? (
        <FeedbackMessage
          type="error"
          message={voiceError}
          className="mt-4"
        />
      ) : null}
    </aside>
  );
}
