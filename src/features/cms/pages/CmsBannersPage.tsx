import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import BannerFormModal from '@/features/cms/components/BannerFormModal';
import BannersTable from '@/features/cms/components/BannersTable';
import { cmsBreadcrumbs } from '@/features/cms/cmsBreadcrumbs';
import { useCmsAccess } from '@/features/cms/hooks/useCmsAccess';
import {
  cmsErrorMessage,
  useCmsBanners,
  useCreateCmsBanner,
  useDeleteCmsBanner,
  usePatchCmsBanner,
  useUpdateCmsBanner,
} from '@/features/cms/hooks/useCms';
import type { CmsBanner } from '@/lib/api/cms-api';
import type { CmsBannerFormValues } from '@/features/cms/cms.schemas';

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

export default function CmsBannersPage() {
  const { canManageCms } = useCmsAccess();
  const bannersQuery = useCmsBanners();
  const createBanner = useCreateCmsBanner();
  const updateBanner = useUpdateCmsBanner();
  const patchBanner = usePatchCmsBanner();
  const deleteBanner = useDeleteCmsBanner();
  const [editingBanner, setEditingBanner] = useState<CmsBanner | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const banners = bannersQuery.data ?? [];
  const mutationPending = createBanner.isPending || updateBanner.isPending || patchBanner.isPending || deleteBanner.isPending;

  const openCreate = () => {
    setFormError('');
    setEditingBanner(null);
    setShowFormModal(true);
  };

  const openEdit = (banner: CmsBanner) => {
    setFormError('');
    setEditingBanner(banner);
    setShowFormModal(true);
  };

  const closeForm = () => {
    setFormError('');
    setEditingBanner(null);
    setShowFormModal(false);
  };

  const saveBanner = async (values: CmsBannerFormValues) => {
    setFeedback(null);
    setFormError('');

    try {
      if (editingBanner) {
        await updateBanner.mutateAsync({ id: editingBanner.id, values });
        setFeedback({ type: 'success', message: 'CMS banner saved successfully' });
      } else {
        await createBanner.mutateAsync(values);
        setFeedback({ type: 'success', message: 'CMS banner created successfully' });
      }

      closeForm();
    } catch (error) {
      setFormError(cmsErrorMessage(error, 'CMS banner could not be saved'));
    }
  };

  const toggleActive = async (banner: CmsBanner) => {
    setFeedback(null);

    try {
      await patchBanner.mutateAsync({ id: banner.id, values: { isActive: !banner.isActive } });
      setFeedback({ type: 'success', message: banner.isActive ? 'CMS banner paused' : 'CMS banner activated' });
    } catch (error) {
      setFeedback({ type: 'error', message: cmsErrorMessage(error, 'CMS banner could not be updated') });
    }
  };

  const removeBanner = async (banner: CmsBanner) => {
    if (!window.confirm(`Delete ${banner.title}?`)) {
      return;
    }

    setFeedback(null);

    try {
      await deleteBanner.mutateAsync(banner.id);
      setFeedback({ type: 'success', message: 'CMS banner deleted successfully' });
    } catch (error) {
      setFeedback({ type: 'error', message: cmsErrorMessage(error, 'CMS banner could not be deleted') });
    }
  };

  const errorMessage = bannersQuery.isError ? cmsErrorMessage(bannersQuery.error, 'CMS banners could not be loaded') : '';

  return (
    <div className="space-y-4">
      <Breadcrumbs items={cmsBreadcrumbs('Banners')} />

      <Card
        title="CMS Banners"
        subtitle="Manage public website banner scheduling"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/cms/pages"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface/80"
            >
              Pages
            </Link>
            {canManageCms ? <Button onClick={openCreate}>Add Banner</Button> : null}
          </div>
        }
      >
        <div className="space-y-4">
          {feedback ? <FeedbackMessage type={feedback.type} message={feedback.message} /> : null}

          {bannersQuery.isLoading ? (
            <div className="rounded-xl border border-border p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-10 rounded-lg bg-surface" />
                <div className="h-12 rounded-lg bg-surface" />
                <div className="h-12 rounded-lg bg-surface" />
              </div>
            </div>
          ) : null}

          {bannersQuery.isError ? <FeedbackMessage type="error" message={errorMessage} /> : null}

          {!bannersQuery.isLoading && !bannersQuery.isError && banners.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center">
              <p className="font-medium text-foreground">No banners found</p>
              <p className="mt-1 text-sm text-muted">Add a banner when the public website needs one.</p>
            </div>
          ) : null}

          {!bannersQuery.isLoading && !bannersQuery.isError && banners.length > 0 ? (
            <BannersTable
              banners={banners}
              canManage={canManageCms}
              mutationPending={mutationPending}
              onEdit={openEdit}
              onToggleActive={toggleActive}
              onDelete={removeBanner}
            />
          ) : null}
        </div>

        <BannerFormModal
          open={showFormModal}
          banner={editingBanner}
          loading={createBanner.isPending || updateBanner.isPending}
          submitError={formError}
          onClose={closeForm}
          onSubmit={saveBanner}
        />
      </Card>
    </div>
  );
}
