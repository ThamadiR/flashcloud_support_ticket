import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowUpDown, Edit2, Plus, Save, Search, ServerCog, X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

type ServerRecord = {
  id: number;
  companyId: number;
  ipAddress: string;
  label: string;
  createdAt: string;
  company: null | {
    id: number;
    name: string;
  };
};

type ServersResponse = {
  servers?: ServerRecord[];
};

type UpdateServerResponse = {
  server?: ServerRecord;
  error?: string;
};

type CreateServerResponse = {
  server?: ServerRecord;
  error?: string;
};

type ServersListUIProps = {
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

export default function ServersListUI({ token, onUnauthorized }: ServersListUIProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const companyId = params.get('companyId') || '';
  const companyName = params.get('companyName') || '';
  const idSortMenuRef = useRef<HTMLDivElement>(null);
  const companySortMenuRef = useRef<HTMLDivElement>(null);
  const companyIdSortMenuRef = useRef<HTMLDivElement>(null);
  const ipAddressSortMenuRef = useRef<HTMLDivElement>(null);
  const labelSortMenuRef = useRef<HTMLDivElement>(null);
  const createdAtSortMenuRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [servers, setServers] = useState<ServerRecord[]>([]);
  const [sortBy, setSortBy] = useState<'id' | 'company' | 'companyId' | 'ipAddress' | 'label' | 'createdAt'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isIdSortMenuOpen, setIsIdSortMenuOpen] = useState(false);
  const [isCompanySortMenuOpen, setIsCompanySortMenuOpen] = useState(false);
  const [isCompanyIdSortMenuOpen, setIsCompanyIdSortMenuOpen] = useState(false);
  const [isIpAddressSortMenuOpen, setIsIpAddressSortMenuOpen] = useState(false);
  const [isLabelSortMenuOpen, setIsLabelSortMenuOpen] = useState(false);
  const [isCreatedAtSortMenuOpen, setIsCreatedAtSortMenuOpen] = useState(false);
  const [editingServerId, setEditingServerId] = useState<number | null>(null);
  const [serverForm, setServerForm] = useState({ ipAddress: '', label: '' });
  const [isSavingServer, setIsSavingServer] = useState(false);
  const [isAddServerModalOpen, setIsAddServerModalOpen] = useState(false);
  const [addServerStep, setAddServerStep] = useState(1);
  const [isCreatingServer, setIsCreatingServer] = useState(false);
  const [addServerForm, setAddServerForm] = useState({
    companyId: companyId || '',
    ipAddress: '',
    label: '',
  });
  const [addServerErrors, setAddServerErrors] = useState<{ companyId?: string; ipAddress?: string; label?: string }>({});

  useEffect(() => {
    const loadServers = async () => {
      try {
        setLoading(true);
        setError('');

        const endpoint = companyId
          ? `${API_BASE_URL}/api/servers?companyId=${encodeURIComponent(companyId)}`
          : `${API_BASE_URL}/api/servers`;

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
          throw new Error(payload.error || 'Unable to fetch servers');
        }

        const payload: ServersResponse = await response.json();
        setServers(Array.isArray(payload.servers) ? payload.servers : []);
      } catch (err: any) {
        const message = err?.message || 'Failed to load servers';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadServers();
  }, [token, onUnauthorized, companyId]);

  const closeAllSortMenus = () => {
    setIsIdSortMenuOpen(false);
    setIsCompanySortMenuOpen(false);
    setIsCompanyIdSortMenuOpen(false);
    setIsIpAddressSortMenuOpen(false);
    setIsLabelSortMenuOpen(false);
    setIsCreatedAtSortMenuOpen(false);
  };

  const applyColumnSort = (
    field: 'id' | 'company' | 'companyId' | 'ipAddress' | 'label' | 'createdAt',
    nextSortOrder: 'asc' | 'desc'
  ) => {
    setSortBy(field);
    setSortOrder(nextSortOrder);
    closeAllSortMenus();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        idSortMenuRef.current?.contains(target)
        || companySortMenuRef.current?.contains(target)
        || companyIdSortMenuRef.current?.contains(target)
        || ipAddressSortMenuRef.current?.contains(target)
        || labelSortMenuRef.current?.contains(target)
        || createdAtSortMenuRef.current?.contains(target)
      ) {
        return;
      }

      closeAllSortMenus();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredServers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = servers.filter((server) => {
      if (!normalizedSearch) {
        return true;
      }

      return (
        String(server.id).includes(normalizedSearch)
        || server.ipAddress.toLowerCase().includes(normalizedSearch)
        || server.label.toLowerCase().includes(normalizedSearch)
        || String(server.companyId).includes(normalizedSearch)
        || String(server.company?.name || '').toLowerCase().includes(normalizedSearch)
      );
    });

    return filtered.sort((a, b) => {
      const direction = sortOrder === 'asc' ? 1 : -1;

      if (sortBy === 'id' || sortBy === 'companyId') {
        return (a[sortBy] - b[sortBy]) * direction;
      }

      if (sortBy === 'createdAt') {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
      }

      if (sortBy === 'company') {
        const leftCompany = String(a.company?.name || '').toLowerCase();
        const rightCompany = String(b.company?.name || '').toLowerCase();
        return leftCompany.localeCompare(rightCompany) * direction;
      }

      const left = String(a[sortBy] || '').toLowerCase();
      const right = String(b[sortBy] || '').toLowerCase();
      return left.localeCompare(right) * direction;
    });
  }, [servers, searchTerm, sortBy, sortOrder]);

  const startEditServer = (server: ServerRecord) => {
    setEditingServerId(server.id);
    setServerForm({
      ipAddress: server.ipAddress,
      label: server.label || '',
    });
  };

  const cancelEditServer = () => {
    setEditingServerId(null);
    setServerForm({ ipAddress: '', label: '' });
    setIsSavingServer(false);
  };

  const saveServerEdit = async (serverId: number) => {
    try {
      const trimmedIp = serverForm.ipAddress.trim();
      const trimmedLabel = serverForm.label.trim();

      if (!trimmedIp) {
        toast.error('IP address is required');
        return;
      }

      setIsSavingServer(true);
      const response = await fetch(`${API_BASE_URL}/api/servers/${serverId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ipAddress: trimmedIp,
          label: trimmedLabel,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
          onUnauthorized();
          return;
        }

        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to update server');
      }

      const payload = (await response.json()) as UpdateServerResponse;
      if (!payload.server) {
        throw new Error('Updated server payload missing');
      }

      setServers((prev) => prev.map((row) => (row.id === serverId ? payload.server as ServerRecord : row)));
      cancelEditServer();
      toast.success('Server updated');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Failed to update server';
      toast.error(message);
    } finally {
      setIsSavingServer(false);
    }
  };

  const addServerWizardSteps = [
    { step: 1, title: 'Step 1: Company id', field: 'companyId' as const },
    { step: 2, title: 'Step 2: IP address', field: 'ipAddress' as const },
    { step: 3, title: 'Step 3: Label', field: 'label' as const },
  ];

  const openAddServerModal = () => {
    setAddServerForm({
      companyId: companyId || '',
      ipAddress: '',
      label: '',
    });
    setAddServerErrors({});
    setAddServerStep(1);
    setIsAddServerModalOpen(true);
  };

  const closeAddServerModal = () => {
    setIsAddServerModalOpen(false);
    setAddServerErrors({});
    setAddServerStep(1);
    setIsCreatingServer(false);
  };

  const validateAddServerStep = (step: number): boolean => {
    const errors: { companyId?: string; ipAddress?: string; label?: string } = {};

    if (step === 1) {
      const parsedCompanyId = Number(addServerForm.companyId);
      if (!Number.isFinite(parsedCompanyId) || parsedCompanyId <= 0) {
        errors.companyId = 'Company id must be a positive number';
      }
    }

    if (step === 2) {
      if (!addServerForm.ipAddress.trim()) {
        errors.ipAddress = 'IP address is required';
      }
    }

    setAddServerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddServerNext = () => {
    if (!validateAddServerStep(addServerStep)) {
      return;
    }

    setAddServerStep((prev) => Math.min(prev + 1, addServerWizardSteps.length));
  };

  const handleAddServerBack = () => {
    setAddServerErrors({});
    setAddServerStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCreateServer = async () => {
    if (!validateAddServerStep(1) || !validateAddServerStep(2)) {
      return;
    }

    try {
      setIsCreatingServer(true);
      const response = await fetch(`${API_BASE_URL}/api/servers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId: Number(addServerForm.companyId),
          ipAddress: addServerForm.ipAddress.trim(),
          label: addServerForm.label.trim(),
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
          onUnauthorized();
          return;
        }

        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to create server');
      }

      const payload = (await response.json()) as CreateServerResponse;
      if (!payload.server) {
        throw new Error('Created server payload missing');
      }

      const createdServer = payload.server;
      const activeCompanyFilter = Number(companyId);
      const shouldIncludeInView = !Number.isFinite(activeCompanyFilter) || createdServer.companyId === activeCompanyFilter;

      if (shouldIncludeInView) {
        setServers((prev) => [createdServer, ...prev]);
      }

      closeAddServerModal();
      toast.success('Server added');
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Failed to create server';
      toast.error(message);
    } finally {
      setIsCreatingServer(false);
    }
  };

  return (
    <div className="theme-page min-h-screen bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.12),_transparent_28%),linear-gradient(180deg,_#07111f_0%,_#0b1729_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6">
        <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/20"
            >
              <ArrowLeft size={14} />
              Back to dashboard
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/10 text-violet-200 shadow-[0_0_18px_rgba(139,92,246,0.22)]">
                <ServerCog size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Server List</h1>
                <p className="text-sm text-slate-300">
                  {companyName ? `Showing server records for ${companyName}.` : 'Showing all server records in the database.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full max-w-2xl items-center gap-2">
            <label className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-slate-300 shadow-inner shadow-black/20 focus-within:border-violet-400/40 focus-within:bg-black/30">
              <Search size={16} className="shrink-0 text-violet-300" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by id, IP, label, company"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>

            <button
              type="button"
              onClick={openAddServerModal}
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
            Loading server records...
          </div>
        ) : filteredServers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center text-sm text-slate-300">
            No server records found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
            <table className="min-w-full divide-y divide-white/10 text-left">
              <thead className="bg-black/20 text-[11px] uppercase tracking-[0.24em] text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    <div className="relative inline-flex items-center gap-2" ref={idSortMenuRef}>
                      <span>ID</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsIdSortMenuOpen((prev) => !prev);
                          setIsCompanySortMenuOpen(false);
                          setIsCompanyIdSortMenuOpen(false);
                          setIsIpAddressSortMenuOpen(false);
                          setIsLabelSortMenuOpen(false);
                          setIsCreatedAtSortMenuOpen(false);
                        }}
                        className="rounded-md p-1 transition-colors hover:bg-white/10"
                        aria-label="Sort server id"
                        title="Sort server id"
                      >
                        <ArrowUpDown size={13} />
                      </button>
                      {isIdSortMenuOpen && (
                        <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                          <button
                            type="button"
                            onClick={() => applyColumnSort('id', 'asc')}
                            className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                              sortBy === 'id' && sortOrder === 'asc'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'text-gray-300 hover:bg-white/5'
                            }`}
                          >
                            asc
                          </button>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('id', 'desc')}
                            className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                              sortBy === 'id' && sortOrder === 'desc'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'text-gray-300 hover:bg-white/5'
                            }`}
                          >
                            dsc
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    <div className="relative inline-flex items-center gap-2" ref={companySortMenuRef}>
                      <span>Company</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCompanySortMenuOpen((prev) => !prev);
                          setIsIdSortMenuOpen(false);
                          setIsCompanyIdSortMenuOpen(false);
                          setIsIpAddressSortMenuOpen(false);
                          setIsLabelSortMenuOpen(false);
                          setIsCreatedAtSortMenuOpen(false);
                        }}
                        className="rounded-md p-1 transition-colors hover:bg-white/10"
                        aria-label="Sort server company"
                        title="Sort server company"
                      >
                        <ArrowUpDown size={13} />
                      </button>
                      {isCompanySortMenuOpen && (
                        <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                          <button
                            type="button"
                            onClick={() => applyColumnSort('company', 'asc')}
                            className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                              sortBy === 'company' && sortOrder === 'asc'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'text-gray-300 hover:bg-white/5'
                            }`}
                          >
                            asc
                          </button>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('company', 'desc')}
                            className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                              sortBy === 'company' && sortOrder === 'desc'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'text-gray-300 hover:bg-white/5'
                            }`}
                          >
                            dsc
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    <div className="relative inline-flex items-center gap-2" ref={companyIdSortMenuRef}>
                      <span>Company ID</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCompanyIdSortMenuOpen((prev) => !prev);
                          setIsIdSortMenuOpen(false);
                          setIsCompanySortMenuOpen(false);
                          setIsIpAddressSortMenuOpen(false);
                          setIsLabelSortMenuOpen(false);
                          setIsCreatedAtSortMenuOpen(false);
                        }}
                        className="rounded-md p-1 transition-colors hover:bg-white/10"
                        aria-label="Sort server company id"
                        title="Sort server company id"
                      >
                        <ArrowUpDown size={13} />
                      </button>
                      {isCompanyIdSortMenuOpen && (
                        <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                          <button
                            type="button"
                            onClick={() => applyColumnSort('companyId', 'asc')}
                            className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                              sortBy === 'companyId' && sortOrder === 'asc'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'text-gray-300 hover:bg-white/5'
                            }`}
                          >
                            asc
                          </button>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('companyId', 'desc')}
                            className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                              sortBy === 'companyId' && sortOrder === 'desc'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'text-gray-300 hover:bg-white/5'
                            }`}
                          >
                            dsc
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    <div className="relative inline-flex items-center gap-2" ref={ipAddressSortMenuRef}>
                      <span>IP Address</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsIpAddressSortMenuOpen((prev) => !prev);
                          setIsIdSortMenuOpen(false);
                          setIsCompanySortMenuOpen(false);
                          setIsCompanyIdSortMenuOpen(false);
                          setIsLabelSortMenuOpen(false);
                          setIsCreatedAtSortMenuOpen(false);
                        }}
                        className="rounded-md p-1 transition-colors hover:bg-white/10"
                        aria-label="Sort server ip address"
                        title="Sort server ip address"
                      >
                        <ArrowUpDown size={13} />
                      </button>
                      {isIpAddressSortMenuOpen && (
                        <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                          <button
                            type="button"
                            onClick={() => applyColumnSort('ipAddress', 'asc')}
                            className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                              sortBy === 'ipAddress' && sortOrder === 'asc'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'text-gray-300 hover:bg-white/5'
                            }`}
                          >
                            asc
                          </button>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('ipAddress', 'desc')}
                            className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                              sortBy === 'ipAddress' && sortOrder === 'desc'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'text-gray-300 hover:bg-white/5'
                            }`}
                          >
                            dsc
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    <div className="relative inline-flex items-center gap-2" ref={labelSortMenuRef}>
                      <span>Label</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsLabelSortMenuOpen((prev) => !prev);
                          setIsIdSortMenuOpen(false);
                          setIsCompanySortMenuOpen(false);
                          setIsCompanyIdSortMenuOpen(false);
                          setIsIpAddressSortMenuOpen(false);
                          setIsCreatedAtSortMenuOpen(false);
                        }}
                        className="rounded-md p-1 transition-colors hover:bg-white/10"
                        aria-label="Sort server label"
                        title="Sort server label"
                      >
                        <ArrowUpDown size={13} />
                      </button>
                      {isLabelSortMenuOpen && (
                        <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                          <button
                            type="button"
                            onClick={() => applyColumnSort('label', 'asc')}
                            className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                              sortBy === 'label' && sortOrder === 'asc'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'text-gray-300 hover:bg-white/5'
                            }`}
                          >
                            asc
                          </button>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('label', 'desc')}
                            className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                              sortBy === 'label' && sortOrder === 'desc'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'text-gray-300 hover:bg-white/5'
                            }`}
                          >
                            dsc
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    <div className="relative inline-flex items-center gap-2" ref={createdAtSortMenuRef}>
                      <span>Created</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatedAtSortMenuOpen((prev) => !prev);
                          setIsIdSortMenuOpen(false);
                          setIsCompanySortMenuOpen(false);
                          setIsCompanyIdSortMenuOpen(false);
                          setIsIpAddressSortMenuOpen(false);
                          setIsLabelSortMenuOpen(false);
                        }}
                        className="rounded-md p-1 transition-colors hover:bg-white/10"
                        aria-label="Sort server created date"
                        title="Sort server created date"
                      >
                        <ArrowUpDown size={13} />
                      </button>
                      {isCreatedAtSortMenuOpen && (
                        <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                          <button
                            type="button"
                            onClick={() => applyColumnSort('createdAt', 'asc')}
                            className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                              sortBy === 'createdAt' && sortOrder === 'asc'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'text-gray-300 hover:bg-white/5'
                            }`}
                          >
                            asc
                          </button>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('createdAt', 'desc')}
                            className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                              sortBy === 'createdAt' && sortOrder === 'desc'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'text-gray-300 hover:bg-white/5'
                            }`}
                          >
                            dsc
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {filteredServers.map((server) => (
                  <tr key={server.id} className="transition hover:bg-white/5">
                    <td className="px-5 py-4 text-sm font-medium text-white">{server.id}</td>
                    <td className="px-5 py-4 text-sm text-violet-200">{server.company?.name || 'N/A'}</td>
                    <td className="px-5 py-4 text-sm text-slate-300">{server.companyId}</td>
                    <td className="px-5 py-4 text-sm text-slate-200">
                      {editingServerId === server.id ? (
                        <input
                          value={serverForm.ipAddress}
                          onChange={(event) => setServerForm((prev) => ({ ...prev, ipAddress: event.target.value }))}
                          className="w-full rounded-lg border border-violet-400/30 bg-violet-500/10 px-2 py-1 text-sm text-white outline-none"
                        />
                      ) : (
                        server.ipAddress
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {editingServerId === server.id ? (
                        <input
                          value={serverForm.label}
                          onChange={(event) => setServerForm((prev) => ({ ...prev, label: event.target.value }))}
                          className="w-full rounded-lg border border-violet-400/30 bg-violet-500/10 px-2 py-1 text-sm text-white outline-none"
                        />
                      ) : (
                        server.label || '-'
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">{formatDate(server.createdAt)}</td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {editingServerId === server.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => saveServerEdit(server.id)}
                            disabled={isSavingServer}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-400/35 bg-emerald-500/12 px-2.5 py-1 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-60"
                          >
                            <Save size={13} /> Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditServer}
                            disabled={isSavingServer}
                            className="inline-flex items-center gap-1 rounded-md border border-rose-400/35 bg-rose-500/12 px-2.5 py-1 text-xs font-medium text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
                          >
                            <X size={13} /> Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditServer(server)}
                          className="inline-flex items-center gap-1 rounded-md border border-violet-400/35 bg-violet-500/12 px-2.5 py-1 text-xs font-medium text-violet-200 transition hover:bg-violet-500/20"
                        >
                          <Edit2 size={13} /> Edit
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

      {isAddServerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111318] p-6 shadow-[0_0_35px_rgba(139,92,246,0.25)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h4 className="text-lg font-semibold text-white">Add a new server</h4>
              <button
                type="button"
                onClick={closeAddServerModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white"
                aria-label="Close add server modal"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-5 rounded-xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="flex items-center justify-between gap-2 text-[12px] font-semibold uppercase tracking-[0.2em]">
                <span className="text-gray-400">Step {addServerStep} of {addServerWizardSteps.length}</span>
                <span className="text-violet-200">{addServerWizardSteps[addServerStep - 1]?.title}</span>
              </div>
              <div className="mt-4 flex gap-2">
                {addServerWizardSteps.map((step) => (
                  <div
                    key={step.step}
                    className={`h-2.5 flex-1 rounded-full transition-colors ${
                      addServerStep >= step.step ? 'bg-violet-500/80' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>

            {addServerStep === 1 && (
              <div>
                <label htmlFor="addServerCompanyId" className="text-[13px] text-gray-300">Company ID *</label>
                <input
                  id="addServerCompanyId"
                  type="number"
                  autoFocus
                  value={addServerForm.companyId}
                  onChange={(event) => setAddServerForm((prev) => ({ ...prev, companyId: event.target.value }))}
                  className={`mt-2 w-full rounded-xl border px-4 py-3 text-base text-gray-200 outline-none ${
                    addServerErrors.companyId
                      ? 'border-red-500/50 bg-red-500/10'
                      : 'border-white/10 bg-[#09090B] focus:border-violet-500/50'
                  }`}
                  placeholder="Company id"
                />
                {addServerErrors.companyId && <p className="mt-2 text-xs text-red-400">{addServerErrors.companyId}</p>}
              </div>
            )}

            {addServerStep === 2 && (
              <div>
                <label htmlFor="addServerIpAddress" className="text-[13px] text-gray-300">IP Address *</label>
                <input
                  id="addServerIpAddress"
                  type="text"
                  autoFocus
                  value={addServerForm.ipAddress}
                  onChange={(event) => setAddServerForm((prev) => ({ ...prev, ipAddress: event.target.value }))}
                  className={`mt-2 w-full rounded-xl border px-4 py-3 text-base text-gray-200 outline-none ${
                    addServerErrors.ipAddress
                      ? 'border-red-500/50 bg-red-500/10'
                      : 'border-white/10 bg-[#09090B] focus:border-violet-500/50'
                  }`}
                  placeholder="10.20.1.11"
                />
                {addServerErrors.ipAddress && <p className="mt-2 text-xs text-red-400">{addServerErrors.ipAddress}</p>}
              </div>
            )}

            {addServerStep === 3 && (
              <div>
                <label htmlFor="addServerLabel" className="text-[13px] text-gray-300">Label</label>
                <input
                  id="addServerLabel"
                  type="text"
                  autoFocus
                  value={addServerForm.label}
                  onChange={(event) => setAddServerForm((prev) => ({ ...prev, label: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090B] px-4 py-3 text-base text-gray-200 outline-none focus:border-violet-500/50"
                  placeholder="Primary"
                />
              </div>
            )}

            <div className="pt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeAddServerModal}
                className="rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm text-gray-300 transition hover:bg-white/5"
              >
                Cancel
              </button>

              {addServerStep > 1 && (
                <button
                  type="button"
                  onClick={handleAddServerBack}
                  className="rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm text-gray-300 transition hover:bg-white/5"
                >
                  Back
                </button>
              )}

              {addServerStep < addServerWizardSteps.length ? (
                <button
                  type="button"
                  onClick={handleAddServerNext}
                  className="rounded-xl border border-violet-400/35 bg-violet-500/15 px-4 py-3 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/25"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateServer}
                  disabled={isCreatingServer}
                  className="rounded-xl border border-violet-400/35 bg-violet-500/15 px-4 py-3 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/25 disabled:opacity-60"
                >
                  {isCreatingServer ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
