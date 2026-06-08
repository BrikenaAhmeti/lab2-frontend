import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleStop, FileAudio, Mic } from 'lucide-react';
import type { ConsultationConversationTurn } from '@/lib/api/ai-api';
import type { AppointmentView } from '@/lib/api/appointments-api';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import {
  getConsultationErrorMessage,
  useAiConsultation,
  useSummarizeConsultation,
  useTranscribeConsultation,
} from '../hooks/useConsultation';
import { isStubTranscription } from './aiReportFormat';

interface ConsultationRecorderProps {
  appointment: AppointmentView;
  disabled?: boolean;
}

type RecordingProcessingStage = 'idle' | 'saving' | 'transcribing' | 'summarizing';

function speakerLabel(speaker: ConsultationConversationTurn['speaker']) {
  if (speaker === 'doctor') return 'Doctor';
  if (speaker === 'patient') return 'Patient';
  return 'Speaker';
}

function speakerTone(speaker: ConsultationConversationTurn['speaker']) {
  if (speaker === 'doctor') return 'bg-primary/10 text-primary';
  if (speaker === 'patient') return 'bg-emerald-50 text-emerald-700';
  return 'bg-surface text-muted';
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
  const summarizeMutation = useSummarizeConsultation();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const objectUrlRef = useRef('');
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [localAudioUrl, setLocalAudioUrl] = useState('');
  const [latestTranscript, setLatestTranscript] = useState('');
  const [latestConversationTurns, setLatestConversationTurns] = useState<ConsultationConversationTurn[]>([]);
  const [processingStage, setProcessingStage] = useState<RecordingProcessingStage>('idle');
  const [error, setError] = useState('');
  const conversation = conversationQuery.data ?? null;
  const rawTranscript = latestTranscript || conversation?.transcription || '';
  const hasStubTranscript = isStubTranscription(rawTranscript);
  const transcript = hasStubTranscript ? '' : rawTranscript;
  const conversationTurns = hasStubTranscript
    ? []
    : latestConversationTurns.length > 0
      ? latestConversationTurns
      : conversation?.conversationTurns ?? [];
  const audioUrl = localAudioUrl || conversation?.audioFileUrl || '';
  const canRecord = !disabled && appointment.status === 'IN_PROGRESS';
  const isProcessingRecording = processingStage !== 'idle' || transcribeMutation.isPending || summarizeMutation.isPending;

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
    if (processingStage === 'saving') return 'Saving recording';
    if (processingStage === 'transcribing' || transcribeMutation.isPending) return 'Transcribing';
    if (processingStage === 'summarizing' || summarizeMutation.isPending) return 'Generating summary';
    if (transcript) return 'Transcript saved';
    return 'Ready';
  }, [isRecording, processingStage, summarizeMutation.isPending, transcript, transcribeMutation.isPending]);

  const recordingStatusText = useMemo(() => {
    if (isRecording) return 'Recording in progress';
    if (processingStage === 'saving') return 'Saving recording';
    if (processingStage === 'transcribing' || transcribeMutation.isPending) return 'Recording saved. Transcribing conversation';
    if (processingStage === 'summarizing' || summarizeMutation.isPending) return 'Transcript ready. Generating AI summary';
    if (audioUrl) return 'Recording saved';
    return 'No recording saved yet';
  }, [audioUrl, isRecording, processingStage, summarizeMutation.isPending, transcribeMutation.isPending]);

  const transcriptStatusText = useMemo(() => {
    if (transcript) return '';
    if (processingStage === 'saving') return 'Saving the recording before transcription starts.';
    if (processingStage === 'transcribing' || transcribeMutation.isPending) {
      return 'Recording saved. AI is transcribing the conversation now.';
    }
    if (processingStage === 'summarizing' || summarizeMutation.isPending) {
      return 'Transcript is ready. AI is preparing the consultation summary.';
    }
    if (hasStubTranscript) {
      return 'Previous transcript was generated in demo mode. Record again to replace it.';
    }
    return 'Record the appointment conversation to generate a transcript.';
  }, [hasStubTranscript, processingStage, summarizeMutation.isPending, transcript, transcribeMutation.isPending]);

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
    setProcessingStage('saving');
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
    setLatestConversationTurns([]);
    setProcessingStage('transcribing');

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
      setLatestConversationTurns(transcription.conversationTurns ?? []);

      const transcriptText = transcription.text.trim();

      if (!transcriptText || isStubTranscription(transcriptText)) {
        if (isStubTranscription(transcriptText)) {
          setError('AI service returned a demo transcript. Record again after the AI service is restarted.');
        }
        setProcessingStage('idle');
        return;
      }

      try {
        setProcessingStage('summarizing');
        await summarizeMutation.mutateAsync({
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          staffId: appointment.staffProfileId ?? undefined,
          transcription: transcriptText,
        });
      } catch (summaryError) {
        setError(getConsultationErrorMessage(summaryError, 'Transcript saved, but AI report could not be generated'));
      }
    } catch (transcriptionError) {
      setError(getConsultationErrorMessage(transcriptionError, 'Recording could not be transcribed'));
    } finally {
      setProcessingStage('idle');
    }
  };

  return (
    <Card
      title="Conversation Recorder"
      subtitle="Appointment audio and transcript"
      actions={
        <Badge variant={isRecording ? 'danger' : isProcessingRecording ? 'warning' : 'info'}>
          {statusLabel}
        </Badge>
      }
    >
      <div className="space-y-4">
        {error ? <FeedbackMessage type="error" message={error} /> : null}

        <div className="rounded-xl border border-border bg-surface/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{formatElapsed(elapsedSeconds)}</p>
              <p className="mt-1 text-xs text-muted">{recordingStatusText}</p>
            </div>
            {isRecording ? (
              <Button
                type="button"
                variant="danger"
                className="shadow-sm shadow-danger/20"
                leftIcon={
                  <span className="relative flex h-4 w-4 items-center justify-center">
                    <span className="absolute h-3 w-3 animate-ping rounded-full bg-white/50" />
                    <CircleStop className="relative h-4 w-4" aria-hidden="true" />
                  </span>
                }
                onClick={stopRecording}
              >
                Stop Recording
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                disabled={!canRecord || isProcessingRecording}
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
          {!conversationQuery.isLoading && !transcript && transcriptStatusText ? (
            <p className="text-sm text-muted">{transcriptStatusText}</p>
          ) : null}
          {transcript && conversationTurns.length > 0 ? (
            <ol className="space-y-3">
              {conversationTurns.map((turn, index) => (
                <li key={`${turn.speaker}-${index}-${turn.text.slice(0, 12)}`} className="space-y-1.5">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${speakerTone(turn.speaker)}`}
                  >
                    {speakerLabel(turn.speaker)}
                  </span>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{turn.text}</p>
                </li>
              ))}
            </ol>
          ) : null}
          {transcript && conversationTurns.length === 0 ? (
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{transcript}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
