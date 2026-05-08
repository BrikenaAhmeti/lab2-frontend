import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import Badge from '@/ui/atoms/Badge';
import { departmentsApi } from '@/lib/api/departments-api';
import { servicesApi, type ServicePayload, type ServiceRecord } from '@/lib/api/services-api';

type ActiveFilter = 'all' | 'active' | 'inactive';
type Message = { type: 'success' | 'error'; text: string } | null;

interface ServiceForm {
  name: string;
  description: string;
  defaultDurationMinutes: number;
  defaultPrice: number;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm: ServiceForm = {
  name: '',
  description: '',
  defaultDurationMinutes: 30,
  defaultPrice: 0,
  sortOrder: 0,
  isActive: true,
};

function toForm(service: ServiceRecord): ServiceForm {
  return {
    name: service.name,
    description: service.description ?? '',
    defaultDurationMinutes: service.defaultDurationMinutes,
    defaultPrice: Number(service.defaultPrice),
    sortOrder: service.sortOrder,
    isActive: service.isActive,
  };
}

function toPayload(form: ServiceForm, departmentId: string): ServicePayload {
  return {
    departmentId,
    name: form.name,
    description: form.description || null,
    defaultDurationMinutes: form.defaultDurationMinutes,
    defaultPrice: form.defaultPrice,
    sortOrder: form.sortOrder,
    isActive: form.isActive,
  };
}

export default function ServicesPage() {
  const { departmentId = '' } = useParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ServiceRecord | null>(null);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState<ServiceRecord | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState<Message>(null);

  const departmentQuery = useQuery({
    queryKey: ['departments', departmentId],
    queryFn: () => departmentsApi.getById(departmentId),
    enabled: Boolean(departmentId),
  });

  const servicesQuery = useQuery({
    queryKey: ['services', departmentId, search, activeFilter],
    queryFn: () =>
      servicesApi.list({
        page: 1,
        limit: 50,
        search: search || undefined,
        departmentId,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
      }),
    enabled: Boolean(departmentId),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: ServicePayload) =>
      editing ? servicesApi.update(editing.id, payload) : servicesApi.create(payload),
    onSuccess: async () => {
      setMessage({
        type: 'success',
        text: editing ? 'Service updated successfully.' : 'Service created successfully.',
      });
      await queryClient.invalidateQueries({ queryKey: ['services'] });
      closeModal();
    },
    onError: () => {
      setMessage({ type: 'error', text: 'Service could not be saved.' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (service: ServiceRecord) =>
      service.isActive ? servicesApi.deactivate(service.id) : servicesApi.update(service.id, { isActive: true }),
    onSuccess: async () => {
      setMessage({
        type: 'success',
        text: confirmingDeactivate ? 'Service deactivated successfully.' : 'Service activated successfully.',
      });
      setConfirmingDeactivate(null);
      await queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: () => {
      setMessage({ type: 'error', text: 'Service status could not be updated.' });
    },
  });

  const rows = useMemo(() => servicesQuery.data?.items ?? [], [servicesQuery.data]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setMessage(null);
    setShowModal(true);
  };

  const openEdit = (service: ServiceRecord) => {
    setEditing(service);
    setForm(toForm(service));
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

    if (!departmentId) {
      setFormError('Department is required.');
      return;
    }

    if (!form.name.trim()) {
      setFormError('Service name is required.');
      return;
    }

    if (form.defaultDurationMinutes <= 0) {
      setFormError('Default duration must be positive.');
      return;
    }

    if (form.defaultPrice < 0) {
      setFormError('Default price cannot be negative.');
      return;
    }

    if (form.sortOrder < 0) {
      setFormError('Sort order cannot be negative.');
      return;
    }

    saveMutation.mutate(toPayload(form, departmentId));
  };

  const onToggle = (service: ServiceRecord) => {
    setMessage(null);

    if (service.isActive) {
      setConfirmingDeactivate(service);
      return;
    }

    toggleMutation.mutate(service);
  };

  return (
    <Card
      title="Services"
      subtitle={departmentQuery.data ? `Manage services for ${departmentQuery.data.name}` : 'Manage services for this department'}
      actions={<Button onClick={openCreate}>Add service</Button>}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link to="/dashboard/departments">
          <Button variant="ghost" size="sm">Back to departments</Button>
        </Link>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services..." />
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

      {(servicesQuery.isLoading || departmentQuery.isLoading) && (
        <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
          Loading services...
        </div>
      )}
      {(servicesQuery.isError || departmentQuery.isError || !departmentId) && (
        <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          Services could not be loaded.
        </div>
      )}

      {!servicesQuery.isLoading && !departmentQuery.isLoading && !servicesQuery.isError && !departmentQuery.isError && departmentId && (
        rows.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center">
            <p className="font-medium text-foreground">No services found</p>
            <p className="mt-1 text-sm text-muted">Create the first service to prepare appointment scheduling.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((service) => (
                  <tr key={service.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{service.name}</p>
                      {service.description && <p className="mt-1 text-xs text-muted">{service.description}</p>}
                    </td>
                    <td className="px-4 py-3">{service.defaultDurationMinutes} min</td>
                    <td className="px-4 py-3">{Number(service.defaultPrice).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={service.isActive ? 'success' : 'neutral'}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{service.sortOrder}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(service)}>Edit</Button>
                        <Button
                          size="sm"
                          variant={service.isActive ? 'danger' : 'secondary'}
                          loading={toggleMutation.isPending}
                          onClick={() => onToggle(service)}
                        >
                          {service.isActive ? 'Deactivate' : 'Activate'}
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
            <h3 className="text-lg font-semibold text-foreground">Deactivate service?</h3>
            <p className="mt-2 text-sm text-muted">
              {`This will mark ${confirmingDeactivate.name} as inactive. You can activate it again later.`}
            </p>
            {toggleMutation.isError && <p className="mt-3 text-sm text-danger">Service could not be deactivated.</p>}
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
            <h3 className="text-lg font-semibold">{editing ? 'Edit service' : 'Add service'}</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Input label="Department" value={departmentQuery.data?.name ?? ''} disabled />
              <Input label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <Input
                label="Default duration"
                type="number"
                value={form.defaultDurationMinutes}
                onChange={(e) => setForm((p) => ({ ...p, defaultDurationMinutes: Number(e.target.value) }))}
              />
              <Input
                label="Default price"
                type="number"
                step="0.01"
                value={form.defaultPrice}
                onChange={(e) => setForm((p) => ({ ...p, defaultPrice: Number(e.target.value) }))}
              />
              <Input
                label="Sort order"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
              />
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-border"
                />
                Active
              </label>
              <label className="block space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>
            {formError && <p className="mt-3 text-sm text-danger">{formError}</p>}
            {saveMutation.isError && <p className="mt-3 text-sm text-danger">Service could not be saved.</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button loading={saveMutation.isPending} onClick={onSave}>{editing ? 'Save changes' : 'Create service'}</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
