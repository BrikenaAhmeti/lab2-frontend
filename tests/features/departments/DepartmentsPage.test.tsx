import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DepartmentsPage from '@/features/departments/pages/DepartmentsPage';
import { departmentsApi, type DepartmentRecord } from '@/lib/api/departments-api';

vi.mock('@/lib/api/departments-api', () => ({
  departmentsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
  },
}));

const primaryCare: DepartmentRecord = {
  id: 'department-1',
  name: 'Primary Care',
  description: 'Family medicine, triage, and follow-up care',
  floor: '1',
  phoneExtension: '101',
  operatingHours: {
    weekdays: '08:00-18:00',
    saturday: '09:00-13:00',
  },
  isActive: true,
  sortOrder: 1,
  createdAt: '2026-01-01T08:00:00.000Z',
  updatedAt: '2026-01-02T09:30:00.000Z',
};

const departmentsResponse = {
  items: [primaryCare],
  meta: {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
  },
};

function renderDepartmentsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/departments']}>
        <DepartmentsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function inputById(id: string) {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`Missing input: ${id}`);
  }
  return element;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function dateInVisibleCalendarMonth(day: number) {
  const today = new Date();
  return formatDateInput(new Date(today.getFullYear(), today.getMonth(), day));
}

function clickCalendarDay(groupName: string, day: number) {
  const calendar = screen.getByRole('group', { name: groupName });
  fireEvent.click(within(calendar).getByRole('button', { name: new RegExp(`Choose.*\\b${day}\\b`) }));
}

describe('DepartmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(departmentsApi.list).mockResolvedValue(departmentsResponse);
  });

  it('edits operating hours with day controls instead of raw JSON', async () => {
    renderDepartmentsPage();

    expect(await screen.findByText('Primary Care')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.queryByText('Operating hours JSON')).not.toBeInTheDocument();
    expect(inputById('department-hours-monday-start')).toHaveValue('08:00');
    expect(inputById('department-hours-friday-end')).toHaveValue('18:00');
    expect(inputById('department-hours-saturday-start')).toHaveValue('09:00');
    expect(inputById('department-hours-saturday-end')).toHaveValue('13:00');
  });

  it('creates a department with structured operating hours', async () => {
    vi.mocked(departmentsApi.list).mockResolvedValue({
      ...departmentsResponse,
      items: [],
      meta: { ...departmentsResponse.meta, total: 0 },
    });
    vi.mocked(departmentsApi.create).mockResolvedValue({
      ...primaryCare,
      id: 'department-2',
      name: 'Urgent Care',
    });

    renderDepartmentsPage();

    expect(await screen.findByText('No departments found')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add department' }));
    fireEvent.change(inputById('department-name'), { target: { value: 'Urgent Care' } });
    fireEvent.click(screen.getByRole('button', { name: 'Weekdays' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create department' }));

    await waitFor(() =>
      expect(departmentsApi.create).toHaveBeenCalledWith({
        name: 'Urgent Care',
        description: null,
        floor: null,
        phoneExtension: null,
        operatingHours: expect.objectContaining({
          monday: { isOpen: true, startTime: '08:00', endTime: '18:00' },
          friday: { isOpen: true, startTime: '08:00', endTime: '18:00' },
          sunday: { isOpen: false, startTime: null, endTime: null },
        }),
        sortOrder: 0,
        isActive: true,
      })
    );
  });

  it('opens department details from the table', async () => {
    renderDepartmentsPage();

    expect(await screen.findByText('Primary Care')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Details' }));

    const dialog = screen.getByRole('dialog', { name: 'Department details' });
    expect(within(dialog).getByText('Family medicine, triage, and follow-up care')).toBeInTheDocument();
    expect(within(dialog).getByText('Monday: 08:00 to 18:00')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'View services' })).toHaveAttribute(
      'href',
      '/admin/organization/services?departmentId=department-1'
    );
  });

  it('requests backend pages and row limits from pagination controls', async () => {
    vi.mocked(departmentsApi.list).mockImplementation(async (params) => ({
      ...departmentsResponse,
      meta: {
        page: 1,
        limit: params.limit ?? 10,
        total: 18,
        totalPages: params.limit === 25 ? 1 : 2,
      },
    }));

    renderDepartmentsPage();

    expect(await screen.findByText('Primary Care')).toBeInTheDocument();
    expect(departmentsApi.list).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: undefined,
      isActive: undefined,
      sortBy: 'createdAt',
      sortDirection: 'desc',
      openAt: undefined,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

    await waitFor(() =>
      expect(departmentsApi.list).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: undefined,
        isActive: undefined,
        sortBy: 'createdAt',
        sortDirection: 'desc',
        openAt: undefined,
      })
    );
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');

    fireEvent.change(screen.getByLabelText('Rows'), { target: { value: '25' } });

    await waitFor(() =>
      expect(departmentsApi.list).toHaveBeenCalledWith({
        page: 1,
        limit: 25,
        search: undefined,
        isActive: undefined,
        sortBy: 'createdAt',
        sortDirection: 'desc',
        openAt: undefined,
      })
    );
  });

  it('applies sort and single open-hours date time filters', async () => {
    renderDepartmentsPage();

    expect(await screen.findByText('Primary Care')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Sort'), { target: { value: 'name:asc' } });
    fireEvent.click(screen.getByRole('button', { name: /Open hours/i }));
    clickCalendarDay('Date', 5);
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '10:30' } });

    await waitFor(() =>
      expect(departmentsApi.list).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        isActive: undefined,
        sortBy: 'name',
        sortDirection: 'asc',
        openAt: `${dateInVisibleCalendarMonth(5)}T10:30`,
      })
    );

    expect(screen.getByText('Sort: Name A-Z')).toBeInTheDocument();
    expect(screen.getByText(/Open:/)).toBeInTheDocument();
  });

  it('applies open-hours date time range filters', async () => {
    renderDepartmentsPage();

    expect(await screen.findByText('Primary Care')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Open hours/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Range' }));
    clickCalendarDay('Start date', 5);
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '09:00' } });
    clickCalendarDay('End date', 7);
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '15:30' } });

    await waitFor(() =>
      expect(departmentsApi.list).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        isActive: undefined,
        sortBy: 'createdAt',
        sortDirection: 'desc',
        openFrom: `${dateInVisibleCalendarMonth(5)}T09:00`,
        openTo: `${dateInVisibleCalendarMonth(7)}T15:30`,
      })
    );

    expect(screen.getByText(/Open:/)).toBeInTheDocument();
  });
});
