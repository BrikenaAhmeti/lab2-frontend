import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PublicHomePage from '@/pages/public/PublicHomePage';
import PublicDepartmentsPage from '@/pages/public/PublicDepartmentsPage';
import PublicDoctorsPage from '@/pages/public/PublicDoctorsPage';
import PublicServicesPage from '@/pages/public/PublicServicesPage';
import PublicContactPage from '@/pages/public/PublicContactPage';
import { cmsApi, type CmsBanner, type CmsPage, type CmsSection } from '@/lib/api/cms-api';
import { departmentsApi, type DepartmentRecord } from '@/lib/api/departments-api';
import { servicesApi, type ServiceRecord } from '@/lib/api/services-api';
import { staffApi, type StaffRecord } from '@/lib/api/staff-api';
import { contactApi, type ContactMessageView } from '@/lib/api/contact-api';
import { settingsApi } from '@/lib/api/settings-api';

vi.mock('@/lib/api/cms-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/cms-api')>('@/lib/api/cms-api');

  return {
    ...actual,
    cmsApi: {
      ...actual.cmsApi,
      getPublicPage: vi.fn(),
      listPublicBanners: vi.fn(),
    },
  };
});

vi.mock('@/lib/api/departments-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/departments-api')>('@/lib/api/departments-api');

  return {
    ...actual,
    departmentsApi: {
      ...actual.departmentsApi,
      publicList: vi.fn(),
    },
  };
});

vi.mock('@/lib/api/services-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/services-api')>('@/lib/api/services-api');

  return {
    ...actual,
    servicesApi: {
      ...actual.servicesApi,
      publicList: vi.fn(),
    },
  };
});

vi.mock('@/lib/api/staff-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/staff-api')>('@/lib/api/staff-api');

  return {
    ...actual,
    staffApi: {
      ...actual.staffApi,
      publicList: vi.fn(),
      get: vi.fn(),
      preview: vi.fn(),
    },
  };
});

vi.mock('@/lib/api/contact-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/contact-api')>('@/lib/api/contact-api');

  return {
    ...actual,
    contactApi: {
      ...actual.contactApi,
      submit: vi.fn(),
    },
  };
});

vi.mock('@/lib/api/settings-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/settings-api')>('@/lib/api/settings-api');

  return {
    ...actual,
    settingsApi: {
      ...actual.settingsApi,
      publicList: vi.fn(),
    },
  };
});

const section = (slug: string, type: CmsSection['type'] = 'HERO'): CmsSection => ({
  id: `${slug}-section`,
  pageId: `${slug}-page`,
  type,
  title: `${slug} title`,
  subtitle: `${slug} subtitle`,
  body: `${slug} body`,
  imageUrl: null,
  content: null,
  sortOrder: 0,
  isVisible: true,
  createdAt: '2026-05-26T00:00:00.000Z',
  updatedAt: '2026-05-26T00:00:00.000Z',
});

const page = (slug: string, sections: CmsSection[] = [section(slug)]): CmsPage => ({
  id: `${slug}-page`,
  slug,
  title: `${slug} page`,
  metaTitle: `${slug} meta`,
  metaDescription: `${slug} description`,
  isPublished: true,
  sections,
  createdAt: '2026-05-26T00:00:00.000Z',
  updatedAt: '2026-05-26T00:00:00.000Z',
});

const banner: CmsBanner = {
  id: 'banner-1',
  title: 'Clinic hours',
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

const department: DepartmentRecord = {
  id: '8d1dbd2c-b5c4-4d8f-b75b-e8a2dce8f30e',
  name: 'Cardiology',
  description: 'Heart care',
  floor: '2',
  phoneExtension: '210',
  operatingHours: {
    monday: { isOpen: true, startTime: '08:00', endTime: '16:00' },
    tuesday: { isOpen: true, startTime: '08:00', endTime: '16:00' },
  },
  isActive: true,
  sortOrder: 0,
  createdAt: '2026-05-26T00:00:00.000Z',
  updatedAt: '2026-05-26T00:00:00.000Z',
};

const service: ServiceRecord = {
  id: '7d6bc4ce-6a73-48cd-b27d-06fae03c8f67',
  departmentId: department.id,
  department: {
    id: department.id,
    name: department.name,
    isActive: true,
  },
  name: 'Initial Consultation',
  description: 'Standard first visit',
  defaultDurationMinutes: 30,
  defaultPrice: 50,
  isActive: true,
  sortOrder: 0,
  createdAt: '2026-05-26T00:00:00.000Z',
  updatedAt: '2026-05-26T00:00:00.000Z',
};

const staff: StaffRecord = {
  id: '42b2c8e0-4df7-4df1-b951-fb96b0b8cf86',
  userId: '9dbd7a27-0b3c-4939-8a2f-1f20fd1ef6ee',
  employeeCode: 'DR-001',
  specialization: 'Cardiology',
  bio: 'Heart care specialist',
  employmentStatus: 'ACTIVE',
  positionType: {
    id: 'position-1',
    name: 'Doctor',
  },
  departments: [
    {
      id: 'assignment-1',
      departmentId: department.id,
      isPrimary: true,
      department: {
        id: department.id,
        name: department.name,
        isActive: true,
      },
    },
  ],
};

const contactMessage: ContactMessageView = {
  id: '9d8ae239-d774-45d1-b8c0-c7f566e0e604',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '+38344111222',
  subject: 'Appointment question',
  message: 'Can I book?',
  status: 'new',
  replyNotes: null,
  repliedAt: null,
  createdAt: '2026-05-26T00:00:00.000Z',
  updatedAt: '2026-05-26T00:00:00.000Z',
};

const publicSettingsResponse = {
  Facility: [
    {
      key: 'facility_name',
      label: 'Facility name',
      category: 'Facility',
      value: 'North Clinic',
      description: null,
    },
    {
      key: 'facility_tagline',
      label: 'Facility tagline',
      category: 'Facility',
      value: 'Care nearby',
      description: null,
    },
    {
      key: 'facility_description',
      label: 'Facility description',
      category: 'Facility',
      value: 'Live facility details from settings.',
      description: null,
    },
    {
      key: 'contact_phone',
      label: 'Contact phone',
      category: 'Facility',
      value: '+383 38 100 200',
      description: null,
    },
    {
      key: 'contact_email',
      label: 'Contact email',
      category: 'Facility',
      value: 'hello@north.test',
      description: null,
    },
    {
      key: 'working_hours',
      label: 'Working hours',
      category: 'Facility',
      value: {
        monday: { isOpen: true, startTime: '08:00', endTime: '17:00' },
        tuesday: { isOpen: true, startTime: '08:00', endTime: '17:00' },
        sunday: { isOpen: false, startTime: null, endTime: null },
      },
      description: null,
    },
  ],
};

function renderPublic(element: ReactNode, initialEntry = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>{element}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Public website', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cmsApi.getPublicPage).mockImplementation((slug) => Promise.resolve(page(slug)));
    vi.mocked(cmsApi.listPublicBanners).mockResolvedValue([]);
    vi.mocked(settingsApi.publicList).mockResolvedValue(publicSettingsResponse);
    vi.mocked(departmentsApi.publicList).mockResolvedValue({
      items: [department],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    vi.mocked(servicesApi.publicList).mockResolvedValue({
      items: [service],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    vi.mocked(staffApi.publicList).mockResolvedValue({
      items: [staff],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });
    vi.mocked(staffApi.get).mockResolvedValue(staff);
    vi.mocked(staffApi.preview).mockResolvedValue(staff);
    vi.mocked(contactApi.submit).mockResolvedValue(contactMessage);
  });

  it('renders CMS home content with active banners and SEO tags', async () => {
    vi.mocked(cmsApi.listPublicBanners).mockResolvedValue([banner]);

    renderPublic(<PublicHomePage />);

    expect(await screen.findByRole('heading', { name: 'home title' })).toBeInTheDocument();
    expect(await screen.findByText('Open daily')).toBeInTheDocument();

    expect((await screen.findAllByText('North Clinic')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Care nearby').length).toBeGreaterThan(0);

    await waitFor(() => expect(document.title).toBe('home meta | North Clinic'));
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('home description');
    expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe('home description');
  });

  it('loads active departments from the public catalog view', async () => {
    renderPublic(<PublicDepartmentsPage />, '/departments');

    expect(await screen.findByText('Cardiology')).toBeInTheDocument();
    expect(screen.getByText('Heart care')).toBeInTheDocument();
    expect(screen.getByText('Monday: 08:00 to 16:00')).toBeInTheDocument();
    expect(departmentsApi.publicList).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true, limit: 100 }),
      expect.any(Function)
    );
  });

  it('loads services with the selected department filter', async () => {
    renderPublic(<PublicServicesPage />, `/services?departmentId=${department.id}`);

    expect(await screen.findByText('Initial Consultation')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(servicesApi.publicList).toHaveBeenCalledWith(
      expect.objectContaining({ departmentId: department.id, isActive: true }),
      expect.any(Function)
    );
  });

  it('filters public doctors by department', async () => {
    renderPublic(<PublicDoctorsPage />, '/doctors');

    expect(await screen.findByText('DR-001')).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('All departments'), { target: { value: department.id } });

    await waitFor(() =>
      expect(staffApi.publicList).toHaveBeenLastCalledWith(
        expect.objectContaining({ departmentId: department.id, page: 1, limit: 50 })
      )
    );
  });

  it('renders a protected staff preview from the admin preview URL', async () => {
    const previewStaff: StaffRecord = {
      ...staff,
      id: 'preview-staff-1',
      employeeCode: 'ADM-001',
      isPublicProfile: false,
      user: {
        id: 'preview-user-1',
        firstName: 'Daniel',
        lastName: 'Okafor',
        name: 'Daniel Okafor',
        email: 'daniel.okafor@medsphere.local',
      },
      positionType: {
        id: 'position-admin',
        name: 'Administrator',
      },
    };
    vi.mocked(staffApi.publicList).mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 50, total: 0, totalPages: 1 },
    });
    vi.mocked(staffApi.preview).mockResolvedValue(previewStaff);

    renderPublic(<PublicDoctorsPage />, `/doctors?staffId=${previewStaff.id}&preview=staff`);

    expect(await screen.findByText('Daniel Okafor')).toBeInTheDocument();
    expect(screen.getByText('Staff preview')).toBeInTheDocument();
    expect(staffApi.preview).toHaveBeenCalledWith(previewStaff.id);
  });

  it('submits the public contact form with the backend payload', async () => {
    renderPublic(<PublicContactPage />, '/contact');

    expect((await screen.findAllByText('+383 38 100 200')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('hello@north.test').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Monday: 08:00 to 17:00/).length).toBeGreaterThan(0);

    fireEvent.change(await screen.findByLabelText('Name'), { target: { value: ' Ada Lovelace ' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: ' ada@example.com ' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: ' +38344111222 ' } });
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: ' Appointment question ' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: ' Can I book? ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }));

    await waitFor(() =>
      expect(contactApi.submit).toHaveBeenCalledWith({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        phone: '+38344111222',
        subject: 'Appointment question',
        message: 'Can I book?',
      })
    );
  });
});
