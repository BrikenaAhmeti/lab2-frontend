import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import CmsPageFormModal from '@/features/cms/components/CmsPageFormModal';
import CmsPagesTable from '@/features/cms/components/CmsPagesTable';
import { cmsBreadcrumbs } from '@/features/cms/cmsBreadcrumbs';
import { useCmsAccess } from '@/features/cms/hooks/useCmsAccess';
import {
  cmsErrorMessage,
  useCmsPages,
  useCreateCmsPage,
  useDeleteCmsPage,
  usePatchCmsPage,
} from '@/features/cms/hooks/useCms';
import type { CmsPage } from '@/lib/api/cms-api';
import type { CmsPageFormValues } from '@/features/cms/cms.schemas';

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

export default function CmsPagesPage() {
  const navigate = useNavigate();
  const { canManageCms } = useCmsAccess();
  const pagesQuery = useCmsPages();
  const createPage = useCreateCmsPage();
  const patchPage = usePatchCmsPage();
  const deletePage = useDeleteCmsPage();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const mutationPending = createPage.isPending || patchPage.isPending || deletePage.isPending;
  const pages = pagesQuery.data ?? [];

  const submitCreate = async (values: CmsPageFormValues) => {
    setFeedback(null);
    setFormError('');

    try {
      const page = await createPage.mutateAsync(values);
      setShowCreateModal(false);
      setFeedback({ type: 'success', message: 'CMS page created successfully' });
      navigate(`/admin/cms/pages/${page.id}`);
    } catch (error) {
      setFormError(cmsErrorMessage(error, 'CMS page could not be created'));
    }
  };

  const togglePublish = async (page: CmsPage) => {
    setFeedback(null);

    try {
      await patchPage.mutateAsync({ id: page.id, values: { isPublished: !page.isPublished } });
      setFeedback({
        type: 'success',
        message: page.isPublished ? 'CMS page unpublished' : 'CMS page published',
      });
    } catch (error) {
      setFeedback({ type: 'error', message: cmsErrorMessage(error, 'CMS page could not be updated') });
    }
  };

  const removePage = async (page: CmsPage) => {
    if (!window.confirm(`Delete ${page.title}?`)) {
      return;
    }

    setFeedback(null);

    try {
      await deletePage.mutateAsync(page.id);
      setFeedback({ type: 'success', message: 'CMS page deleted successfully' });
    } catch (error) {
      setFeedback({ type: 'error', message: cmsErrorMessage(error, 'CMS page could not be deleted') });
    }
  };

  const errorMessage = pagesQuery.isError ? cmsErrorMessage(pagesQuery.error, 'CMS pages could not be loaded') : '';

  return (
    <div className="space-y-4">
      <Breadcrumbs items={cmsBreadcrumbs('Pages')} />

      <Card
        title="CMS Pages"
        subtitle="Manage public website pages"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/cms/banners"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface/80"
            >
              Banners
            </Link>
            {canManageCms ? <Button onClick={() => setShowCreateModal(true)}>Add Page</Button> : null}
          </div>
        }
      >
        <div className="space-y-4">
          {feedback ? <FeedbackMessage type={feedback.type} message={feedback.message} /> : null}

          {pagesQuery.isLoading ? (
            <div className="rounded-xl border border-border p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-10 rounded-lg bg-surface" />
                <div className="h-12 rounded-lg bg-surface" />
                <div className="h-12 rounded-lg bg-surface" />
              </div>
            </div>
          ) : null}

          {pagesQuery.isError ? <FeedbackMessage type="error" message={errorMessage} /> : null}

          {!pagesQuery.isLoading && !pagesQuery.isError && pages.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center">
              <p className="font-medium text-foreground">No CMS pages found</p>
              <p className="mt-1 text-sm text-muted">Create the first page when the backend seed is empty.</p>
            </div>
          ) : null}

          {!pagesQuery.isLoading && !pagesQuery.isError && pages.length > 0 ? (
            <CmsPagesTable
              pages={pages}
              canManage={canManageCms}
              mutationPending={mutationPending}
              onTogglePublish={togglePublish}
              onDelete={removePage}
            />
          ) : null}
        </div>

        <CmsPageFormModal
          open={showCreateModal}
          loading={createPage.isPending}
          submitError={formError}
          onClose={() => {
            setFormError('');
            setShowCreateModal(false);
          }}
          onSubmit={submitCreate}
        />
      </Card>
    </div>
  );
}
