import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Building2, Edit2, Plus, Save, Search, ServerCog, X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useTheme } from '../context/ThemeContext';

type TenantRecord = {
  id: number;
  companyId: number;
  name: string;
  description: string;
  createdAt: string;
  company: null | {
    id: number;
    name: string;
  };
};

type TenantsResponse = {
  tenants?: TenantRecord[];
};

type UpdateTenantResponse = {
  tenant?: TenantRecord;
  error?: string;
};

type CreateTenantResponse = {
  tenant?: TenantRecord;
  error?: string;
};

type TenantsListUIProps = {
  token: string;
  onUnauthorized: () => void;
};


export default function TenantsListUI({ token, onUnauthorized }: TenantsListUIProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const companyId = params.get('companyId') || '';
  const companyName = params.get('companyName') || '';
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [editingTenantId, setEditingTenantId] = useState<number | null>(null);
  const [tenantForm, setTenantForm] = useState({ name: '', description: '' });
  const [isSavingTenant, setIsSavingTenant] = useState(false);
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [addTenantStep, setAddTenantStep] = useState(1);
  const [isCreatingTenant, setIsCreatingTenant] = useState(false);
  const [addTenantForm, setAddTenantForm] = useState({
    companyId: companyId || '',
    name: '',
    description: '',
  });
  const [addTenantErrors, setAddTenantErrors] = useState<{ companyId?: string; name?: string; description?: string }>({});

  useEffect(() => {
    const loadTenants = async () => {
      try {
        setLoading(true);
        setError('');

        const endpoint = companyId
          ? `${API_BASE_URL}/api/tenants?companyId=${encodeURIComponent(companyId)}`
          : `${API_BASE_URL}/api/tenants`;

        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast.error('Session expired. Please log in again.');
            onUnauthorized();
            return;
          }

          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to load tenants');
        }

        const payload = (await response.json()) as TenantsResponse;
        setTenants(Array.isArray(payload.tenants) ? payload.tenants : []);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Failed to load tenants';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadTenants();
  }, [onUnauthorized, token, companyId]);

  const filteredTenants = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return tenants;
    }

    return tenants.filter((item) => {
      return (
        String(item.id).includes(keyword)
        || String(item.companyId).includes(keyword)
        || item.name.toLowerCase().includes(keyword)
        || item.description.toLowerCase().includes(keyword)
        || String(item.company?.name || '').toLowerCase().includes(keyword)
      );
    });
  }, [tenants, searchTerm]);

  const startEditTenant = (tenant: TenantRecord) => {
    setEditingTenantId(tenant.id);
    setTenantForm({
      name: tenant.name,
      description: tenant.description || '',
    });
  };

  const cancelEditTenant = () => {
    setEditingTenantId(null);
    setTenantForm({ name: '', description: '' });
    setIsSavingTenant(false);
  };

  const saveTenantEdit = async (tenantId: number) => {
    try {
      const trimmedName = tenantForm.name.trim();
      const trimmedDescription = tenantForm.description.trim();

      if (!trimmedName) {
        toast.error('Tenant name is required');
        return;
      }

      setIsSavingTenant(true);
      const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          description: trimmedDescription,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
          onUnauthorized();
          return;
        }

        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to update tenant');
      }

      const payload = (await response.json()) as UpdateTenantResponse;
      if (!payload.tenant) {
        throw new Error('Updated tenant payload missing');
      }

      setTenants((prev) => prev.map((row) => (row.id === tenantId ? payload.tenant as TenantRecord : row)));
      cancelEditTenant();
      toast.success('Tenant updated');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Failed to update tenant';
      toast.error(message);
    } finally {
      setIsSavingTenant(false);
    }
  };

  const addTenantWizardSteps = [
    { step: 1, title: 'Step 1: Company id', field: 'companyId' as const },
    { step: 2, title: 'Step 2: Tenant name', field: 'name' as const },
    { step: 3, title: 'Step 3: Description', field: 'description' as const },
  ];

  const openAddTenantModal = () => {
    setAddTenantForm({
      companyId: companyId || '',
      name: '',
      description: '',
    });
    setAddTenantErrors({});
    setAddTenantStep(1);
    setIsAddTenantModalOpen(true);
  };

  const closeAddTenantModal = () => {
    setIsAddTenantModalOpen(false);
    setAddTenantErrors({});
    setAddTenantStep(1);
    setIsCreatingTenant(false);
  };

  const validateAddTenantStep = (step: number): boolean => {
    const errors: { companyId?: string; name?: string; description?: string } = {};

    if (step === 1) {
      const parsedCompanyId = Number(addTenantForm.companyId);
      if (!Number.isFinite(parsedCompanyId) || parsedCompanyId <= 0) {
        errors.companyId = 'Company id must be a positive number';
      }
    }

    if (step === 2) {
      if (!addTenantForm.name.trim()) {
        errors.name = 'Tenant name is required';
      }
    }

    setAddTenantErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddTenantNext = () => {
    if (!validateAddTenantStep(addTenantStep)) {
      return;
    }

    setAddTenantStep((prev) => Math.min(prev + 1, addTenantWizardSteps.length));
  };

  const handleAddTenantBack = () => {
    setAddTenantErrors({});
    setAddTenantStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCreateTenant = async () => {
    if (!validateAddTenantStep(1) || !validateAddTenantStep(2)) {
      return;
    }

    try {
      setIsCreatingTenant(true);
      const response = await fetch(`${API_BASE_URL}/api/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId: Number(addTenantForm.companyId),
          name: addTenantForm.name.trim(),
          description: addTenantForm.description.trim(),
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
          onUnauthorized();
          return;
        }

        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to create tenant');
      }

      const payload = (await response.json()) as CreateTenantResponse;
      if (!payload.tenant) {
        throw new Error('Created tenant payload missing');
      }

      const createdTenant = payload.tenant;
      const activeCompanyFilter = Number(companyId);
      const shouldIncludeInView = !Number.isFinite(activeCompanyFilter) || createdTenant.companyId === activeCompanyFilter;

      if (shouldIncludeInView) {
        setTenants((prev) => [createdTenant, ...prev]);
      }

      closeAddTenantModal();
      toast.success('Tenant added');
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Failed to create tenant';
      toast.error(message);
    } finally {
      setIsCreatingTenant(false);
    }
  };

  return (
    <div className="theme-page min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.12),_transparent_28%),linear-gradient(180deg,_#07111f_0%,_#0b1729_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6">
        <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate('/companies')}
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
            >
              <ArrowLeft size={14} />
              Back to Company List
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 shadow-[0_0_18px_rgba(34,197,94,0.22)]">
                <Building2 size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Tenants List</h1>
                <p className="text-sm text-slate-300">
                  {companyName ? `Showing tenant records for ${companyName}.` : 'View tenant records stored in the database.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full max-w-2xl items-center gap-2">
            <label className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-slate-300 shadow-inner shadow-black/20 focus-within:border-emerald-400/40 focus-within:bg-black/30">
              <Search size={16} className="shrink-0 text-emerald-300" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search id, company, name, description"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>

            <button
              type="button"
              onClick={openAddTenantModal}
              className="h-[42px] px-3 rounded-xl border flex items-center gap-2 text-sm transition-all whitespace-nowrap bg-[#09090B] border-white/10 text-gray-300 hover:text-white hover:border-white/20"
            >
              <Plus size={15} /> Add
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center text-sm text-slate-300">
            Loading tenants...
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center text-sm text-slate-300">
            No tenants found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
            <table className="min-w-full divide-y divide-white/10 text-left">
              <thead className="bg-black/20 text-[11px] uppercase tracking-[0.24em] text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-semibold">ID</th>
                  <th className="px-5 py-4 font-semibold">Company</th>
                  <th className="px-5 py-4 font-semibold">Company ID</th>
                  <th className="px-5 py-4 font-semibold">Name</th>
                  <th className="px-5 py-4 font-semibold">Description</th>
                  <th className="px-5 py-4 font-semibold">CREATED_AT</th>
                  <th className="px-5 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {filteredTenants.map((item) => (
                  <tr key={item.id} className="transition hover:bg-white/5">
                    <td className="px-5 py-4 text-sm font-medium text-white">{item.id}</td>
                    <td className="px-5 py-4 text-sm text-emerald-200">{item.company?.name || 'N/A'}</td>
                    <td className="px-5 py-4 text-sm text-slate-300">{item.companyId}</td>
                    <td className="px-5 py-4 text-sm text-slate-200">
                      {editingTenantId === item.id ? (
                        <input
                          value={tenantForm.name}
                          onChange={(event) => setTenantForm((prev) => ({ ...prev, name: event.target.value }))}
                          className="w-full rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-sm text-white outline-none"
                        />
                      ) : (
                        item.name
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {editingTenantId === item.id ? (
                        <input
                          value={tenantForm.description}
                          onChange={(event) => setTenantForm((prev) => ({ ...prev, description: event.target.value }))}
                          className="w-full rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-sm text-white outline-none"
                        />
                      ) : (
                        item.description || 'No description provided'
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">{item.createdAt ?? '—'}</td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {editingTenantId === item.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => saveTenantEdit(item.id)}
                            disabled={isSavingTenant}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-400/35 bg-emerald-500/12 px-2.5 py-1 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-60"
                          >
                            <Save size={13} /> Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditTenant}
                            disabled={isSavingTenant}
                            className="inline-flex items-center gap-1 rounded-md border border-rose-400/35 bg-rose-500/12 px-2.5 py-1 text-xs font-medium text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
                          >
                            <X size={13} /> Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/sip-configs?tenantId=${item.id}&tenantName=${encodeURIComponent(item.name)}`)}
                            className="peer inline-flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/12 text-cyan-200 transition-all duration-200 hover:bg-cyan-500/20 hover:text-cyan-100 hover:border-cyan-300"
                            aria-label="SIP configurations"
                            title="SIP configurations"
                          >
                            <ServerCog size={13} />
                          </button>
                        <button
                          type="button"
                          onClick={() => startEditTenant(item)}
                            className="peer inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-400/35 bg-emerald-500/12 text-emerald-200 transition-all duration-200 hover:bg-emerald-500/20 hover:text-emerald-100 hover:border-emerald-300"
                            aria-label="Edit tenant"
                            title="Edit tenant"
                        >
                            <Edit2 size={13} />
                        </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAddTenantModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? 'bg-black/65' : 'bg-black/40'}`}>
          <div className={`w-full max-w-2xl rounded-2xl border p-6 ${
            isDark 
              ? 'border-white/10 bg-[#111318] shadow-[0_0_35px_rgba(34,197,94,0.25)]' 
              : 'border-gray-200 bg-white shadow-[0_0_25px_rgba(34,197,94,0.15)]'
          }`}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add a new tenant</h4>
              <button
                type="button"
                onClick={closeAddTenantModal}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-md border transition-all ${
                  isDark 
                    ? 'border-white/10 text-gray-300 hover:bg-white/5 hover:text-white' 
                    : 'border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
                aria-label="Close add tenant modal"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className={`mb-5 rounded-xl border px-4 py-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between gap-2 text-[12px] font-semibold uppercase tracking-[0.2em]">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Step {addTenantStep} of {addTenantWizardSteps.length}</span>
                <span className={isDark ? 'text-emerald-200' : 'text-emerald-600'}>{addTenantWizardSteps[addTenantStep - 1]?.title}</span>
              </div>
              <div className="mt-4 flex gap-2">
                {addTenantWizardSteps.map((step) => (
                  <div
                    key={step.step}
                    className={`h-2.5 flex-1 rounded-full transition-colors ${
                      addTenantStep >= step.step 
                        ? isDark ? 'bg-emerald-500/80' : 'bg-emerald-500' 
                        : isDark ? 'bg-white/10' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {addTenantStep === 1 && (
              <div>
                <label htmlFor="addTenantCompanyId" className="text-[13px] text-gray-300">Company ID *</label>
                <input
                  id="addTenantCompanyId"
                  type="number"
                  autoFocus
                  value={addTenantForm.companyId}
                  onChange={(event) => setAddTenantForm((prev) => ({ ...prev, companyId: event.target.value }))}
                  className={`mt-2 w-full rounded-xl border px-4 py-3 text-base text-gray-200 outline-none ${
                    addTenantErrors.companyId
                      ? 'border-red-500/50 bg-red-500/10'
                      : 'border-white/10 bg-[#09090B] focus:border-emerald-500/50'
                  }`}
                  placeholder="Company id"
                />
                {addTenantErrors.companyId && <p className="mt-2 text-xs text-red-400">{addTenantErrors.companyId}</p>}
              </div>
            )}

            {addTenantStep === 2 && (
              <div>
                <label htmlFor="addTenantName" className="text-[13px] text-gray-300">Tenant Name *</label>
                <input
                  id="addTenantName"
                  type="text"
                  autoFocus
                  value={addTenantForm.name}
                  onChange={(event) => setAddTenantForm((prev) => ({ ...prev, name: event.target.value }))}
                  className={`mt-2 w-full rounded-xl border px-4 py-3 text-base text-gray-200 outline-none ${
                    addTenantErrors.name
                      ? 'border-red-500/50 bg-red-500/10'
                      : 'border-white/10 bg-[#09090B] focus:border-emerald-500/50'
                  }`}
                  placeholder="Tenant name"
                />
                {addTenantErrors.name && <p className="mt-2 text-xs text-red-400">{addTenantErrors.name}</p>}
              </div>
            )}

            {addTenantStep === 3 && (
              <div>
                <label htmlFor="addTenantDescription" className="text-[13px] text-gray-300">Description</label>
                <textarea
                  id="addTenantDescription"
                  rows={4}
                  autoFocus
                  value={addTenantForm.description}
                  onChange={(event) => setAddTenantForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#09090B] px-4 py-3 text-base text-gray-200 outline-none focus:border-emerald-500/50"
                  placeholder="Tenant description"
                />
              </div>
            )}

            <div className="pt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeAddTenantModal}
                className={`rounded-xl border px-4 py-3 text-sm transition-all ${
                  isDark 
                    ? 'border-white/10 text-gray-300 hover:bg-white/5 hover:text-white' 
                    : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Cancel
              </button>

              {addTenantStep > 1 && (
                <button
                  type="button"
                  onClick={handleAddTenantBack}
                  className={`rounded-xl border px-4 py-3 text-sm transition-all ${
                    isDark 
                      ? 'border-white/10 text-gray-300 hover:bg-white/5 hover:text-white' 
                      : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  Back
                </button>
              )}

              {addTenantStep < addTenantWizardSteps.length ? (
                <button
                  type="button"
                  onClick={handleAddTenantNext}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                    isDark 
                      ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25' 
                      : 'border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateTenant}
                  disabled={isCreatingTenant}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                    isDark 
                      ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25' 
                      : 'border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  } disabled:opacity-60`}
                >
                  {isCreatingTenant ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
