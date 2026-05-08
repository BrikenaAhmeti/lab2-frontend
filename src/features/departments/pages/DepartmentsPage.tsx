import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import Badge from '@/ui/atoms/Badge';
import { departmentsApi, type DepartmentPayload, type DepartmentRecord } from '@/lib/api/departments-api';

type ActiveFilter = 'all' | 'active' | 'inactive';
type Message = { type: 'success' | 'error'; text: string } | null;

interface DepartmentForm {
  name: string;
  description: string;
  floor: string;
  phoneExtension: string;
  operatingHours: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm: DepartmentForm = {
  name: '',
  description: '',
  floor: '',
  phoneExtension: '',
  operatingHours: '',
  sortOrder: 0,
  isActive: true,
};

function toForm(department: DepartmentRecord): DepartmentForm {
  return {
    name: department.name,
    description: department.description ?? '',
    floor: department.floor ?? '',
    phoneExtension: department.phoneExtension ?? '',
    operatingHours: department.operatingHours ? JSON.stringify(department.operatingHours, null, 2) : '',
    sortOrder: department.sortOrder,
    isActive: department.isActive,
  };
}

function toPayload(form: DepartmentForm): DepartmentPayload {
  return {
    name: form.name,
    description: form.description || null,
    floor: form.floor || null,
    phoneExtension: form.phoneExtension || null,
    operatingHours: form.operatingHours.trim() ? JSON.parse(form.operatingHours) : null,
    sortOrder: form.sortOrder,
    isActive: form.isActive,
  };
}

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DepartmentRecord | null>(null);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState<DepartmentRecord | null>(null);
  const [form, setForm] = useState<DepartmentForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState<Message>(null);

  const departmentsQuery = useQuery({
    queryKey: ['departments', search, activeFilter],
    queryFn: () =>
      departmentsApi.list({
        page: 1,
        limit: 50,
        search: search || undefined,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
      }),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: DepartmentPayload) =>
      editing ? departmentsApi.update(editing.id, payload) : departmentsApi.create(payload),
    onSuccess: async () => {
      setMessage({
        type: 'success',
        text: editing ? 'Department updated successfully.' : 'Department created successfully.',
      });
      await queryClient.invalidateQueries({ queryKey: ['departments'] });
      closeModal();
    },
    onError: () => {
      setMessage({ type: 'error', text: 'Department could not be saved.' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (department: DepartmentRecord) =>
      department.isActive
        ? departmentsApi.deactivate(department.id)
        : departmentsApi.update(department.id, { isActive: true }),
    onSuccess: async () => {
      setMessage({
        type: 'success',
        text: confirmingDeactivate ? 'Department deactivated successfully.' : 'Department activated successfully.',
      });
      setConfirmingDeactivate(null);
      await queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: () => {
      setMessage({ type: 'error', text: 'Department status could not be updated.' });
    },
  });

  const rows = useMemo(() => departmentsQuery.data?.items ?? [], [departmentsQuery.data]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setMessage(null);
    setShowModal(true);
  };

  const openEdit = (department: DepartmentRecord) => {
    setEditing(department);
    setForm(toForm(department));
    setFormError('');
    setMessage(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
  };

  const onSave = () => {
    setFormError('');
    setMessage(null);

    if (!form.name.trim()) {
      setFormError('Department name is required.');
      return;
    }

    if (form.sortOrder < 0) {
      setFormError('Sort order cannot be negative.');
      return;
    }

    try {
      saveMutation.mutate(toPayload(form));
    } catch {
      setFormError('Operating hours must be valid JSON.');
    }
  };

  const onToggle = (department: DepartmentRecord) => {
    setMessage(null);

    if (department.isActive) {
      setConfirmingDeactivate(department);
      return;
    }

    toggleMutation.mutate(department);
  };

  return (
    <Card
      title="Departments"
      subtitle="Search, create, and update departments"
      actions={<Button onClick={openCreate}>Add department</Button>}
    >
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search departments..." />
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {message && (
        <div
          className={
            message.type === 'success'
              ? 'mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success'
              : 'mb-4 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger'
          }
        >
          {message.text}
        </div>
      )}

      {departmentsQuery.isLoading && (
        <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
          Loading departments...
        </div>
      )}
      {departmentsQuery.isError && (
        <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          Departments could not be loaded.
        </div>
      )}

      {!departmentsQuery.isLoading && !departmentsQuery.isError && (
        rows.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center">
            <p className="font-medium text-foreground">No departments found</p>
            <p className="mt-1 text-sm text-muted">Create the first department to start organizing services and staff.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Floor</th>
                  <th className="px-4 py-3 font-medium">Extension</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((department) => (
                  <tr key={department.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{department.name}</p>
                      {department.description && <p className="mt-1 text-xs text-muted">{department.description}</p>}
                    </td>
                    <td className="px-4 py-3">{department.floor || '-'}</td>
                    <td className="px-4 py-3">{department.phoneExtension || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={department.isActive ? 'success' : 'neutral'}>
                        {department.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{department.sortOrder}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(department)}>Edit</Button>
                        <Button
                          size="sm"
                          variant={department.isActive ? 'danger' : 'secondary'}
                          loading={toggleMutation.isPending}
                          onClick={() => onToggle(department)}
                        >
                          {department.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {confirmingDeactivate && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4">
          <div className="panel w-full max-w-md p-5">
            <h3 className="text-lg font-semibold text-foreground">Deactivate department?</h3>
            <p className="mt-2 text-sm text-muted">
              {`This will mark ${confirmingDeactivate.name} as inactive. You can activate it again later.`}
            </p>
            {toggleMutation.isError && <p className="mt-3 text-sm text-danger">Department could not be deactivated.</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmingDeactivate(null)}>Cancel</Button>
              <Button
                variant="danger"
                loading={toggleMutation.isPending}
                onClick={() => toggleMutation.mutate(confirmingDeactivate)}
              >
                Deactivate
              </Button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4">
          <div className="panel w-full max-w-2xl p-5">
            <h3 className="text-lg font-semibold">{editing ? 'Edit department' : 'Add department'}</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Input label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <Input label="Floor" value={form.floor} onChange={(e) => setForm((p) => ({ ...p, floor: e.target.value }))} />
              <Input label="Phone extension" value={form.phoneExtension} onChange={(e) => setForm((p) => ({ ...p, phoneExtension: e.target.value }))} />
              <Input label="Sort order" type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))} />
              <label className="block space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="block space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Operating hours JSON</span>
                <textarea
                  value={form.operatingHours}
                  onChange={(e) => setForm((p) => ({ ...p, operatingHours: e.target.value }))}
                  className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder='{"monday":"08:00-16:00"}'
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-border"
                />
                Active
              </label>
            </div>
            {formError && <p className="mt-3 text-sm text-danger">{formError}</p>}
            {saveMutation.isError && <p className="mt-3 text-sm text-danger">Department could not be saved.</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button loading={saveMutation.isPending} onClick={onSave}>{editing ? 'Save changes' : 'Create department'}</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
