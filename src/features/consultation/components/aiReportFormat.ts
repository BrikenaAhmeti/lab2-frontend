import type { ConsultationSummary } from '@/lib/api/ai-api';
import type { MedicalRecordFormValues } from './MedicalRecordForm';

const sectionLabels = {
  chiefComplaint: 'Patient concern',
  historyOfPresentIllness: 'History of present illness',
  examinationFindings: 'Examination findings',
  assessmentAndDiagnosis: 'Assessment and diagnosis',
  treatmentPlan: 'Treatment plan',
  followUpInstructions: 'Follow-up instructions',
  aiReview: 'AI review',
} satisfies Record<keyof ConsultationSummary, string>;

const reportSections: Array<keyof ConsultationSummary> = [
  'chiefComplaint',
  'historyOfPresentIllness',
  'examinationFindings',
  'assessmentAndDiagnosis',
  'treatmentPlan',
  'followUpInstructions',
  'aiReview',
];

export function isStubTranscription(value?: string | null) {
  return /^Stub transcription generated for\b/i.test(value?.trim() ?? '');
}

export function formatAiReport(summary?: ConsultationSummary | null) {
  if (!summary) return '';

  return reportSections
    .map((key) => `${sectionLabels[key]}\n${summary[key]?.trim() || '-'}`)
    .join('\n\n');
}

export function reportTextFromConversation(input: {
  reportText?: string | null;
  summary?: ConsultationSummary | null;
}) {
  return input.reportText?.trim() || formatAiReport(input.summary);
}

export function medicalRecordValuesFromAiReport(
  reportText: string,
  summary?: ConsultationSummary | null
): MedicalRecordFormValues {
  const sections = parseReportSections(reportText);

  return {
    chiefComplaint: sections['patient concern'] || sections['chief complaint'] || summary?.chiefComplaint || '',
    vitals: '',
    diagnosis: sections['assessment and diagnosis'] || summary?.assessmentAndDiagnosis || '',
    treatmentPlan: sections['treatment plan'] || summary?.treatmentPlan || '',
    followUpInstructions: sections['follow-up instructions'] || summary?.followUpInstructions || '',
    notes: reportText,
  };
}

function parseReportSections(reportText: string) {
  const lines = reportText.split(/\r?\n/);
  const headings = new Set([
    ...Object.values(sectionLabels).map((label) => label.toLowerCase()),
    'chief complaint',
  ]);
  const sections: Record<string, string> = {};
  let currentHeading = '';

  for (const line of lines) {
    const normalized = line.trim().toLowerCase();

    if (headings.has(normalized)) {
      currentHeading = normalized;
      sections[currentHeading] = '';
      continue;
    }

    if (currentHeading) {
      sections[currentHeading] = `${sections[currentHeading]}${sections[currentHeading] ? '\n' : ''}${line}`.trim();
    }
  }

  return sections;
}
