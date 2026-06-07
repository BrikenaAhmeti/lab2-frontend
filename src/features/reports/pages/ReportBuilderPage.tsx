import { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Save } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import { PdfDocumentPanel, PdfSection } from '@/components/pdf/PdfDocumentPanel';
import Forbidden from '@/components/common/Forbidden';
import { hasPermission } from '@/features/auth/utils/permission';
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
  formatOptionLabel,
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
import Skeleton, { TableSkeleton } from '@/ui/atoms/Skeleton';

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

const ReportChart = lazy(() => import('@/features/reports/components/ReportChart'));

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

  const openTemplateModal = useCallback(() => {
    setTemplateError('');
    setTemplateModalOpen(true);
  }, []);

  const closeTemplateModal = useCallback(() => setTemplateModalOpen(false), []);

  const changeFilters = useCallback((next: Partial<ReportFilterState>) => {
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
  }, [filters.reportType]);

  const generateReport = useCallback(async () => {
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
  }, [filters.reportType, generateMutation, queryFilters]);

  const exportReport = useCallback(async (format: ReportExportFormat) => {
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
  }, [exportMutation, filters.reportType, queryFilters]);

  const saveTemplate = useCallback(async (values: ReportTemplateFormValues) => {
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
  }, [filters, saveTemplateMutation]);

  const loadTemplate = useCallback((template: Parameters<typeof filtersFromTemplate>[0]) => {
    setFilters(filtersFromTemplate(template));
    setReport(null);
    setFeedback({ type: 'success', message: 'Template loaded.' });
  }, []);

  const exportPdf = useCallback(() => exportReport('pdf'), [exportReport]);
  const exportCsv = useCallback(() => exportReport('csv'), [exportReport]);
  const exportExcel = useCallback(() => exportReport('xlsx'), [exportReport]);

  const templates = templatesQuery.data?.items ?? [];
  const optionsError = departmentsQuery.isError || staffQuery.isError || servicesQuery.isError;
  const generatedAtLabel = report
    ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(report.generatedAt))
    : '';

  if (!canGenerate) {
    return <Forbidden />;
  }

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
                  onClick={openTemplateModal}
                >
                  Save report template
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<FileText size={16} />}
                  loading={exportMutation.isPending}
                  onClick={exportPdf}
                >
                  Download PDF
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Download size={16} />}
                  loading={exportMutation.isPending}
                  onClick={exportCsv}
                >
                  Export CSV
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<FileSpreadsheet size={16} />}
                  loading={exportMutation.isPending}
                  onClick={exportExcel}
                >
                  Export Excel
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
            title="Branded PDF Preview"
            subtitle={report ? `${report.title} - generated ${generatedAtLabel}` : 'Generate a report to preview the branded PDF layout'}
          >
            {generateMutation.isPending ? <TableSkeleton rows={5} columns={4} /> : null}

            {!generateMutation.isPending && !report ? (
              <div className="rounded-lg border border-dashed border-primary/30 bg-surface/60 px-4 py-8 text-center text-sm text-muted">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-card">
                  <FileText size={22} className="text-primary" aria-hidden="true" />
                </div>
                <p className="font-medium text-foreground">No report generated yet.</p>
                <p className="mt-1">The MedSphere PDF preview will appear here after generation.</p>
              </div>
            ) : null}

            {!generateMutation.isPending && report ? (
              <PdfDocumentPanel
                documentLabel="Report PDF"
                title={report.title}
                subtitle={`Generated ${generatedAtLabel}`}
                accent={report.type === 'financial' ? 'blue' : report.type === 'inventory' ? 'amber' : 'teal'}
                meta={[
                  { label: 'Report type', value: reportTypeLabels[report.type] },
                  { label: 'Grouped by', value: formatOptionLabel(report.groupBy) },
                  { label: 'Rows', value: report.rows.length },
                  { label: 'Export style', value: 'Branded PDF' },
                ]}
              >
                <PdfSection title="Summary" accent="teal">
                  <ReportSummaryStrip summary={report.summary} />
                </PdfSection>
                <PdfSection title="Visualization" accent="blue">
                  <span className="sr-only">Chart preview</span>
                  <Suspense fallback={<Skeleton className="h-72" />}>
                    <ReportChart report={report} />
                  </Suspense>
                </PdfSection>
                <PdfSection title="Data table" accent="green">
                  <ReportDataTable rows={report.rows} />
                </PdfSection>
              </PdfDocumentPanel>
            ) : null}
          </Card>
        </div>

        <ReportTemplatesSidebar templates={templates} loading={templatesQuery.isLoading} onLoad={loadTemplate} />
      </div>

      <ReportTemplateModal
        open={templateModalOpen}
        loading={saveTemplateMutation.isPending}
        errorMessage={templateError}
        onClose={closeTemplateModal}
        onSubmit={saveTemplate}
      />
    </div>
  );
}
