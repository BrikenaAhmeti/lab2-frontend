import { Keyboard, Mic, PhoneCall, Radio } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { env } from '@/config/env';
import Button from '@/ui/atoms/Button';
import Badge from '@/ui/atoms/Badge';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import type { BookingMode } from '../hooks/useAppointments';
import type Vapi from '@vapi-ai/web';

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
  const vapiRef = useRef<Vapi | null>(null);
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

      const vapi = vapiRef.current;
      if (vapi) {
        vapi.removeAllListeners();
        void vapi.stop().catch(() => undefined);
        vapiRef.current = null;
      }
    };
  }, []);

  const getVapi = async () => {
    if (vapiRef.current) {
      return vapiRef.current;
    }

    const { default: VapiClient } = await import('@vapi-ai/web');
    const vapi = new VapiClient(env.VAPI_PUBLIC_KEY!);

    vapi.on('call-start', () => {
      setCallStatus('listening');
      setVoiceError('');
    });
    vapi.on('call-end', () => {
      setCallStatus('ended');
    });
    vapi.on('error', () => {
      setCallStatus('error');
      setVoiceError('The voice call could not continue. Please try again or use manual booking.');
    });
    vapi.on('call-start-failed', () => {
      setCallStatus('error');
      setVoiceError('The voice call could not start. Please check the assistant setup and browser microphone permission.');
    });

    vapiRef.current = vapi;
    return vapi;
  };

  const startVoiceBooking = async () => {
    if (connectionTimer.current) {
      window.clearTimeout(connectionTimer.current);
      connectionTimer.current = null;
    }

    setVoiceError('');

    if (!isConfigured) {
      setCallStatus('error');
      setVoiceError(
        'MedSphere AI Assistant needs VITE_VAPI_PUBLIC_KEY and VITE_VAPI_ASSISTANT_ID before voice calls can start.'
      );
      return;
    }

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

    try {
      const vapi = await getVapi();
      await vapi.start(env.VAPI_ASSISTANT_ID);
      setCallStatus((current) => (current === 'connecting' ? 'listening' : current));
    } catch {
      setCallStatus('error');
      setVoiceError('The voice call could not start. Please check microphone permission and assistant setup.');
    }
  };

  const endVoiceBooking = () => {
    if (connectionTimer.current) {
      window.clearTimeout(connectionTimer.current);
      connectionTimer.current = null;
    }

    setCallStatus('ended');
    setVoiceError('');
    void vapiRef.current?.stop().catch(() => undefined);
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
