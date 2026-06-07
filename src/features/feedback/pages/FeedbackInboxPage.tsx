import { useMemo, useState } from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import Forbidden from '@/components/common/Forbidden';
import { useAppSelector } from '@/app/hooks';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import DateModeFilter, {
  dateModeFilterToRange,
  emptyDateModeFilterValue,
  formatDateModeFilterSummary,
  isDateModeFilterActive,
  type DateModeFilterValue,
} from '@/ui/molecules/DateModeFilter';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import FilterSummaryBar, { type FilterSummaryChip } from '@/ui/molecules/FilterSummaryBar';
import SelectField from '@/ui/molecules/SelectField';
import type { FeedbackStatus } from '@/lib/api/feedback-api';
import AdminFeedbackFilters from '../components/AdminFeedbackFilters';
import FeedbackInboxTable from '../components/FeedbackInboxTable';
import { titleCase } from '../components/feedbackFormat';
import { getFeedbackApiErrorMessage, useFeedbackList, useUpdateFeedbackStatus } from '../hooks/useFeedback';

interface FeedbackInboxPageProps {
  portal: 'admin' | 'doctor';
}

function canReadFeedback(permissions: string[], roles: string[]) {
  return hasAnyRole(roles, ['Admin', 'Super Admin']) || hasAnyPermission(permissions, ['feedback:read'], 'any');
}

function canManageFeedback(permissions: string[], roles: string[]) {
  return hasAnyRole(roles, ['Admin', 'Super Admin']) || hasAnyPermission(permissions, ['feedback:manage:all'], 'any');
}

function todayInputValue() {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60 * 1000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}

export default function FeedbackInboxPage({ portal }: FeedbackInboxPageProps) {
  const user = useAppSelector((state) => state.auth.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const [status, setStatus] = useState<FeedbackStatus | ''>('pending');
  const [patientSearch, setPatientSearch] = useState('');
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [submittedDateFilter, setSubmittedDateFilter] =
    useState<DateModeFilterValue>(emptyDateModeFilterValue);
  const [staffProfileId, setStaffProfileId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const canRead = canReadFeedback(permissions, roles);
  const canManage = canManageFeedback(permissions, roles);
  const showAdminFilters = portal === 'admin';
  const submittedDateRange = useMemo(() => dateModeFilterToRange(submittedDateFilter), [submittedDateFilter]);
  const submittedDateMax = useMemo(() => todayInputValue(), []);
  const params = useMemo(
    () => ({
      page: 1,
      limit: 25,
      patientSearch: patientSearch.trim() || undefined,
      appointmentSearch: appointmentSearch.trim() || undefined,
      status: status || undefined,
      staffProfileId: showAdminFilters && staffProfileId ? staffProfileId : undefined,
      departmentId: showAdminFilters && departmentId ? departmentId : undefined,
      submittedAtFrom: submittedDateRange.from,
      submittedAtTo: submittedDateRange.to,
    }),
    [
      appointmentSearch,
      departmentId,
      patientSearch,
      showAdminFilters,
      staffProfileId,
      status,
      submittedDateRange.from,
      submittedDateRange.to,
    ]
  );
  const feedbackQuery = useFeedbackList(params, canRead);
  const updateMutation = useUpdateFeedbackStatus();
  const rows = feedbackQuery.data?.items ?? [];
  const root = portal === 'admin' ? '/admin' : '/doctor';
  const label = portal === 'admin' ? 'Admin' : 'Doctor';
  const filterChips: FilterSummaryChip[] = [];
  const trimmedPatientSearch = patientSearch.trim();
  const trimmedAppointmentSearch = appointmentSearch.trim();
  const submittedDateActive = isDateModeFilterActive(submittedDateFilter);
  const hasActiveFilters = Boolean(
    status ||
      trimmedPatientSearch ||
      trimmedAppointmentSearch ||
      submittedDateActive ||
      staffProfileId ||
      departmentId
  );

  if (!canRead) {
    return <Forbidden />;
  }

  const clearFilters = () => {
    setStatus('');
    setPatientSearch('');
    setAppointmentSearch('');
    setStaffProfileId('');
    setDepartmentId('');
    setSubmittedDateFilter(emptyDateModeFilterValue);
  };

  if (trimmedPatientSearch) {
    filterChips.push({
      id: 'patient-search',
      label: `Patient: ${trimmedPatientSearch}`,
      onRemove: () => setPatientSearch(''),
    });
  }

  if (trimmedAppointmentSearch) {
    filterChips.push({
      id: 'appointment-search',
      label: `Appointment: ${trimmedAppointmentSearch}`,
      onRemove: () => setAppointmentSearch(''),
    });
  }

  if (status) {
    filterChips.push({
      id: 'status',
      label: `Status: ${titleCase(status)}`,
      onRemove: () => setStatus(''),
    });
  }

  if (submittedDateActive) {
    filterChips.push({
      id: 'submitted-date',
      label: `Submitted: ${formatDateModeFilterSummary(submittedDateFilter)}`,
      onRemove: () => setSubmittedDateFilter(emptyDateModeFilterValue),
    });
  }

  const updateStatus = async (id: string, nextStatus: Exclude<FeedbackStatus, 'pending'>) => {
    setMessage(null);

    try {
      await updateMutation.mutateAsync({ id, payload: { status: nextStatus } });
      setMessage({ type: 'success', text: `Feedback marked ${nextStatus}.` });
    } catch (error) {
      setMessage({
        type: 'error',
        text: getFeedbackApiErrorMessage(error, 'Feedback status could not be updated.'),
      });
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label, to: root }, { label: 'Feedback' }]} />

      <Card title="Feedback" subtitle="Review appointment feedback and moderation status">
        <div className="space-y-4">
          <section className="space-y-4 rounded-xl border border-border bg-surface/45 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                  <p className="mt-0.5 text-xs text-muted">Patient, appointment, submitted date, and status</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {feedbackQuery.isFetching ? (
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Updating
                  </span>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  leftIcon={<RotateCcw className="h-4 w-4" />}
                  disabled={!hasActiveFilters}
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              </div>
            </div>

            <div
              className={
                showAdminFilters
                  ? 'grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[minmax(200px,1fr)_minmax(200px,1fr)_150px_260px_200px_200px]'
                  : 'grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_160px_280px]'
              }
            >
              <Input
                id="feedback-patient-filter"
                label="Patient"
                value={patientSearch}
                onChange={(event) => setPatientSearch(event.target.value)}
                placeholder="Search patient name, email, or phone..."
              />
              <Input
                id="feedback-appointment-filter"
                label="Appointment"
                value={appointmentSearch}
                onChange={(event) => setAppointmentSearch(event.target.value)}
                placeholder="Search service, doctor, or department..."
              />
              <SelectField
                id="feedback-status-filter"
                label="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value as FeedbackStatus | '')}
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
              </SelectField>
              <DateModeFilter
                id="feedback-submitted-date-filter"
                label="Submitted date"
                value={submittedDateFilter}
                maxDate={submittedDateMax}
                panelAlign="left"
                placeholder="Any submitted date"
                singleDateLabel="Submitted on"
                rangeStartLabel="Submitted from"
                rangeEndLabel="Submitted to"
                onChange={setSubmittedDateFilter}
              />
              {showAdminFilters ? (
                <AdminFeedbackFilters
                  staffProfileId={staffProfileId}
                  departmentId={departmentId}
                  onStaffChange={setStaffProfileId}
                  onDepartmentChange={setDepartmentId}
                />
              ) : null}
            </div>

            <FilterSummaryBar chips={filterChips} />
          </section>

          {message ? <FeedbackMessage type={message.type} message={message.text} /> : null}

          {feedbackQuery.isLoading ? (
            <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading feedback...</div>
          ) : null}

          {feedbackQuery.isError ? (
            <FeedbackMessage
              type="error"
              message={getFeedbackApiErrorMessage(feedbackQuery.error, 'Feedback could not be loaded.')}
            />
          ) : null}

          {!feedbackQuery.isLoading && !feedbackQuery.isError && rows.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
              No feedback found.
            </p>
          ) : null}

          {!feedbackQuery.isLoading && !feedbackQuery.isError && rows.length > 0 ? (
            <FeedbackInboxTable
              rows={rows}
              canManage={canManage}
              loading={updateMutation.isPending}
              onUpdate={updateStatus}
            />
          ) : null}
        </div>
      </Card>
    </div>
  );
}
