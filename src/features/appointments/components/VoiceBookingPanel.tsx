import { Keyboard, Mic, MicOff, PhoneCall, PhoneOff, Radio, X } from 'lucide-react';
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

const waveformBars = [18, 30, 46, 64, 38, 52, 72, 42, 58, 34, 48, 26];
const wideWaveformBars = [18, 32, 48, 72, 96, 62, 84, 108, 70, 92, 58, 78, 46, 66, 40];

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
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
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
      setIsCallModalOpen(true);
      setVoiceError('');
    });
    vapi.on('call-end', () => {
      setCallStatus('ended');
    });
    vapi.on('error', () => {
      setCallStatus('error');
      setIsCallModalOpen(false);
      setVoiceError('The voice call could not continue. Please try again or use manual booking.');
    });
    vapi.on('call-start-failed', () => {
      setCallStatus('error');
      setIsCallModalOpen(false);
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
    setIsCallModalOpen(true);
    setIsMuted(false);

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
      setIsCallModalOpen(false);
      setVoiceError('The voice call could not start. Please check microphone permission and assistant setup.');
    }
  };

  const endVoiceBooking = () => {
    if (connectionTimer.current) {
      window.clearTimeout(connectionTimer.current);
      connectionTimer.current = null;
    }

    setCallStatus('ended');
    setIsCallModalOpen(false);
    setIsMuted(false);
    setVoiceError('');
    void vapiRef.current?.stop().catch(() => undefined);
  };

  const toggleMute = () => {
    setIsMuted((current) => {
      const nextMuted = !current;
      vapiRef.current?.setMuted(nextMuted);
      return nextMuted;
    });
  };

  const compactAction = isCallActive ? (
    <div className="grid gap-2">
      <Button
        type="button"
        size="lg"
        variant="secondary"
        className="w-full"
        leftIcon={<PhoneCall className="h-4 w-4" aria-hidden="true" />}
        onClick={() => setIsCallModalOpen(true)}
      >
        Open active call
      </Button>
      <Button
        type="button"
        size="lg"
        variant="danger"
        className="w-full"
        leftIcon={<PhoneOff className="h-4 w-4" aria-hidden="true" />}
        onClick={endVoiceBooking}
      >
        End call
      </Button>
    </div>
  ) : (
    <Button
      type="button"
      size="lg"
      className="w-full"
      leftIcon={<PhoneCall className="h-4 w-4" aria-hidden="true" />}
      onClick={startVoiceBooking}
    >
      {callStatus === 'ended' ? 'Start another call' : 'Start patient call'}
    </Button>
  );

  return (
    <>
      <aside className={`panel p-5 ${className}`.trim()} aria-labelledby="voice-booking-title">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
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

        <div className="mt-5 rounded-lg border border-border bg-surface/60 p-4">
          <div className="flex h-20 items-center justify-center gap-1.5" aria-hidden="true">
            {waveformBars.map((height, index) => (
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
          {compactAction}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted">
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

      {isCallModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 px-4 py-6 backdrop-blur-sm"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="voice-call-dialog-title"
            className="max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-y-auto rounded-lg border border-white/10 bg-[#07182f] text-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">AI voice booking</p>
                <h3 id="voice-call-dialog-title" className="mt-1 text-lg font-semibold">
                  MedSphere patient call
                </h3>
              </div>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-white/10 text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-200/50"
                aria-label="Close call modal"
                title="Close call modal"
                onClick={() => setIsCallModalOpen(false)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_17rem]">
              <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <Badge
                    variant={isCallActive ? 'success' : callStatus === 'error' ? 'danger' : 'neutral'}
                    className="border-white/20 bg-white/10 text-white"
                  >
                    {statusLabel}
                  </Badge>
                  <span className="text-xs text-cyan-100/80">
                    {selectedContextCount > 0 ? `${selectedContextCount} booking details linked` : 'Fresh booking call'}
                  </span>
                </div>

                <div className="mt-8 flex flex-col items-center text-center">
                  <div className="grid h-24 w-24 place-items-center rounded-full border border-cyan-200/30 bg-cyan-200/10 shadow-[0_0_60px_rgba(34,211,238,0.2)]">
                    {isMuted ? (
                      <MicOff className="h-9 w-9 text-cyan-100" aria-hidden="true" />
                    ) : (
                      <Mic className="h-9 w-9 text-cyan-100" aria-hidden="true" />
                    )}
                  </div>
                  <p className="mt-4 text-2xl font-semibold">
                    {callStatus === 'connecting' ? 'Starting call' : callStatus === 'listening' ? 'Conversation in progress' : statusLabel}
                  </p>
                  <p className="mt-2 max-w-md text-sm text-cyan-100/75">
                    The assistant is listening for appointment details and can keep the booking context connected while the patient speaks.
                  </p>
                </div>

                <div className="mt-8 flex h-28 items-center justify-center gap-2" aria-hidden="true">
                  {wideWaveformBars.map((height, index) => (
                    <span
                      key={`${height}-${index}`}
                      className={`w-2 rounded-full bg-cyan-200 ${isCallActive ? 'animate-pulse' : 'opacity-55'}`}
                      style={{ height, animationDelay: `${index * 55}ms` }}
                    />
                  ))}
                </div>

                <div className="mt-7 grid gap-2 sm:grid-cols-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="border-white/15 bg-white/10 text-white hover:bg-white/15"
                    leftIcon={isMuted ? <Mic className="h-4 w-4" aria-hidden="true" /> : <MicOff className="h-4 w-4" aria-hidden="true" />}
                    onClick={toggleMute}
                  >
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="border-white/15 bg-white/10 text-white hover:bg-white/15"
                    leftIcon={<Keyboard className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => setIsCallModalOpen(false)}
                  >
                    Keyboard
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    leftIcon={<PhoneOff className="h-4 w-4" aria-hidden="true" />}
                    onClick={endVoiceBooking}
                  >
                    End call
                  </Button>
                </div>
              </div>

              <aside className="rounded-lg border border-white/10 bg-white/5 p-4">
                <h4 className="text-sm font-semibold">Live booking context</h4>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <dt className="text-cyan-100/70">Patient</dt>
                    <dd className="font-medium">{patientId ? 'Selected' : 'During call'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <dt className="text-cyan-100/70">Service</dt>
                    <dd className="font-medium">{serviceCatalogId ? 'Selected' : 'Open'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <dt className="text-cyan-100/70">Doctor</dt>
                    <dd className="font-medium">{staffProfileId ? 'Selected' : 'Open'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-cyan-100/70">Time</dt>
                    <dd className="font-medium">{scheduledAt ? 'Selected' : 'Open'}</dd>
                  </div>
                </dl>

                <div className="mt-5 rounded-lg border border-cyan-200/20 bg-cyan-200/10 p-3 text-sm text-cyan-50">
                  <p className="font-medium">Assistant prompt</p>
                  <p className="mt-1 text-cyan-100/75">
                    I am ready to help find a doctor, check a free slot, and collect the details needed to book.
                  </p>
                </div>
              </aside>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
