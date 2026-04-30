import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Edit2, Plus, Search, ArrowLeft, Trash2, X, SlidersHorizontal, Check, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { useDrawer } from '../context/DrawerContext';

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
  const { isDrawerOpen } = useDrawer();
  const navigate = useNavigate();
  const location = useLocation();
  const mainMarginClass = isDrawerOpen ? 'md:ml-64' : 'md:ml-20';
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
    <div className={`min-h-screen flex flex-col transition-all duration-300 ${isDark ? 'bg-[#030712] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex-grow">
        <main className={`p-4 ${mainMarginClass} min-h-[calc(100vh-80px)] pt-24 transition-all duration-300`}>
          <div className={`w-full rounded-3xl border p-4 backdrop-blur-xl sm:p-6 transition-all duration-300 ${isDark
              ? 'border-white/10 bg-white/5 shadow-[0_20px_80px_rgba(0,0,0,0.35)]'
              : 'border-gray-200 bg-white shadow-xl shadow-gray-200/50'
            }`}>
            <div className={`mb-6 flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-center lg:justify-between ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <div>
                <button
                  type="button"
                  onClick={() => navigate('/companies')}
                  className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-all duration-300 ${isDark
                      ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20'
                      : 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 hover:border-cyan-300'
                    }`}
                >
                  <ArrowLeft size={14} />
                  Back to Company List
                </button>
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-300 ${isDark
                      ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.18)]'
                      : 'border-cyan-200 bg-cyan-50 text-cyan-600 shadow-sm'
                    }`}>
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {companyName ? `${companyName} Tenants` : 'Tenant List'}
                    </h1>
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                      {companyName
                        ? `Showing tenant records for ${companyName}.`
                        : 'Open tenants from a company row to view company-specific records.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <label className={`flex w-full max-w-md items-center gap-3 rounded-2xl border px-4 py-3 shadow-inner transition-all duration-300 focus-within:ring-2 ${isDark
                    ? 'border-white/10 bg-black/20 text-slate-300 shadow-black/20 focus-within:border-cyan-400/40 focus-within:bg-black/30'
                    : 'border-gray-200 bg-gray-50 text-gray-700 shadow-gray-100 focus-within:border-cyan-500/40 focus-within:bg-white'
                  }`}>
                  <Search size={16} className={`shrink-0 ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`} />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search id, company, name, description"
                    className={`w-full bg-transparent text-sm outline-none placeholder:text-slate-500 ${isDark ? 'text-white' : 'text-gray-900'}`}
                  />
                </label>

                <button
                  type="button"
                  onClick={openAddTenantModal}
                  className={`h-[42px] px-3 rounded-xl border flex items-center gap-2 text-sm transition-all whitespace-nowrap ${isDark
                      ? 'bg-[#09090B] border-white/10 text-gray-300 hover:text-white hover:border-white/20'
                      : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 shadow-sm'
                    }`}
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
              <div className={`rounded-3xl border border-dashed px-6 py-16 text-center text-sm ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                No tenants found.
              </div>
            ) : (
              <div className={`overflow-hidden rounded-3xl border shadow-lg transition-all duration-300 ${isDark ? 'border-white/10 bg-white/5 shadow-black/40' : 'border-gray-200 bg-white shadow-gray-200/20'}`}>
                <div className="overflow-x-auto">
                  <table className={`min-w-full divide-y text-left ${isDark ? 'divide-white/10' : 'divide-gray-100'}`}>
                    <thead className={`text-[11px] uppercase tracking-[0.24em] ${isDark ? 'bg-black/20 text-slate-400' : 'bg-gray-50 text-gray-500'}`}>
                      <tr>
                        <th className="px-5 py-4 font-semibold">ID</th>
                        <th className="px-5 py-4 font-semibold">Company</th>
                        <th className="px-5 py-4 font-semibold whitespace-nowrap">Company ID</th>
                        <th className="px-5 py-4 font-semibold">Name</th>
                        <th className="px-5 py-4 font-semibold">Description</th>
                        <th className="px-5 py-4 font-semibold whitespace-nowrap">Created At</th>
                        <th className="px-5 py-4 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                {filteredTenants.map((item) => (
                  <tr key={item.id} className={`group transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'}`}>
                    <td className={`px-5 py-4 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-900'}`}>{item.id}</td>
                    <td className={`px-5 py-4 text-sm whitespace-nowrap ${isDark ? 'text-cyan-300/80' : 'text-cyan-700'}`}>{item.company?.name || 'N/A'}</td>
                    <td className={`px-5 py-4 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{item.companyId}</td>
                    <td className={`px-5 py-4 text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {editingTenantId === item.id ? (
                        <input
                          value={tenantForm.name}
                          onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                          className={`w-full rounded-lg border px-3 py-1.5 text-sm outline-none transition-all ${isDark
                              ? 'border-white/10 bg-black/20 text-white focus:border-cyan-400/40'
                              : 'border-gray-200 bg-white text-gray-900 focus:border-cyan-500/40 shadow-sm'
                            }`}
                        />
                      ) : (
                        item.name
                      )}
                    </td>
                    <td className={`px-5 py-4 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      {editingTenantId === item.id ? (
                        <input
                          value={tenantForm.description}
                          onChange={(e) => setTenantForm({ ...tenantForm, description: e.target.value })}
                          className={`w-full rounded-lg border px-3 py-1.5 text-sm outline-none transition-all ${isDark
                              ? 'border-white/10 bg-black/20 text-white focus:border-cyan-400/40'
                              : 'border-gray-200 bg-white text-gray-900 focus:border-cyan-500/40 shadow-sm'
                            }`}
                        />
                      ) : (
                        item.description || <span className="italic opacity-40">No description</span>
                      )}
                    </td>
                    <td className={`px-5 py-4 text-sm whitespace-nowrap ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{item.createdAt ?? '—'}</td>
                    <td className="px-5 py-4 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        {editingTenantId === item.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveTenantEdit(item.id)}
                              disabled={isSavingTenant}
                              className={`h-8 rounded-lg px-3 flex items-center gap-2 text-xs font-bold transition-all ${isDark
                                  ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                                  : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm shadow-cyan-600/20'
                                } disabled:opacity-50`}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditTenant}
                              className={`h-8 rounded-lg px-3 flex items-center gap-2 text-xs font-bold transition-all ${isDark
                                  ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => navigate(`/sip-configs?tenantId=${item.id}&tenantName=${encodeURIComponent(item.name)}&companyId=${companyId}&companyName=${encodeURIComponent(companyName)}`)}
                              className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${isDark
                                  ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20'
                                  : 'border-cyan-200 bg-cyan-50 text-cyan-600 hover:bg-cyan-100 hover:border-cyan-300'
                                }`}
                              title="SIP Configurations"
                            >
                              <SlidersHorizontal size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => startEditTenant(item)}
                              className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${isDark
                                  ? 'border-blue-400/30 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20'
                                  : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-300'
                                }`}
                              title="Edit"
                            >
                              <Edit2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {isAddTenantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-xl rounded-3xl border p-5 shadow-2xl ${isDark ? 'border-white/10 bg-[#0B1220]' : 'border-gray-200 bg-white'}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add Tenant</h2>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {companyName ? `Create a tenant for ${companyName}.` : 'Create a new tenant record.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAddTenantModal}
                className={`rounded-full border p-2 transition-all ${isDark
                    ? 'border-white/10 text-slate-300 hover:border-white/20 hover:text-white hover:bg-white/5'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <X size={16} />
              </button>
            </div>

            <div className={`mb-6 rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.2em]">
                <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>Step {addTenantStep} of {addTenantWizardSteps.length}</span>
                <span className={isDark ? 'text-cyan-400' : 'text-cyan-600'}>{addTenantWizardSteps[addTenantStep - 1]?.title}</span>
              </div>
              <div className="mt-3 flex gap-1.5">
                {addTenantWizardSteps.map((step) => (
                  <div
                    key={step.step}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${addTenantStep >= step.step
                        ? isDark ? 'bg-cyan-500/60' : 'bg-cyan-500'
                        : isDark ? 'bg-white/10' : 'bg-gray-200'
                      }`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {addTenantStep === 1 && (
                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Company ID *</label>
                  <input
                    type="number"
                    autoFocus
                    value={addTenantForm.companyId}
                    onChange={(e) => setAddTenantForm({ ...addTenantForm, companyId: e.target.value })}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${isDark
                        ? 'border-white/10 bg-black/20 text-white focus:border-cyan-400/40'
                        : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-cyan-500/40 focus:bg-white'
                      }`}
                    placeholder="Enter company id"
                  />
                  {addTenantErrors.companyId && <p className="text-xs text-rose-400">{addTenantErrors.companyId}</p>}
                </div>
              )}

              {addTenantStep === 2 && (
                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Tenant Name *</label>
                  <input
                    type="text"
                    autoFocus
                    value={addTenantForm.name}
                    onChange={(e) => setAddTenantForm({ ...addTenantForm, name: e.target.value })}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${isDark
                        ? 'border-white/10 bg-black/20 text-white focus:border-cyan-400/40'
                        : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-cyan-500/40 focus:bg-white'
                      }`}
                    placeholder="Enter tenant name"
                  />
                  {addTenantErrors.name && <p className="text-xs text-rose-400">{addTenantErrors.name}</p>}
                </div>
              )}

              {addTenantStep === 3 && (
                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Description</label>
                  <textarea
                    rows={4}
                    autoFocus
                    value={addTenantForm.description}
                    onChange={(e) => setAddTenantForm({ ...addTenantForm, description: e.target.value })}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all resize-none ${isDark
                        ? 'border-white/10 bg-black/20 text-white focus:border-cyan-400/40'
                        : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-cyan-500/40 focus:bg-white'
                      }`}
                    placeholder="Enter tenant description"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={closeAddTenantModal}
                className={`rounded-xl px-6 py-2.5 text-sm font-medium transition-all ${isDark
                    ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 hover:border-gray-300'
                  }`}
              >
                Cancel
              </button>

              {addTenantStep > 1 && (
                <button
                  type="button"
                  onClick={handleAddTenantBack}
                  className={`rounded-xl px-6 py-2.5 text-sm font-medium transition-all ${isDark
                      ? 'text-slate-400 hover:bg-white/5 hover:text-white border border-white/10'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
                    }`}
                >
                  Back
                </button>
              )}

              {addTenantStep < addTenantWizardSteps.length ? (
                <button
                  type="button"
                  onClick={handleAddTenantNext}
                  className={`rounded-xl px-6 py-2.5 text-sm font-medium transition-all ${isDark
                      ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                      : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm shadow-cyan-600/20'
                    }`}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateTenant}
                  disabled={isCreatingTenant}
                  className={`rounded-xl px-6 py-2.5 text-sm font-medium transition-all ${isDark
                      ? 'bg-blue-600 text-white hover:bg-blue-500'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20'
                    } disabled:opacity-50`}
                >
                  {isCreatingTenant ? 'Saving...' : 'Save Tenant'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
}
