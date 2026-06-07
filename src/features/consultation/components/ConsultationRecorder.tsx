import { useEffect, useMemo, useRef, useState } from 'react';
import { FileAudio, Mic, Square } from 'lucide-react';
import type { AppointmentView } from '@/lib/api/appointments-api';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import {
  getConsultationErrorMessage,
  useAiConsultation,
  useTranscribeConsultation,
} from '../hooks/useConsultation';

interface ConsultationRecorderProps {
  appointment: AppointmentView;
  disabled?: boolean;
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function bestAudioMimeType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return '';
  }

  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find((type) =>
    MediaRecorder.isTypeSupported(type)
  ) ?? '';
}

export default function ConsultationRecorder({ appointment, disabled }: ConsultationRecorderProps) {
  const conversationQuery = useAiConsultation(appointment.id);
  const transcribeMutation = useTranscribeConsultation();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const objectUrlRef = useRef('');
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [localAudioUrl, setLocalAudioUrl] = useState('');
  const [latestTranscript, setLatestTranscript] = useState('');
  const [error, setError] = useState('');
  const conversation = conversationQuery.data ?? null;
  const transcript = latestTranscript || conversation?.transcription || '';
  const audioUrl = localAudioUrl || conversation?.audioFileUrl || '';
  const canRecord = !disabled && appointment.status === 'IN_PROGRESS';

  useEffect(() => {
    if (!isRecording) return undefined;

    const startedAt = Date.now() - elapsedSeconds * 1000;
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [elapsedSeconds, isRecording]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        window.URL.revokeObjectURL(objectUrlRef.current);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const statusLabel = useMemo(() => {
    if (isRecording) return 'Recording';
    if (transcribeMutation.isPending) return 'Processing';
    if (conversation?.transcription) return 'Transcript saved';
    return 'Ready';
  }, [conversation?.transcription, isRecording, transcribeMutation.isPending]);

  const startRecording = async () => {
    setError('');

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Audio recording is not available in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = bestAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      chunksRef.current = [];
      streamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        void uploadRecording(recorder.mimeType || mimeType || 'audio/webm');
      };

      recorder.start();
      setElapsedSeconds(0);
      setIsRecording(true);
    } catch (recordingError) {
      setError(getConsultationErrorMessage(recordingError, 'Microphone access could not be started'));
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
    setIsRecording(false);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const uploadRecording = async (mimeType: string) => {
    const audioBlob = new Blob(chunksRef.current, { type: mimeType });

    if (audioBlob.size === 0) {
      setError('Recording did not capture any audio.');
      return;
    }

    if (objectUrlRef.current) {
      window.URL.revokeObjectURL(objectUrlRef.current);
    }

    const localUrl = window.URL.createObjectURL(audioBlob);
    objectUrlRef.current = localUrl;
    setLocalAudioUrl(localUrl);
    setLatestTranscript('');

    try {
      const transcription = await transcribeMutation.mutateAsync({
        audio: audioBlob,
        metadata: {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          staffId: appointment.staffProfileId ?? undefined,
          fileName: `consultation-${appointment.id}.${mimeType.includes('mp4') ? 'm4a' : 'webm'}`,
        },
      });

      setLatestTranscript(transcription.text);
    } catch (transcriptionError) {
      setError(getConsultationErrorMessage(transcriptionError, 'Recording could not be transcribed'));
    }
  };

  return (
    <Card
      title="Conversation Recorder"
      subtitle="Appointment audio and transcript"
      actions={<Badge variant={isRecording ? 'danger' : transcribeMutation.isPending ? 'warning' : 'info'}>{statusLabel}</Badge>}
    >
      <div className="space-y-4">
        {error ? <FeedbackMessage type="error" message={error} /> : null}

        <div className="rounded-xl border border-border bg-surface/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{formatElapsed(elapsedSeconds)}</p>
              <p className="mt-1 text-xs text-muted">{audioUrl ? 'Recording available' : 'No recording saved yet'}</p>
            </div>
            {isRecording ? (
              <Button
                type="button"
                variant="danger"
                leftIcon={<Square className="h-4 w-4" aria-hidden="true" />}
                onClick={stopRecording}
              >
                Stop
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                disabled={!canRecord || transcribeMutation.isPending}
                leftIcon={<Mic className="h-4 w-4" aria-hidden="true" />}
                onClick={startRecording}
              >
                Start Recording
              </Button>
            )}
          </div>

          {audioUrl ? (
            <audio className="mt-4 w-full" controls src={audioUrl}>
              <track kind="captions" />
            </audio>
          ) : null}
        </div>

        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-3 flex items-center gap-2">
            <FileAudio className="h-4 w-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-foreground">Conversation transcript</h3>
          </div>
          {conversationQuery.isLoading ? <p className="text-sm text-muted">Loading transcript...</p> : null}
          {!conversationQuery.isLoading && !transcript ? (
            <p className="text-sm text-muted">Record the appointment conversation to generate a transcript.</p>
          ) : null}
          {transcript ? <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{transcript}</p> : null}
        </div>
      </div>
    </Card>
  );
}
