import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, FileText, Mic, RefreshCw } from 'lucide-react';
import { aiApi, type VapiCallLogView } from '@/lib/api/ai-api';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

function formatDateTime(value?: string | null) {
  if (!value) return '-';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDuration(seconds?: number | null) {
  if (!seconds) return '-';
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${minutes}m ${remainder}s`;
}

function recordingLinks(call: VapiCallLogView) {
  return [
    { label: 'Stereo', url: call.recordingUrls.stereoUrl },
    { label: 'Mono', url: call.recordingUrls.monoCombinedUrl },
    { label: 'Assistant', url: call.recordingUrls.assistantUrl },
    { label: 'Caller', url: call.recordingUrls.customerUrl },
    { label: 'Legacy', url: call.recordingUrls.legacyRecordingUrl },
    { label: 'Video', url: call.recordingUrls.videoUrl },
  ].filter((item): item is { label: string; url: string } => Boolean(item.url));
}

function statusVariant(status?: string | null) {
  if (status === 'ended') return 'success';
  if (status === 'in-progress' || status === 'queued' || status === 'ringing') return 'info';
  if (status === 'failed') return 'danger';

  return 'neutral';
}

interface VapiCallLogsPanelProps {
  showHeader?: boolean;
}

export function VapiCallLogsPanel({ showHeader = true }: VapiCallLogsPanelProps) {
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const callsQuery = useQuery({
    queryKey: ['vapi-calls', 50],
    queryFn: () => aiApi.listVapiCalls({ limit: 50 }),
    retry: false,
  });
  const calls = callsQuery.data?.calls ?? [];
  const firstCallId = calls[0]?.id ?? null;
  const activeCallId = selectedCallId ?? firstCallId;
  const detailQuery = useQuery({
    queryKey: ['vapi-call', activeCallId],
    queryFn: () => aiApi.getVapiCall(activeCallId!),
    enabled: Boolean(activeCallId),
    retry: false,
  });
  const logQuery = useQuery({
    queryKey: ['vapi-call-log', activeCallId],
    queryFn: () => aiApi.getVapiCallLog(activeCallId!),
    enabled: false,
    retry: false,
  });
  const selectedCall = detailQuery.data ?? calls.find((call) => call.id === activeCallId) ?? null;
  const recordings = useMemo(() => (selectedCall ? recordingLinks(selectedCall) : []), [selectedCall]);
  const rawLog = logQuery.data ? JSON.stringify(logQuery.data.body, null, 2) : '';

  return (
    <div className="space-y-5">
      {showHeader ? (
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Voice AI Logs</h1>
          <p className="mt-1 text-sm text-muted">Vapi appointment calls, transcripts, recordings, and artifact logs.</p>
        </div>
      ) : null}

      {callsQuery.isError ? (
        <FeedbackMessage type="error" message="Vapi call logs could not be loaded." />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(22rem,28rem)_minmax(0,1fr)]">
        <Card
          title="Calls"
          subtitle={callsQuery.data?.assistantId ? `Assistant ${callsQuery.data.assistantId}` : 'Latest Vapi calls'}
          actions={
            <Button
              type="button"
              size="sm"
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
              loading={callsQuery.isFetching}
              onClick={() => callsQuery.refetch()}
            >
              Refresh
            </Button>
          }
        >
          {callsQuery.isLoading ? (
            <div className="rounded-lg border border-border p-4 text-sm text-muted">Loading calls...</div>
          ) : null}

          {!callsQuery.isLoading && calls.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
              No Vapi calls found.
            </div>
          ) : null}

          <div className="space-y-2">
            {calls.map((call) => (
              <button
                key={call.id}
                type="button"
                onClick={() => {
                  setSelectedCallId(call.id);
                }}
                className={`w-full rounded-lg border p-3 text-left transition hover:border-primary ${
                  activeCallId === call.id ? 'border-primary bg-primary/5' : 'border-border bg-background'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{call.id}</p>
                    <p className="mt-1 text-xs text-muted">{formatDateTime(call.createdAt)}</p>
                  </div>
                  <Badge variant={statusVariant(call.status)}>{call.status ?? 'unknown'}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{call.summary ?? call.endedReason ?? 'No summary available'}</p>
              </button>
            ))}
          </div>
        </Card>

        <section className="space-y-4">
          <Card
            title={selectedCall ? `Call ${selectedCall.id}` : 'Call details'}
            subtitle={selectedCall ? `${formatDateTime(selectedCall.startedAt ?? selectedCall.createdAt)} · ${formatDuration(selectedCall.durationSeconds)}` : 'Select a call'}
            actions={
              selectedCall ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  leftIcon={<FileText className="h-4 w-4" aria-hidden="true" />}
                  loading={logQuery.isFetching}
                  onClick={() => logQuery.refetch()}
                >
                  Fetch Log
                </Button>
              ) : null
            }
          >
            {detailQuery.isFetching && selectedCall ? (
              <p className="mb-3 text-sm text-muted">Refreshing call details...</p>
            ) : null}
            {detailQuery.isError ? <FeedbackMessage type="error" message="Call detail could not be loaded." /> : null}
            {!selectedCall ? (
              <div className="rounded-lg border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
                No call selected.
              </div>
            ) : (
              <div className="space-y-4">
                <dl className="grid gap-3 text-sm md:grid-cols-3">
                  <div className="rounded-lg border border-border bg-surface/50 p-3">
                    <dt className="text-muted">Type</dt>
                    <dd className="mt-1 font-medium text-foreground">{selectedCall.type ?? '-'}</dd>
                  </div>
                  <div className="rounded-lg border border-border bg-surface/50 p-3">
                    <dt className="text-muted">Ended reason</dt>
                    <dd className="mt-1 font-medium text-foreground">{selectedCall.endedReason ?? '-'}</dd>
                  </div>
                  <div className="rounded-lg border border-border bg-surface/50 p-3">
                    <dt className="text-muted">Cost</dt>
                    <dd className="mt-1 font-medium text-foreground">{selectedCall.cost ?? '-'}</dd>
                  </div>
                </dl>

                {selectedCall.summary ? (
                  <div className="rounded-lg border border-border bg-surface/50 p-3">
                    <p className="text-xs font-semibold uppercase text-muted">Summary</p>
                    <p className="mt-2 text-sm text-foreground">{selectedCall.summary}</p>
                  </div>
                ) : null}

                <div>
                  <h3 className="text-sm font-semibold text-foreground">Recordings</h3>
                  {recordings.length === 0 ? (
                    <p className="mt-2 rounded-lg border border-border bg-surface/60 p-3 text-sm text-muted">No recording URLs are available for this call.</p>
                  ) : (
                    <div className="mt-2 grid gap-3 lg:grid-cols-2">
                      {recordings.map((recording) => (
                        <div key={recording.label} className="rounded-lg border border-border bg-background p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                              <Mic className="h-4 w-4" aria-hidden="true" />
                              {recording.label}
                            </span>
                            <a href={recording.url} target="_blank" rel="noreferrer" className="text-primary" aria-label={`Open ${recording.label} recording`}>
                              <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </a>
                          </div>
                          {recording.label === 'Video' ? (
                            <video controls className="max-h-48 w-full rounded-md bg-black" src={recording.url} />
                          ) : (
                            <audio controls className="w-full" src={recording.url} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground">Messages</h3>
                  <div className="mt-2 space-y-2">
                    {selectedCall.messages.length === 0 ? (
                      <p className="rounded-lg border border-border bg-surface/60 p-3 text-sm text-muted">No message history is available.</p>
                    ) : (
                      selectedCall.messages.map((message, index) => (
                        <div key={`${message.role}-${index}`} className="rounded-lg border border-border bg-background p-3">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <Badge variant={message.role === 'assistant' ? 'info' : 'neutral'}>{message.role}</Badge>
                            <span className="text-xs text-muted">{message.secondsFromStart != null ? `${message.secondsFromStart}s` : ''}</span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm text-foreground">{message.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {selectedCall.transcript ? (
                  <details className="rounded-lg border border-border bg-surface/50 p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-foreground">Transcript</summary>
                    <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-sm text-foreground">{selectedCall.transcript}</pre>
                  </details>
                ) : null}
              </div>
            )}
          </Card>

          {logQuery.isError ? <FeedbackMessage type="error" message="Vapi artifact log could not be fetched." /> : null}
          {rawLog ? (
            <Card title="Artifact Log" subtitle={logQuery.data?.logUrl}>
              <pre className="max-h-[32rem] overflow-auto rounded-lg bg-surface p-4 text-xs text-foreground">{rawLog}</pre>
            </Card>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default function VapiCallLogsPage() {
  return <VapiCallLogsPanel />;
}
