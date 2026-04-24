import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit2, Plus, Save, Search, ServerCog, X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

type SipConfigRecord = {
  id: number;
  tenantId: number;
  sipCount: number | null;
  sipProvider: string;
  sipChannelCount: number | null;
  sipDescription: string;
  licenseCount: number | null;
  createdAt: string;
  tenant: null | {
    id: number;
    name: string;
  };
};

type SipConfigsResponse = {
  sipConfigs?: SipConfigRecord[];
};

type SipConfigPayloadResponse = {
  sipConfig?: SipConfigRecord;
  error?: string;
};

type SipConfigFormState = {
  sipCount: string;
  sipProvider: string;
  sipChannelCount: string;
  sipDescription: string;
  licenseCount: string;
};

type SipConfigsListUIProps = {
  token: string;
  onUnauthorized: () => void;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function SipConfigsListUI({ token, onUnauthorized }: SipConfigsListUIProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tenantIdParam = searchParams.get('tenantId')?.trim() || '';
  const tenantName = searchParams.get('tenantName')?.trim() || '';
  const tenantId = tenantIdParam ? Number(tenantIdParam) : NaN;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sipConfigs, setSipConfigs] = useState<SipConfigRecord[]>([]);
  const [isAddSipConfigOpen, setIsAddSipConfigOpen] = useState(false);
  const [editingSipConfigId, setEditingSipConfigId] = useState<number | null>(null);
  const [isSavingSipConfig, setIsSavingSipConfig] = useState(false);
  const [sipConfigWizardStep, setSipConfigWizardStep] = useState(1);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [sipConfigForm, setSipConfigForm] = useState<SipConfigFormState>({
    sipCount: '',
    sipProvider: '',
    sipChannelCount: '',
    sipDescription: '',
    licenseCount: '',
  });

  const loadSipConfigs = async () => {
    try {
      setLoading(true);
      setError('');

      if (Number.isNaN(tenantId)) {
        setSipConfigs([]);
        return;
      }

      // Fetch tenant info to get company ID
      const tenantResponse = await fetch(`${API_BASE_URL}/api/tenants?companyId=0`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (tenantResponse.ok) {
        const tenantPayload = await tenantResponse.json();
        const tenants = Array.isArray(tenantPayload.tenants) ? tenantPayload.tenants : [];
        const tenant = tenants.find((t: any) => Number(t.id) === tenantId);
        if (tenant && tenant.company) {
          setCompanyId(tenant.company.id);
          setCompanyName(tenant.company.name);
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/sip-configs?tenantId=${tenantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
          onUnauthorized();
          return;
        }

        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to load SIP configurations');
      }

      const payload = (await response.json()) as SipConfigsResponse;
      setSipConfigs(payload.sipConfigs || []);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load SIP configurations';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const saveSipConfig = async () => {
    const sipCount = sipConfigForm.sipCount.trim();
    const sipProvider = sipConfigForm.sipProvider.trim();
    const sipChannelCount = sipConfigForm.sipChannelCount.trim();
    const sipDescription = sipConfigForm.sipDescription.trim();
    const licenseCount = sipConfigForm.licenseCount.trim();

    if (!sipProvider) {
      toast.error('SIP provider is required');
      return;
    }

    try {
      setIsSavingSipConfig(true);

      const isEditing = editingSipConfigId !== null;
      const response = await fetch(
        isEditing ? `${API_BASE_URL}/api/sip-configs/${editingSipConfigId}` : `${API_BASE_URL}/api/sip-configs`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tenantId,
            sipCount,
            sipProvider,
            sipChannelCount,
            sipDescription,
            licenseCount,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
          onUnauthorized();
          return;
        }

        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || (isEditing ? 'Failed to update SIP configuration' : 'Failed to create SIP configuration'));
      }

      const payload = (await response.json()) as SipConfigPayloadResponse;
      if (payload.sipConfig) {
        setSipConfigs((prev) => {
          if (isEditing) {
            return prev.map((row) => (row.id === payload.sipConfig?.id ? payload.sipConfig as SipConfigRecord : row));
          }

          return [payload.sipConfig as SipConfigRecord, ...prev];
        });
      } else {
        await loadSipConfigs();
      }

      toast.success(isEditing ? 'SIP configuration updated' : 'SIP configuration added');
      if (isEditing) {
        cancelEditSipConfig();
      } else {
        closeSipConfigModal();
      }
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Failed to save SIP configuration';
      toast.error(message);
    } finally {
      setIsSavingSipConfig(false);
    }
  };

  const handleSipConfigNext = async () => {
    if (!validateSipConfigStep(sipConfigWizardStep)) {
      return;
    }

    if (sipConfigWizardStep < sipConfigWizardSteps.length) {
      setSipConfigWizardStep((prev) => Math.min(prev + 1, sipConfigWizardSteps.length));
      return;
    }

    await saveSipConfig();
  };

  const handleSipConfigBack = () => {
    setSipConfigWizardStep((prev) => Math.max(prev - 1, 1));
  };

  const sipConfigWizardSteps = [
    { step: 1, title: 'SIP Provider' },
    { step: 2, title: 'SIP Count' },
    { step: 3, title: 'Channel Count' },
    { step: 4, title: 'License Count' },
    { step: 5, title: 'Description' },
  ];

  const validateSipConfigStep = (step: number): boolean => {
    const sipProvider = sipConfigForm.sipProvider.trim();

    if (step === 1 && !sipProvider) {
      toast.error('SIP provider is required');
      return false;
    }

    return true;
  };

  const openAddSipConfigModal = () => {
    setSipConfigForm({
      sipCount: '',
      sipProvider: '',
      sipChannelCount: '',
      sipDescription: '',
      licenseCount: '',
    });
    setSipConfigWizardStep(1);
    setEditingSipConfigId(null);
    setIsAddSipConfigOpen(true);
  };

  const closeSipConfigModal = () => {
    setIsAddSipConfigOpen(false);
    setSipConfigWizardStep(1);
    setSipConfigForm({
      sipCount: '',
      sipProvider: '',
      sipChannelCount: '',
      sipDescription: '',
      licenseCount: '',
    });
    setEditingSipConfigId(null);
  };

  const startEditSipConfig = (config: SipConfigRecord) => {
    setSipConfigForm({
      sipCount: String(config.sipCount || ''),
      sipProvider: config.sipProvider,
      sipChannelCount: String(config.sipChannelCount || ''),
      sipDescription: config.sipDescription,
      licenseCount: String(config.licenseCount || ''),
    });
    setEditingSipConfigId(config.id);
  };

  const cancelEditSipConfig = () => {
    setEditingSipConfigId(null);
    setSipConfigForm({
      sipCount: '',
      sipProvider: '',
      sipChannelCount: '',
      sipDescription: '',
      licenseCount: '',
    });
  };

  useEffect(() => {
    if (!Number.isNaN(tenantId)) {
      void loadSipConfigs();
    }
  }, [tenantId, token, onUnauthorized]);

  const filteredSipConfigs = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return sipConfigs;
    }

    return sipConfigs.filter((item) => {
      return (
        String(item.sipProvider || '').toLowerCase().includes(keyword) ||
        String(item.sipDescription || '').toLowerCase().includes(keyword)
      );
    });
  }, [searchTerm, sipConfigs]);

  return (
    <div className="theme-page min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_28%),linear-gradient(180deg,_#07111f_0%,_#0b1729_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6">
        <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => {
                if (companyId && companyName) {
                  navigate(`/tenants?companyId=${companyId}&companyName=${encodeURIComponent(companyName)}`);
                } else {
                  navigate('/dashboard');
                }
              }}
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
            >
              <ArrowLeft size={14} />
              Back to tenants
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.18)]">
                <ServerCog size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {tenantName ? `${tenantName} SIP Configurations` : 'SIP Configurations'}
                </h1>
                <p className="text-sm text-slate-300">
                  {tenantName
                    ? `Showing SIP configurations for ${tenantName}.`
                    : 'Open SIP configurations from a tenant row to view tenant-specific records.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <label className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-slate-300 shadow-inner shadow-black/20 focus-within:border-cyan-400/40 focus-within:bg-black/30">
              <Search size={16} className="shrink-0 text-cyan-300" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search provider or description"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>

            <button
              type="button"
              onClick={openAddSipConfigModal}
              className="h-[42px] px-3 rounded-xl border flex items-center gap-2 text-sm transition-all whitespace-nowrap bg-[#09090B] border-white/10 text-gray-300 hover:text-white hover:border-white/20"
              title="Add"
              aria-label="Add"
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
            Loading SIP configurations...
          </div>
        ) : filteredSipConfigs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center text-sm text-slate-300">
            No SIP configurations found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
            <table className="min-w-full divide-y divide-white/10 text-left">
              <thead className="bg-black/20 text-[11px] uppercase tracking-[0.24em] text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-semibold">ID</th>
                  <th className="px-5 py-4 font-semibold">Tenant</th>
                  <th className="px-5 py-4 font-semibold">SIP Count</th>
                  <th className="px-5 py-4 font-semibold">Provider</th>
                  <th className="px-5 py-4 font-semibold">Channel Count</th>
                  <th className="px-5 py-4 font-semibold">Description</th>
                  <th className="px-5 py-4 font-semibold">License Count</th>
                  <th className="px-5 py-4 font-semibold">Created</th>
                  <th className="px-5 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {filteredSipConfigs.map((item) => (
                  <tr key={item.id} className="transition hover:bg-white/5">
                    <td className="px-5 py-4 text-sm font-medium text-white">{item.id}</td>
                    <td className="px-5 py-4 text-sm text-cyan-200">{item.tenant?.name || 'N/A'}</td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {editingSipConfigId === item.id ? (
                        <input
                          type="number"
                          min="0"
                          value={sipConfigForm.sipCount}
                          onChange={(event) => setSipConfigForm((prev) => ({ ...prev, sipCount: event.target.value }))}
                          className="w-full rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-sm text-white outline-none"
                          placeholder="SIP count"
                        />
                      ) : (
                        item.sipCount ?? 'N/A'
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {editingSipConfigId === item.id ? (
                        <input
                          value={sipConfigForm.sipProvider}
                          onChange={(event) => setSipConfigForm((prev) => ({ ...prev, sipProvider: event.target.value }))}
                          className="w-full rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-sm text-white outline-none"
                          placeholder="SIP provider"
                        />
                      ) : (
                        item.sipProvider || 'N/A'
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {editingSipConfigId === item.id ? (
                        <input
                          type="number"
                          min="0"
                          value={sipConfigForm.sipChannelCount}
                          onChange={(event) => setSipConfigForm((prev) => ({ ...prev, sipChannelCount: event.target.value }))}
                          className="w-full rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-sm text-white outline-none"
                          placeholder="Channel count"
                        />
                      ) : (
                        item.sipChannelCount ?? 'N/A'
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {editingSipConfigId === item.id ? (
                        <input
                          value={sipConfigForm.sipDescription}
                          onChange={(event) => setSipConfigForm((prev) => ({ ...prev, sipDescription: event.target.value }))}
                          className="w-full rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-sm text-white outline-none"
                          placeholder="Description"
                        />
                      ) : (
                        item.sipDescription || 'No description provided'
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {editingSipConfigId === item.id ? (
                        <input
                          type="number"
                          min="0"
                          value={sipConfigForm.licenseCount}
                          onChange={(event) => setSipConfigForm((prev) => ({ ...prev, licenseCount: event.target.value }))}
                          className="w-full rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-sm text-white outline-none"
                          placeholder="License count"
                        />
                      ) : (
                        item.licenseCount ?? 'N/A'
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">{formatDate(item.createdAt)}</td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {editingSipConfigId === item.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void saveSipConfig()}
                            disabled={isSavingSipConfig}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-400/35 bg-emerald-500/12 px-2.5 py-1 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-60"
                          >
                            <Save size={13} /> Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditSipConfig}
                            disabled={isSavingSipConfig}
                            className="inline-flex items-center gap-1 rounded-md border border-rose-400/35 bg-rose-500/12 px-2.5 py-1 text-xs font-medium text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
                          >
                            <X size={13} /> Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditSipConfig(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/12 text-cyan-200 transition-all duration-200 hover:bg-cyan-500/20 hover:text-cyan-100 hover:border-cyan-300"
                          aria-label="Edit SIP configuration"
                          title="Edit SIP configuration"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAddSipConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111318] p-6 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Add SIP Configuration
                </h2>
                <p className="text-sm text-slate-400">
                  {tenantName ? `For ${tenantName}.` : 'Create a new SIP configuration.'}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-cyan-300">
                  {sipConfigWizardSteps[sipConfigWizardStep - 1].title}
                </p>
              </div>
              <button
                type="button"
                onClick={closeSipConfigModal}
                className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:border-white/20 hover:text-white"
                aria-label="Close SIP configuration modal"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSipConfigNext();
              }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {sipConfigWizardStep === 1 ? (
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-300">SIP Provider</label>
                  <input
                    value={sipConfigForm.sipProvider}
                    onChange={(event) => setSipConfigForm((prev) => ({ ...prev, sipProvider: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                    placeholder="Enter SIP provider"
                  />
                </div>
              ) : null}

              {sipConfigWizardStep === 2 ? (
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-300">SIP Count</label>
                  <input
                    type="number"
                    min="0"
                    value={sipConfigForm.sipCount}
                    onChange={(event) => setSipConfigForm((prev) => ({ ...prev, sipCount: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                    placeholder="Enter SIP count"
                  />
                </div>
              ) : null}

              {sipConfigWizardStep === 3 ? (
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-300">Channel Count</label>
                  <input
                    type="number"
                    min="0"
                    value={sipConfigForm.sipChannelCount}
                    onChange={(event) => setSipConfigForm((prev) => ({ ...prev, sipChannelCount: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                    placeholder="Enter channel count"
                  />
                </div>
              ) : null}

              {sipConfigWizardStep === 4 ? (
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-300">License Count</label>
                  <input
                    type="number"
                    min="0"
                    value={sipConfigForm.licenseCount}
                    onChange={(event) => setSipConfigForm((prev) => ({ ...prev, licenseCount: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                    placeholder="Enter license count"
                  />
                </div>
              ) : null}

              {sipConfigWizardStep === 5 ? (
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-300">Description</label>
                  <textarea
                    value={sipConfigForm.sipDescription}
                    onChange={(event) => setSipConfigForm((prev) => ({ ...prev, sipDescription: event.target.value }))}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                    placeholder="Enter SIP configuration description"
                  />
                </div>
              ) : null}

              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                {sipConfigWizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={handleSipConfigBack}
                    className="h-[42px] rounded-xl border border-white/10 px-4 text-sm text-slate-300 transition hover:border-white/20 hover:text-white"
                  >
                    Back
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={closeSipConfigModal}
                  className="h-[42px] rounded-xl border border-white/10 px-4 text-sm text-slate-300 transition hover:border-white/20 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSipConfig}
                  className="h-[42px] rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 text-sm text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingSipConfig ? 'Saving...' : sipConfigWizardStep === sipConfigWizardSteps.length ? (editingSipConfigId ? 'Update SIP Configuration' : 'Create SIP Configuration') : 'Next'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}