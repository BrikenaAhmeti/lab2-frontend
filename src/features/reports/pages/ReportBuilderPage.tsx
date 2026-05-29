import { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Save } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import Forbidden from '@/components/common/Forbidden';
import { hasPermission } from '@/features/auth/utils/permission';
import ReportChart from '@/features/reports/components/ReportChart';
import ReportDashboardCards from '@/features/reports/components/ReportDashboardCards';
import ReportDataTable from '@/features/reports/components/ReportDataTable';
import ReportFiltersPanel from '@/features/reports/components/ReportFiltersPanel';
import ReportSummaryStrip from '@/features/reports/components/ReportSummaryStrip';
import ReportTemplateModal from '@/features/reports/components/ReportTemplateModal';
import ReportTemplatesSidebar from '@/features/reports/components/ReportTemplatesSidebar';
import {
  createReportFilters,
  defaultGroupBy,
  filtersFromTemplate,
  reportTypeLabels,
  toReportQueryFilters,
  toTemplateParameters,
  type ReportFilterState,
} from '@/features/reports/reportConfig';
import type { ReportTemplateFormValues } from '@/features/reports/reports.schemas';
import {
  getReportApiErrorMessage,
  useExportReport,
  useGenerateReport,
  useReportDepartments,
  useReportServices,
  useReportStaff,
  useReportTemplates,
  useSaveReportTemplate,
} from '@/features/reports/hooks/useReports';
import type { ReportExportFormat, ReportResult } from '@/lib/api/reports-api';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

function downloadReport(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

export default function ReportBuilderPage() {
  const permissions = useAppSelector((state) => state.auth.user?.permissions ?? []);
  const canGenerate = hasPermission(permissions, 'reports:generate');
  const [filters, setFilters] = useState<ReportFilterState>(() => createReportFilters());
  const [report, setReport] = useState<ReportResult | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateError, setTemplateError] = useState('');

  const queryFilters = useMemo(() => toReportQueryFilters(filters), [filters]);
  const departmentsQuery = useReportDepartments();
  const staffQuery = useReportStaff(filters.departmentId);
  const servicesQuery = useReportServices(filters.departmentId);
  const templatesQuery = useReportTemplates(filters.reportType);
  const generateMutation = useGenerateReport();
  const exportMutation = useExportReport();
  const saveTemplateMutation = useSaveReportTemplate();

  if (!canGenerate) {
    return <Forbidden />;
  }

  function changeFilters(next: Partial<ReportFilterState>) {
    setFilters((current) => {
      const reportType = next.reportType ?? current.reportType;

      if (reportType !== current.reportType) {
        return {
          ...createReportFilters(reportType),
          from: current.from,
          to: current.to,
          departmentId: current.departmentId,
        };
      }

      return {
        ...current,
        ...next,
        groupBy: next.groupBy || current.groupBy || defaultGroupBy[reportType],
      };
    });

    if (next.reportType && next.reportType !== filters.reportType) setReport(null);
    setFeedback(null);
  }

  async function generateReport() {
    setFeedback(null);

    try {
      const nextReport = await generateMutation.mutateAsync({
        type: filters.reportType,
        filters: queryFilters,
      });
      setReport(nextReport);
    } catch (error) {
      setFeedback({ type: 'error', message: getReportApiErrorMessage(error, 'Report could not be generated') });
    }
  }

  async function exportReport(format: ReportExportFormat) {
    setFeedback(null);

    try {
      const file = await exportMutation.mutateAsync({
        type: filters.reportType,
        filters: queryFilters,
        format,
      });
      downloadReport(file.blob, file.filename);
      setFeedback({ type: 'success', message: 'Report download started.' });
    } catch (error) {
      setFeedback({ type: 'error', message: getReportApiErrorMessage(error, 'Report could not be exported') });
    }
  }

  async function saveTemplate(values: ReportTemplateFormValues) {
    setTemplateError('');

    try {
      await saveTemplateMutation.mutateAsync({
        name: values.name.trim(),
        description: values.description?.trim() || null,
        reportType: filters.reportType,
        parameters: toTemplateParameters(filters),
      });
      setTemplateModalOpen(false);
      setFeedback({ type: 'success', message: 'Template saved successfully.' });
    } catch (error) {
      setTemplateError(getReportApiErrorMessage(error, 'Template could not be saved'));
    }
  }

  function loadTemplate(template: Parameters<typeof filtersFromTemplate>[0]) {
    setFilters(filtersFromTemplate(template));
    setReport(null);
    setFeedback({ type: 'success', message: 'Template loaded.' });
  }

  const templates = templatesQuery.data?.items ?? [];
  const optionsError = departmentsQuery.isError || staffQuery.isError || servicesQuery.isError;

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Admin', to: '/admin' }, { label: 'Reports' }]} />

      <ReportDashboardCards enabled={canGenerate} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <Card
            title="Report Builder"
            subtitle={reportTypeLabels[filters.reportType]}
            actions={
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Save size={16} />}
                  onClick={() => {
                    setTemplateError('');
                    setTemplateModalOpen(true);
                  }}
                >
                  Save Template
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<FileText size={16} />}
                  loading={exportMutation.isPending}
                  onClick={() => exportReport('pdf')}
                >
                  PDF
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Download size={16} />}
                  loading={exportMutation.isPending}
                  onClick={() => exportReport('csv')}
                >
                  CSV
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<FileSpreadsheet size={16} />}
                  loading={exportMutation.isPending}
                  onClick={() => exportReport('xlsx')}
                >
                  Excel
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              <ReportFiltersPanel
                filters={filters}
                departments={departmentsQuery.data ?? []}
                staff={staffQuery.data ?? []}
                services={servicesQuery.data ?? []}
                loading={generateMutation.isPending}
                onChange={changeFilters}
                onGenerate={generateReport}
              />

              {optionsError ? <FeedbackMessage type="error" message="Some filter options could not be loaded." /> : null}
              {feedback ? <FeedbackMessage type={feedback.type} message={feedback.message} /> : null}
            </div>
          </Card>

          <Card
            title={report?.title ?? 'Preview'}
            subtitle={report ? `Generated ${new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(report.generatedAt))}` : undefined}
          >
            {generateMutation.isPending ? (
              <div className="rounded-xl border border-border p-4 text-sm text-muted">Generating report...</div>
            ) : null}

            {!generateMutation.isPending && !report ? (
              <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
                No report generated yet.
              </div>
            ) : null}

            {!generateMutation.isPending && report ? (
              <div className="space-y-4">
                <ReportSummaryStrip summary={report.summary} />
                <ReportChart report={report} />
                <ReportDataTable rows={report.rows} />
              </div>
            ) : null}
          </Card>
        </div>

        <ReportTemplatesSidebar templates={templates} loading={templatesQuery.isLoading} onLoad={loadTemplate} />
      </div>

      <ReportTemplateModal
        open={templateModalOpen}
        loading={saveTemplateMutation.isPending}
        errorMessage={templateError}
        onClose={() => setTemplateModalOpen(false)}
        onSubmit={saveTemplate}
      />
    </div>
  );
}
