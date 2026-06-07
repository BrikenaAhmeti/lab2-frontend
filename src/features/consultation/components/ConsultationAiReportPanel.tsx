import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Save, Sparkles } from 'lucide-react';
import type { AppointmentView } from '@/lib/api/appointments-api';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import {
  getConsultationErrorMessage,
  useAiConsultation,
  useSummarizeConsultation,
  useUpdateAiConsultationSummary,
} from '../hooks/useConsultation';
import type { MedicalRecordFormValues } from './MedicalRecordForm';
import { medicalRecordValuesFromAiReport, reportTextFromConversation } from './aiReportFormat';

interface ConsultationAiReportPanelProps {
  appointment: AppointmentView;
  disabled?: boolean;
  onSaveAsMedicalRecord: (values: MedicalRecordFormValues) => Promise<void>;
}

function statusTone(status?: string): 'success' | 'danger' | 'warning' {
  if (status === 'approved') return 'success';
  if (status === 'discarded') return 'danger';
  return 'warning';
}

export default function ConsultationAiReportPanel({
  appointment,
  disabled,
  onSaveAsMedicalRecord,
}: ConsultationAiReportPanelProps) {
  const conversationQuery = useAiConsultation(appointment.id);
  const summarizeMutation = useSummarizeConsultation();
  const updateSummaryMutation = useUpdateAiConsultationSummary();
  const conversation = conversationQuery.data ?? null;
  const [reportText, setReportText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const transcript = conversation?.transcription?.trim() ?? '';
  const summaryText = useMemo(() => reportTextFromConversation(conversation ?? {}), [conversation]);
  const canEdit = !disabled && appointment.status === 'IN_PROGRESS';

  useEffect(() => {
    if (summaryText) {
      setReportText(summaryText);
    }
  }, [summaryText]);

  const generateSummary = async () => {
    if (!transcript) return;
    setError('');
    setSuccess('');

    try {
      const result = await summarizeMutation.mutateAsync({
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        staffId: appointment.staffProfileId ?? undefined,
        transcription: transcript,
        context: {
          patientName: appointment.patient.name,
          service: appointment.service.name,
          department: appointment.department.name,
          appointmentType: appointment.appointmentType,
          scheduledAt: appointment.scheduledAt,
        },
      });

      setReportText(result.reportText || reportTextFromConversation(result.conversation ?? { summary: result.summary }));
      setSuccess('AI report generated.');
    } catch (summaryError) {
      setError(getConsultationErrorMessage(summaryError, 'AI report could not be generated'));
    }
  };

  const saveReport = async () => {
    const trimmed = reportText.trim();
    if (!trimmed) return;
    setError('');
    setSuccess('');

    try {
      await updateSummaryMutation.mutateAsync({
        appointmentId: appointment.id,
        payload: {
          reportText: trimmed,
          summaryStatus: 'draft',
        },
      });
      setSuccess('AI report saved.');
    } catch (saveError) {
      setError(getConsultationErrorMessage(saveError, 'AI report could not be saved'));
    }
  };

  const saveAsMedicalRecord = async () => {
    const trimmed = reportText.trim();
    if (!trimmed) return;
    setError('');
    setSuccess('');

    try {
      await onSaveAsMedicalRecord(medicalRecordValuesFromAiReport(trimmed, conversation?.summary));
      setSuccess('AI report saved to the medical record draft.');
    } catch (recordError) {
      setError(getConsultationErrorMessage(recordError, 'AI report could not be saved to the medical record'));
    }
  };

  return (
    <Card
      title="AI Consultation Report"
      subtitle="Generated from the recorded conversation"
      actions={
        <Badge variant={statusTone(conversation?.summaryStatus)}>{conversation?.summaryStatus ?? 'not generated'}</Badge>
      }
    >
      <div className="space-y-4">
        {error ? <FeedbackMessage type="error" message={error} /> : null}
        {success ? <FeedbackMessage type="success" message={success} /> : null}
        {conversationQuery.isError ? (
          <FeedbackMessage
            type="error"
            message={getConsultationErrorMessage(conversationQuery.error, 'AI conversation could not be loaded')}
          />
        ) : null}

        <label htmlFor="ai-consultation-report" className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Report text</span>
          <textarea
            id="ai-consultation-report"
            value={reportText}
            disabled={!canEdit || summarizeMutation.isPending || updateSummaryMutation.isPending}
            onChange={(event) => setReportText(event.target.value)}
            className="min-h-72 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-6 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder={
              transcript
                ? 'Generate an AI report, then edit the text before saving.'
                : 'Record and transcribe the conversation before generating a report.'
            }
          />
        </label>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={!canEdit || !transcript || summarizeMutation.isPending}
            loading={summarizeMutation.isPending}
            leftIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
            onClick={generateSummary}
          >
            Generate Summary
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!canEdit || !reportText.trim() || updateSummaryMutation.isPending}
            loading={updateSummaryMutation.isPending}
            leftIcon={<Save className="h-4 w-4" aria-hidden="true" />}
            onClick={saveReport}
          >
            Save Edits
          </Button>
          <Button
            type="button"
            disabled={!canEdit || !reportText.trim()}
            leftIcon={<ClipboardCheck className="h-4 w-4" aria-hidden="true" />}
            onClick={saveAsMedicalRecord}
          >
            Save as Record
          </Button>
        </div>
      </div>
    </Card>
  );
}
