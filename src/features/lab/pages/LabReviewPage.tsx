import { CheckCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { LabOrderView, TriggerLabOrderAiResponse } from '@/lib/api/lab-api';
import { useAppSelector } from '@/app/hooks';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import AIInterpretationPanel from '@/features/lab/components/AIInterpretationPanel';
import LabOrderQueue from '@/features/lab/components/LabOrderQueue';
import LabOrderStatusBadge from '@/features/lab/components/LabOrderStatusBadge';
import ResultsTable from '@/features/lab/components/ResultsTable';
import {
  belongsToOrderingDoctor,
  formatLabDateTime,
  isPendingLabReview,
  sortLabOrders,
} from '@/features/lab/components/labFormat';
import {
  getLabApiErrorMessage,
  useLabInterpretation,
  useLabOrder,
  useLabOrders,
  useReviewLabOrder,
  useTriggerLabOrderAi,
} from '@/features/lab/hooks/useLabOrders';

function criticalItems(order: LabOrderView) {
  return order.items.filter((item) => item.flag === 'critical' || item.isCritical);
}

function notesPayload(value: string) {
  const notes = value.trim();
  return { notes: notes || null };
}

export default function LabReviewPage() {
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const staffProfileId = user?.profileId ?? user?.id;
  const [selectedId, setSelectedId] = useState(params.id ?? '');
  const [localOrders, setLocalOrders] = useState<Record<string, LabOrderView>>({});
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [aiResults, setAiResults] = useState<Record<string, TriggerLabOrderAiResponse>>({});

  const ordersQuery = useLabOrders({ page: 1, limit: 100, status: 'completed' });
  const detailQuery = useLabOrder(selectedId);
  const reviewMutation = useReviewLabOrder();
  const aiMutation = useTriggerLabOrderAi();

  useEffect(() => {
    setSelectedId(params.id ?? '');
  }, [params.id]);

  const completedOrders = useMemo(
    () => (ordersQuery.data?.items ?? []).map((order) => localOrders[order.id] ?? order),
    [localOrders, ordersQuery.data?.items]
  );
  const pendingReviews = useMemo(
    () =>
      sortLabOrders(
        completedOrders.filter(
          (order) => isPendingLabReview(order) && belongsToOrderingDoctor(order, user?.id, staffProfileId)
        )
      ),
    [completedOrders, user?.id, staffProfileId]
  );
  const selectedOrder =
    (selectedId ? localOrders[selectedId] ?? pendingReviews.find((order) => order.id === selectedId) ?? detailQuery.data : null) ??
    pendingReviews[0] ??
    null;
  const selectedCriticalItems = selectedOrder ? criticalItems(selectedOrder) : [];
  const selectedOrderHasResults = selectedOrder?.items.some((item) => item.resultValue?.trim()) ?? false;
  const canTriggerAi = Boolean(selectedOrder && selectedOrder.status === 'COMPLETED' && selectedOrderHasResults);
  const interpretationQuery = useLabInterpretation(
    selectedOrder?.id ?? '',
    Boolean(selectedOrder && selectedOrder.status === 'COMPLETED')
  );

  useEffect(() => {
    if (!selectedId && pendingReviews[0]) {
      setSelectedId(pendingReviews[0].id);
    }
  }, [pendingReviews, selectedId]);

  useEffect(() => {
    setReviewNotes(selectedOrder?.notes ?? '');
    setActionError('');
    setSuccessMessage('');
  }, [selectedOrder?.id, selectedOrder?.notes]);

  const rememberOrder = (order: LabOrderView) => {
    setLocalOrders((current) => ({ ...current, [order.id]: order }));
    setSelectedId(order.id);
  };

  const selectOrder = (order: LabOrderView) => {
    setActionError('');
    setSuccessMessage('');
    setSelectedId(order.id);
    navigate(`/doctor/lab-reviews/${order.id}`);
  };

  const handleReview = async () => {
    if (!selectedOrder) return;
    setActionError('');
    setSuccessMessage('');

    try {
      const updatedOrder = await reviewMutation.mutateAsync({
        id: selectedOrder.id,
        payload: notesPayload(reviewNotes),
      });
      rememberOrder(updatedOrder);
      setSuccessMessage('Lab results marked as reviewed.');
    } catch (error) {
      setActionError(getLabApiErrorMessage(error, 'Lab results could not be marked as reviewed'));
    }
  };

  const handleTriggerAi = async () => {
    if (!selectedOrder || !canTriggerAi) return;
    setActionError('');

    try {
      const result = await aiMutation.mutateAsync(selectedOrder.id);
      setAiResults((current) => ({ ...current, [selectedOrder.id]: result }));
    } catch (error) {
      setActionError(getLabApiErrorMessage(error, 'AI interpretation could not be triggered'));
    }
  };

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: 'Doctor', to: '/doctor' }, { label: 'Lab Reviews' }]} />

      <div>
        <h1 className="text-2xl font-semibold text-foreground">Lab Reviews</h1>
        <p className="mt-1 text-sm text-muted">Review completed lab orders before releasing them to patients.</p>
      </div>

      {ordersQuery.isError || detailQuery.isError ? (
        <FeedbackMessage type="error" message="Lab review data could not be loaded. Please refresh and try again." />
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_32rem]">
        <LabOrderQueue
          title="Pending Reviews"
          subtitle="Completed lab orders awaiting doctor review."
          orders={pendingReviews}
          selectedId={selectedOrder?.id}
          loading={ordersQuery.isLoading}
          emptyText="No lab results are waiting for review."
          onSelect={selectOrder}
        />

        <aside className="space-y-4 rounded-lg border border-border bg-card p-5">
          {!selectedOrder ? (
            <p className="text-sm text-muted">Select a completed lab order to review results.</p>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <LabOrderStatusBadge status={selectedOrder.status} />
                  <Badge variant={selectedOrder.priority === 'urgent' ? 'danger' : 'neutral'}>
                    {selectedOrder.priority === 'urgent' ? 'Urgent' : 'Normal'}
                  </Badge>
                  {selectedOrder.reviewedAt ? <Badge variant="success">Reviewed</Badge> : <Badge>Awaiting Review</Badge>}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{selectedOrder.patient.name}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {`${selectedOrder.department.name} - completed ${formatLabDateTime(selectedOrder.completedAt)}`}
                  </p>
                </div>
              </div>

              {selectedCriticalItems.length > 0 ? (
                <FeedbackMessage
                  type="error"
                  message={`Critical results: ${selectedCriticalItems.map((item) => item.labTest.name).join(', ')}`}
                />
              ) : null}

              <ResultsTable items={selectedOrder.items} />

              <label htmlFor="doctor-review-notes" className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">Doctor notes</span>
                <textarea
                  id="doctor-review-notes"
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Clinical observations for this lab review"
                />
              </label>

              <AIInterpretationPanel
                loading={aiMutation.isPending}
                interpretationLoading={interpretationQuery.isFetching}
                interpretationError={interpretationQuery.isError}
                interpretation={interpretationQuery.data}
                canTrigger={canTriggerAi}
                result={aiResults[selectedOrder.id]}
                onTrigger={handleTriggerAi}
              />

              {actionError ? <FeedbackMessage type="error" message={actionError} /> : null}
              {successMessage ? <FeedbackMessage type="success" message={successMessage} /> : null}

              <Button
                type="button"
                loading={reviewMutation.isPending}
                disabled={Boolean(selectedOrder.reviewedAt)}
                leftIcon={<CheckCircle className="h-4 w-4" />}
                onClick={handleReview}
              >
                Mark as Reviewed
              </Button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
