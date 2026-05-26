import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import CmsPageForm from '@/features/cms/components/CmsPageForm';
import LivePreviewPane from '@/features/cms/components/LivePreviewPane';
import SectionEditorPanel from '@/features/cms/components/SectionEditorPanel';
import SectionList from '@/features/cms/components/SectionList';
import { cmsBreadcrumbs } from '@/features/cms/cmsBreadcrumbs';
import { useCmsAccess } from '@/features/cms/hooks/useCmsAccess';
import {
  cmsErrorMessage,
  toPageFormValues,
  useCmsPage,
  useCmsSections,
  useCreateCmsSection,
  useDeleteCmsSection,
  usePatchCmsPage,
  useReorderCmsSections,
  useToggleCmsSection,
  useUpdateCmsPage,
  useUpdateCmsSection,
} from '@/features/cms/hooks/useCms';
import type { CmsSection, CmsSectionOrderPayload } from '@/lib/api/cms-api';
import type { CmsPageFormValues, CmsSectionFormValues } from '@/features/cms/cms.schemas';

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

export default function CmsPageEditorPage() {
  const { id = '' } = useParams();
  const { canManageCms } = useCmsAccess();
  const pageQuery = useCmsPage(id);
  const sectionsQuery = useCmsSections(id);
  const updatePage = useUpdateCmsPage();
  const patchPage = usePatchCmsPage();
  const createSection = useCreateCmsSection(id);
  const updateSection = useUpdateCmsSection(id);
  const toggleSection = useToggleCmsSection(id);
  const reorderSections = useReorderCmsSections(id);
  const deleteSection = useDeleteCmsSection(id);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [pageFormError, setPageFormError] = useState('');
  const [sectionFormError, setSectionFormError] = useState('');
  const [editingSection, setEditingSection] = useState<CmsSection | null>(null);
  const [sectionPanelOpen, setSectionPanelOpen] = useState(false);

  const page = pageQuery.data;
  const pageFormValues = page ? toPageFormValues(page) : undefined;
  const sections = useMemo(() => sectionsQuery.data ?? page?.sections ?? [], [page?.sections, sectionsQuery.data]);
  const nextSortOrder = useMemo(() => {
    if (sections.length === 0) {
      return 0;
    }

    return Math.max(...sections.map((section) => section.sortOrder)) + 1;
  }, [sections]);
  const mutationPending =
    updatePage.isPending ||
    patchPage.isPending ||
    createSection.isPending ||
    updateSection.isPending ||
    toggleSection.isPending ||
    reorderSections.isPending ||
    deleteSection.isPending;

  const savePage = async (values: CmsPageFormValues) => {
    setFeedback(null);
    setPageFormError('');

    try {
      await updatePage.mutateAsync({ id, values });
      setFeedback({ type: 'success', message: 'CMS page saved successfully' });
    } catch (error) {
      setPageFormError(cmsErrorMessage(error, 'CMS page could not be saved'));
    }
  };

  const togglePublish = async () => {
    if (!page) {
      return;
    }

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

  const openCreateSection = () => {
    setSectionFormError('');
    setEditingSection(null);
    setSectionPanelOpen(true);
  };

  const openEditSection = (section: CmsSection) => {
    setSectionFormError('');
    setEditingSection(section);
    setSectionPanelOpen(true);
  };

  const closeSectionPanel = () => {
    setSectionFormError('');
    setEditingSection(null);
    setSectionPanelOpen(false);
  };

  const saveSection = async (values: CmsSectionFormValues) => {
    setFeedback(null);
    setSectionFormError('');

    try {
      if (editingSection) {
        await updateSection.mutateAsync({ id: editingSection.id, values });
        setFeedback({ type: 'success', message: 'CMS section saved successfully' });
      } else {
        await createSection.mutateAsync(values);
        setFeedback({ type: 'success', message: 'CMS section created successfully' });
      }

      closeSectionPanel();
    } catch (error) {
      setSectionFormError(cmsErrorMessage(error, 'CMS section could not be saved'));
    }
  };

  const changeVisibility = async (section: CmsSection) => {
    setFeedback(null);

    try {
      await toggleSection.mutateAsync({ id: section.id, isVisible: !section.isVisible });
      setFeedback({
        type: 'success',
        message: section.isVisible ? 'CMS section hidden' : 'CMS section shown',
      });
    } catch (error) {
      setFeedback({ type: 'error', message: cmsErrorMessage(error, 'CMS section could not be updated') });
    }
  };

  const reorder = async (payload: CmsSectionOrderPayload[]) => {
    setFeedback(null);

    try {
      await reorderSections.mutateAsync(payload);
      setFeedback({ type: 'success', message: 'CMS sections reordered' });
    } catch (error) {
      setFeedback({ type: 'error', message: cmsErrorMessage(error, 'CMS sections could not be reordered') });
    }
  };

  const removeSection = async (section: CmsSection) => {
    if (!window.confirm(`Delete ${section.title || section.type}?`)) {
      return;
    }

    setFeedback(null);

    try {
      await deleteSection.mutateAsync(section.id);
      setFeedback({ type: 'success', message: 'CMS section deleted successfully' });
    } catch (error) {
      setFeedback({ type: 'error', message: cmsErrorMessage(error, 'CMS section could not be deleted') });
    }
  };

  const pageError = pageQuery.isError ? cmsErrorMessage(pageQuery.error, 'CMS page could not be loaded') : '';
  const sectionsError = sectionsQuery.isError ? cmsErrorMessage(sectionsQuery.error, 'CMS sections could not be loaded') : '';

  return (
    <div className="space-y-4">
      <Breadcrumbs items={cmsBreadcrumbs(page?.title ?? 'Page Editor')} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin/cms/pages" className="text-sm font-medium text-primary hover:text-primary/80">
          Back to Pages
        </Link>
        {page && canManageCms ? (
          <Button variant="secondary" onClick={togglePublish} loading={patchPage.isPending}>
            {page.isPublished ? 'Unpublish' : 'Publish'}
          </Button>
        ) : null}
      </div>

      {feedback ? <FeedbackMessage type={feedback.type} message={feedback.message} /> : null}

      {pageQuery.isLoading ? (
        <div className="rounded-xl border border-border p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-10 rounded-lg bg-surface" />
            <div className="h-28 rounded-lg bg-surface" />
          </div>
        </div>
      ) : null}

      {pageQuery.isError ? <FeedbackMessage type="error" message={pageError} /> : null}

      {page ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.8fr)]">
          <div className="space-y-4">
            <Card title="Page Details" subtitle="Title, slug, metadata, and publish status">
              {canManageCms ? (
                <CmsPageForm
                  values={pageFormValues}
                  loading={updatePage.isPending}
                  submitLabel="Save page"
                  submitError={pageFormError}
                  onSubmit={savePage}
                />
              ) : (
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <p>
                    <span className="font-medium text-foreground">Title:</span> {page.title}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Slug:</span> {page.slug}
                  </p>
                </div>
              )}
            </Card>

            <Card
              title="Sections"
              subtitle="Ordered CMS content blocks"
              actions={canManageCms ? <Button onClick={openCreateSection}>Add Section</Button> : null}
            >
              <div className="space-y-4">
                {sectionsQuery.isLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-20 rounded-xl bg-surface" />
                    <div className="h-20 rounded-xl bg-surface" />
                  </div>
                ) : null}

                {sectionsQuery.isError ? <FeedbackMessage type="error" message={sectionsError} /> : null}

                {!sectionsQuery.isLoading && !sectionsQuery.isError && sections.length === 0 ? (
                  <div className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center">
                    <p className="font-medium text-foreground">No sections yet</p>
                    <p className="mt-1 text-sm text-muted">Add a section to start building this page.</p>
                  </div>
                ) : null}

                {!sectionsQuery.isLoading && !sectionsQuery.isError && sections.length > 0 ? (
                  <SectionList
                    sections={sections}
                    canManage={canManageCms}
                    mutationPending={mutationPending}
                    onEdit={openEditSection}
                    onToggleVisibility={changeVisibility}
                    onDelete={removeSection}
                    onReorder={reorder}
                  />
                ) : null}
              </div>
            </Card>
          </div>

          <Card className="xl:sticky xl:top-20 xl:self-start">
            <LivePreviewPane page={page} />
          </Card>
        </div>
      ) : null}

      <SectionEditorPanel
        open={sectionPanelOpen}
        section={editingSection}
        nextSortOrder={nextSortOrder}
        loading={createSection.isPending || updateSection.isPending}
        submitError={sectionFormError}
        onClose={closeSectionPanel}
        onSubmit={saveSection}
      />
    </div>
  );
}
