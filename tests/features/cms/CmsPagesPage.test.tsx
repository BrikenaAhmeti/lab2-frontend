import { Provider } from 'react-redux';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CmsPagesPage from '@/features/cms/pages/CmsPagesPage';
import CmsPageEditorPage from '@/features/cms/pages/CmsPageEditorPage';
import CmsBannersPage from '@/features/cms/pages/CmsBannersPage';
import { store } from '@/app/store';
import { clearSession, setSession } from '@/features/auth/authSlice';
import { cmsApi } from '@/lib/api/cms-api';

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

vi.mock('@/lib/api/cms-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/cms-api')>();

  return {
    ...actual,
    cmsApi: {
      listPages: vi.fn(),
      getPage: vi.fn(),
      createPage: vi.fn(),
      updatePage: vi.fn(),
      deletePage: vi.fn(),
      listSections: vi.fn(),
      createSection: vi.fn(),
      updateSection: vi.fn(),
      toggleSectionVisibility: vi.fn(),
      reorderSections: vi.fn(),
      deleteSection: vi.fn(),
      listBanners: vi.fn(),
      createBanner: vi.fn(),
      updateBanner: vi.fn(),
      deleteBanner: vi.fn(),
      getPublicPage: vi.fn(),
      listPublicBanners: vi.fn(),
    },
  };
});

const page = {
  id: 'page-1',
  slug: 'home',
  title: 'Home',
  metaTitle: null,
  metaDescription: 'Welcome',
  isPublished: true,
  createdAt: '2026-05-26T00:00:00.000Z',
  updatedAt: '2026-05-26T00:00:00.000Z',
  sections: [
    {
      id: 'section-1',
      pageId: 'page-1',
      type: 'HERO' as const,
      title: 'Intro',
      subtitle: null,
      body: 'Welcome to MedSphere',
      imageUrl: null,
      content: null,
      sortOrder: 0,
      isVisible: true,
      createdAt: '2026-05-26T00:00:00.000Z',
      updatedAt: '2026-05-26T00:00:00.000Z',
    },
    {
      id: 'section-2',
      pageId: 'page-1',
      type: 'TEXT' as const,
      title: 'Care',
      subtitle: null,
      body: 'Simple care',
      imageUrl: null,
      content: null,
      sortOrder: 1,
      isVisible: true,
      createdAt: '2026-05-26T00:00:00.000Z',
      updatedAt: '2026-05-26T00:00:00.000Z',
    },
  ],
};

const banner = {
  id: 'banner-1',
  title: 'Clinic Hours',
  message: 'Open daily',
  imageUrl: null,
  linkUrl: null,
  startDate: null,
  endDate: null,
  isActive: true,
  sortOrder: 0,
  createdAt: '2026-05-26T00:00:00.000Z',
  updatedAt: '2026-05-26T00:00:00.000Z',
};

function renderCms(initialEntry: string, element: ReactNode, path: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path={path} element={element} />
            <Route path="/admin/cms/pages/:id" element={<div>Editor route</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

function setCmsSession() {
  store.dispatch(clearSession());
  store.dispatch(
    setSession({
      accessToken: 'access',
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['Super Admin'],
        permissions: ['cms:edit'],
      },
    })
  );
}

function inputById(id: string) {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    throw new Error(`Missing input: ${id}`);
  }
  return element;
}

describe('CMS admin pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCmsSession();
    vi.mocked(cmsApi.listPages).mockResolvedValue([page]);
    vi.mocked(cmsApi.getPage).mockResolvedValue(page);
    vi.mocked(cmsApi.listSections).mockResolvedValue(page.sections);
    vi.mocked(cmsApi.getPublicPage).mockResolvedValue(page);
    vi.mocked(cmsApi.listBanners).mockResolvedValue([banner]);
  });

  it('lists CMS pages and creates a page with the backend payload', async () => {
    vi.mocked(cmsApi.createPage).mockResolvedValue({
      ...page,
      id: 'page-2',
      title: 'About',
      slug: 'about',
      sections: [],
    });

    renderCms('/admin/cms/pages', <CmsPagesPage />, '/admin/cms/pages');

    expect(await screen.findByText('Home')).toBeInTheDocument();
    expect(screen.getByText('home')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add Page' }));
    fireEvent.change(inputById('cms-page-title'), { target: { value: ' About ' } });
    fireEvent.change(inputById('cms-page-slug'), { target: { value: ' about ' } });
    fireEvent.change(inputById('cms-page-meta-description'), { target: { value: ' About clinic ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create page' }));

    await waitFor(() =>
      expect(cmsApi.createPage).toHaveBeenCalledWith({
        title: 'About',
        slug: 'about',
        metaTitle: null,
        metaDescription: 'About clinic',
        isPublished: false,
      })
    );
  });

  it('reorders and hides sections from the page editor', async () => {
    vi.mocked(cmsApi.reorderSections).mockResolvedValue([...page.sections].reverse());
    vi.mocked(cmsApi.toggleSectionVisibility).mockResolvedValue({ ...page.sections[0], isVisible: false });

    renderCms('/admin/cms/pages/page-1', <CmsPageEditorPage />, '/admin/cms/pages/:id');

    expect((await screen.findAllByText('Intro')).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Move Intro down' }));

    await waitFor(() =>
      expect(cmsApi.reorderSections).toHaveBeenCalledWith('page-1', [
        { id: 'section-2', sortOrder: 0 },
        { id: 'section-1', sortOrder: 1 },
      ])
    );

    fireEvent.click(screen.getByRole('button', { name: 'Hide Intro' }));

    await waitFor(() => expect(cmsApi.toggleSectionVisibility).toHaveBeenCalledWith('page-1', 'section-1', false));
  });

  it('creates banners and toggles active state', async () => {
    vi.mocked(cmsApi.createBanner).mockResolvedValue({
      ...banner,
      id: 'banner-2',
      title: 'Spring Clinic',
    });
    vi.mocked(cmsApi.updateBanner).mockResolvedValue({ ...banner, isActive: false });

    renderCms('/admin/cms/banners', <CmsBannersPage />, '/admin/cms/banners');

    expect(await screen.findByText('Clinic Hours')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add Banner' }));
    fireEvent.change(inputById('cms-banner-title'), { target: { value: ' Spring Clinic ' } });
    fireEvent.change(inputById('cms-banner-message'), { target: { value: ' Visit this week ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create banner' }));

    await waitFor(() =>
      expect(cmsApi.createBanner).toHaveBeenCalledWith({
        title: 'Spring Clinic',
        message: 'Visit this week',
        imageUrl: null,
        linkUrl: null,
        startDate: null,
        endDate: null,
        isActive: true,
        sortOrder: 0,
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));

    await waitFor(() => expect(cmsApi.updateBanner).toHaveBeenCalledWith('banner-1', { isActive: false }));
  });
});
