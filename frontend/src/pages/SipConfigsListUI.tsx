import { useEffect, useMemo, useState } from 'react';


import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit2, Plus, Save, Search, ServerCog, X, Building2, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { useDrawer } from '../context/DrawerContext';

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

export default function SipConfigsListUI({ token, onUnauthorized }: SipConfigsListUIProps) {
  const { isDark } = useTheme();
  const { isDrawerOpen } = useDrawer();
  const mainMarginClass = isDrawerOpen ? 'md:ml-64' : 'md:ml-20';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tenantIdParam = searchParams.get('tenantId')?.trim() || '';
  const tenantName = searchParams.get('tenantName')?.trim() || '';
  const tenantId = tenantIdParam ? Number(tenantIdParam) : NaN;

  // Use company info from search params if available, otherwise fallback to fetch
  const initialCompanyId = searchParams.get('companyId')?.trim() || '';
  const initialCompanyName = searchParams.get('companyName')?.trim() || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sipConfigs, setSipConfigs] = useState<SipConfigRecord[]>([]);
  const [isAddSipConfigOpen, setIsAddSipConfigOpen] = useState(false);
  const [editingSipConfigId, setEditingSipConfigId] = useState<number | null>(null);
  const [isSavingSipConfig, setIsSavingSipConfig] = useState(false);
  const [companyId, setCompanyId] = useState<string>(initialCompanyId);
  const [companyName, setCompanyName] = useState<string>(initialCompanyName);
  const [sipConfigForm, setSipConfigForm] = useState({
    sipProvider: '',
    sipCount: '',
    sipChannelCount: '',
    sipDescription: '',
    licenseCount: '',
  });


  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);


  const loadSipConfigs = async () => {
    try {
      setLoading(true);
      setError('');

      if (Number.isNaN(tenantId)) {
        setSipConfigs([]);
        return;
      }

      // If we don't have company context, try to fetch it via tenant
      if (!companyId || !companyName) {
        const tenantResponse = await fetch(`${API_BASE_URL}/api/tenants?companyId=0`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (tenantResponse.ok) {
          const tenantPayload = await tenantResponse.json();
          const tenants = Array.isArray(tenantPayload.tenants) ? tenantPayload.tenants : [];
          const tenant = tenants.find((t: any) => Number(t.id) === tenantId);
          if (tenant && tenant.company) {
            setCompanyId(String(tenant.company.id));
            setCompanyName(tenant.company.name);
          }
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/sip-configs?tenantId=${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` },
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

  useEffect(() => {
    if (!Number.isNaN(tenantId)) {
      loadSipConfigs();
    }
  }, [tenantId, token, onUnauthorized]);

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

  const openAddSipConfigModal = () => {
    setSipConfigForm({
      sipCount: '',
      sipProvider: '',
      sipChannelCount: '',
      sipDescription: '',
      licenseCount: '',
    });
    setEditingSipConfigId(null);
    setIsAddSipConfigOpen(true);
  };

  const closeSipConfigModal = () => {
    setIsAddSipConfigOpen(false);
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
  };

  const filteredSipConfigs = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const filtered = keyword 
      ? sipConfigs.filter((item) =>
          item.sipProvider?.toLowerCase().includes(keyword) ||
          item.sipDescription?.toLowerCase().includes(keyword)
        )
      : sipConfigs;
    
    return filtered;
  }, [searchTerm, sipConfigs]);

  const pagedSipConfigs = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredSipConfigs.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredSipConfigs, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredSipConfigs.length / rowsPerPage);


  return (
    <div className={`min-h-screen flex flex-col transition-all duration-300 ${isDark ? 'bg-[#030712] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex-grow">
        <main className={`p-4 md:p-8 transition-all duration-300 ${mainMarginClass} min-h-[calc(100vh-80px)] pt-32`}>
          <div className={`mx-auto max-w-7xl mt-15 rounded-[2.5rem] border p-6 transition-all duration-500 backdrop-blur-xl ${isDark
              ? 'border-white/10 bg-white/5 shadow-[0_20px_80px_rgba(0,0,0,0.35)]'
              : 'border-gray-200 bg-white shadow-xl shadow-gray-200/50'
            }`}>
            
            <div className={`mb-6 flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-center lg:justify-between ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    if (companyId && companyName) {
                      navigate(`/tenants?companyId=${companyId}&companyName=${encodeURIComponent(companyName)}`);
                    } else {
                      navigate('/companies');
                    }
                  }}
                  className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-all duration-300 ${isDark
                      ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20'
                      : 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 hover:border-cyan-300'
                    }`}
                >
                  <ArrowLeft size={14} />
                  Back to Tenants
                </button>
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-300 ${isDark
                      ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.18)]'
                      : 'border-cyan-200 bg-cyan-50 text-cyan-600 shadow-sm'
                    }`}>
                    <SlidersHorizontal size={20} />
                  </div>
                  <div>
                    <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {tenantName ? `${tenantName} SIP Configs` : 'SIP Configurations'}
                    </h1>
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                      {tenantName ? `Managing SIP setups for ${tenantName}.` : 'Manage tenant SIP configurations.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <label className={`flex w-full max-w-md items-center gap-3 rounded-2xl border px-4 py-3 shadow-inner transition-all duration-300 focus-within:ring-2 ${isDark
                    ? 'border-white/10 bg-black/20 text-slate-300 shadow-black/20 focus-within:border-cyan-400/40'
                    : 'border-gray-200 bg-gray-50 text-gray-700 shadow-gray-100 focus-within:border-cyan-500/40'
                  }`}>
                  <Search size={16} className={isDark ? 'text-cyan-300' : 'text-cyan-600'} />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search provider or description"
                    className={`w-full bg-transparent text-sm outline-none ${isDark ? 'text-white' : 'text-gray-900'}`}
                  />
                </label>

                <button
                  type="button"
                  onClick={openAddSipConfigModal}
                  className={`h-[42px] px-3 rounded-xl border flex items-center gap-2 text-sm transition-all whitespace-nowrap ${isDark
                      ? 'bg-[#09090B] border-white/10 text-gray-300 hover:text-white hover:border-white/20'
                      : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 shadow-sm'
                    }`}
                >
                  <Plus size={15} /> Add
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            )}

            <div className="overflow-x-auto no-scrollbar rounded-3xl">
              <table className="min-w-full text-left">
                <thead className={`text-[10px] uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  <tr className={`border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                    <th className="px-5 py-4 font-semibold">ID</th>
                    <th className="px-5 py-4 font-semibold">Tenant</th>
                    <th className="px-5 py-4 font-semibold">Provider</th>
                    <th className="px-5 py-4 font-semibold text-center">SIPs</th>
                    <th className="px-5 py-4 font-semibold text-center">Channels</th>
                    <th className="px-5 py-4 font-semibold text-center">Licenses</th>
                    <th className="px-5 py-4 font-semibold">Description</th>
                    <th className="px-5 py-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-50'}`}>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-sm opacity-50">Loading configurations...</td>
                    </tr>
                  ) : pagedSipConfigs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-sm opacity-50">No SIP configurations found.</td>
                    </tr>
                  ) : pagedSipConfigs.map((item) => (

                    <tr key={item.id} className={`group transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50/50'}`}>
                      <td className={`px-5 py-4 text-sm font-mono ${isDark ? 'text-slate-100' : 'text-gray-500 opacity-50'}`}>#{item.id}</td>
                      <td className={`px-5 py-4 text-sm font-semibold ${isDark ? 'text-cyan-200' : 'text-cyan-700'}`}>{item.tenant?.name || 'N/A'}</td>
                      <td className="px-5 py-4 text-sm">
                        {editingSipConfigId === item.id ? (
                          <input
                            value={sipConfigForm.sipProvider}
                            onChange={(e) => setSipConfigForm({ ...sipConfigForm, sipProvider: e.target.value })}
                            className={`w-full rounded-lg border px-3 py-1.5 text-sm outline-none ${isDark ? 'border-white/10 bg-black/20 text-white' : 'border-gray-200 bg-white'}`}
                          />
                        ) : (
                          <span className={isDark ? 'text-slate-100' : 'text-gray-900'}>{item.sipProvider}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-center">
                        {editingSipConfigId === item.id ? (
                          <input
                            type="number"
                            value={sipConfigForm.sipCount}
                            onChange={(e) => setSipConfigForm({ ...sipConfigForm, sipCount: e.target.value })}
                            className={`w-20 mx-auto rounded-lg border px-2 py-1.5 text-sm outline-none text-center ${isDark ? 'border-white/10 bg-black/20 text-white' : 'border-gray-200 bg-white'}`}
                          />
                        ) : (
                          <span className={`inline-flex rounded-md px-2 py-0.5 font-mono text-xs ${isDark ? 'bg-cyan-500/10 text-cyan-300' : 'bg-cyan-50 text-cyan-700'}`}>{item.sipCount ?? '0'}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-center">
                        {editingSipConfigId === item.id ? (
                          <input
                            type="number"
                            value={sipConfigForm.sipChannelCount}
                            onChange={(e) => setSipConfigForm({ ...sipConfigForm, sipChannelCount: e.target.value })}
                            className={`w-20 mx-auto rounded-lg border px-2 py-1.5 text-sm outline-none text-center ${isDark ? 'border-white/10 bg-black/20 text-white' : 'border-gray-200 bg-white'}`}
                          />
                        ) : (
                          <span className={`inline-flex rounded-md px-2 py-0.5 font-mono text-xs ${isDark ? 'bg-violet-500/10 text-violet-300' : 'bg-violet-50 text-violet-700'}`}>{item.sipChannelCount ?? '0'}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-center">
                        {editingSipConfigId === item.id ? (
                          <input
                            type="number"
                            value={sipConfigForm.licenseCount}
                            onChange={(e) => setSipConfigForm({ ...sipConfigForm, licenseCount: e.target.value })}
                            className={`w-20 mx-auto rounded-lg border px-2 py-1.5 text-sm outline-none text-center ${isDark ? 'border-white/10 bg-black/20 text-white' : 'border-gray-200 bg-white'}`}
                          />
                        ) : (
                          <span className={`inline-flex rounded-md px-2 py-0.5 font-mono text-xs ${isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>{item.licenseCount ?? '0'}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm max-w-[200px] truncate">
                        {editingSipConfigId === item.id ? (
                          <input
                            value={sipConfigForm.sipDescription}
                            onChange={(e) => setSipConfigForm({ ...sipConfigForm, sipDescription: e.target.value })}
                            className={`w-full rounded-lg border px-3 py-1.5 text-sm outline-none ${isDark ? 'border-white/10 bg-black/20 text-white' : 'border-gray-200 bg-white'}`}
                          />
                        ) : (
                          <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>{item.sipDescription || '—'}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <div className="flex items-center justify-center gap-2">
                          {editingSipConfigId === item.id ? (
                            <>
                              <button onClick={() => void saveSipConfig()} disabled={isSavingSipConfig} className={`h-8 rounded-lg px-3 text-xs font-bold transition-all ${isDark ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'}`}>Save</button>
                              <button onClick={cancelEditSipConfig} className={`h-8 rounded-lg px-3 text-xs font-bold transition-all ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900 border border-gray-200'}`}>Cancel</button>
                            </>
                          ) : (
                            <button onClick={() => startEditSipConfig(item)} className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${isDark ? 'border-blue-400/30 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20' : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-300'}`} title="Edit"><Edit2 size={13} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-t ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-100 bg-gray-50/50'}`}>
              <div className="flex items-center gap-3">
                <span className={`text-[0.75rem] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Show</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className={`bg-transparent text-xs font-bold border-none focus:ring-0 p-0 pr-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}
                >
                  {[5, 10, 20, 50].map(size => (
                    <option key={size} value={size} className={isDark ? 'bg-[#111827]' : 'bg-white'}>{size} per page</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(pg => Math.max(1, pg - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-xl transition-all ${currentPage === 1 ? 'opacity-20 cursor-not-allowed' : isDark ? 'hover:bg-white/10 text-slate-400 hover:text-cyan-400' : 'hover:bg-cyan-50 text-gray-400 hover:text-cyan-600'}`}
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    disabled
                    className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'}`}
                  >
                    {currentPage}
                  </button>
                </div>

                <button
                  onClick={() => setCurrentPage(pg => Math.min(totalPages, pg + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`p-2 rounded-xl transition-all ${currentPage === totalPages || totalPages === 0 ? 'opacity-20 cursor-not-allowed' : isDark ? 'hover:bg-white/10 text-slate-400 hover:text-cyan-400' : 'hover:bg-cyan-50 text-gray-400 hover:text-cyan-600'}`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

        </main>
      </div>

      {isAddSipConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-xl rounded-3xl border p-6 shadow-2xl transition-all duration-500 ${isDark ? 'border-white/10 bg-[#0B1220]' : 'border-gray-200 bg-white'}`}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add SIP Config</h2>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{tenantName ? `Create a configuration for ${tenantName}.` : 'Add a new configuration'}</p>
              </div>
              <button onClick={closeSipConfigModal} className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all ${isDark ? 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}><X size={18} /></button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={`mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Provider Name *</label>
                  <input 
                    autoFocus 
                    value={sipConfigForm.sipProvider} 
                    onChange={(e) => setSipConfigForm({ ...sipConfigForm, sipProvider: e.target.value })} 
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${isDark ? 'border-white/10 bg-black/40 text-white focus:border-blue-500/50' : 'border-gray-200 bg-gray-50 focus:border-blue-500/50 focus:bg-white'}`} 
                    placeholder="e.g. Twilio, Vonage" 
                  />
                </div>

                <div>
                  <label className={`mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>SIP Count</label>
                  <input 
                    type="number" 
                    value={sipConfigForm.sipCount} 
                    onChange={(e) => setSipConfigForm({ ...sipConfigForm, sipCount: e.target.value })} 
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${isDark ? 'border-white/10 bg-black/40 text-white focus:border-blue-500/50' : 'border-gray-200 bg-gray-50 focus:border-blue-500/50 focus:bg-white'}`} 
                    placeholder="0" 
                  />
                </div>

                <div>
                  <label className={`mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Channels</label>
                  <input 
                    type="number" 
                    value={sipConfigForm.sipChannelCount} 
                    onChange={(e) => setSipConfigForm({ ...sipConfigForm, sipChannelCount: e.target.value })} 
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${isDark ? 'border-white/10 bg-black/40 text-white focus:border-blue-500/50' : 'border-gray-200 bg-gray-50 focus:border-blue-500/50 focus:bg-white'}`} 
                    placeholder="0" 
                  />
                </div>

                <div>
                  <label className={`mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Licenses</label>
                  <input 
                    type="number" 
                    value={sipConfigForm.licenseCount} 
                    onChange={(e) => setSipConfigForm({ ...sipConfigForm, licenseCount: e.target.value })} 
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${isDark ? 'border-white/10 bg-black/40 text-white focus:border-blue-500/50' : 'border-gray-200 bg-gray-50 focus:border-blue-500/50 focus:bg-white'}`} 
                    placeholder="0" 
                  />
                </div>

                <div>
                  <label className={`mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Tenant ID</label>
                  <div className={`w-full rounded-xl border px-4 py-3 text-sm ${isDark ? 'border-white/10 bg-black/20 text-slate-400' : 'border-gray-100 bg-gray-100 text-gray-500'}`}>
                    {tenantId || 'N/A'}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className={`mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Description</label>
                  <textarea 
                    rows={3} 
                    value={sipConfigForm.sipDescription} 
                    onChange={(e) => setSipConfigForm({ ...sipConfigForm, sipDescription: e.target.value })} 
                    className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-all ${isDark ? 'border-white/10 bg-black/40 text-white focus:border-blue-500/50' : 'border-gray-200 bg-gray-50 focus:border-blue-500/50 focus:bg-white'}`} 
                    placeholder="Notes about this configuration..." 
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end items-center gap-4 pt-6 mt-6 border-t border-white/5">
              <button 
                onClick={closeSipConfigModal} 
                className={`text-sm font-bold transition-all ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Cancel
              </button>
              <button 
                onClick={() => void saveSipConfig()} 
                disabled={isSavingSipConfig} 
                className={`rounded-xl px-8 py-3 text-sm font-bold transition-all ${isDark ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'}`}
              >
                {isSavingSipConfig ? 'Saving...' : 'Save SIP Config'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}