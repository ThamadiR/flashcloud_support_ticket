import { useEffect, useMemo, useRef, useState } from 'react';
import { Datepicker, Label } from 'flowbite-react';

import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowUpDown, Edit2, Plus, Save, Search, ServerCog, SlidersHorizontal, Trash2, X } from 'lucide-react';

import { API_BASE_URL } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { useDrawer } from '../context/DrawerContext';

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



export default function ServersListUI({ token, onUnauthorized }: ServersListUIProps) {
  const { isDark } = useTheme();
  const { isDrawerOpen } = useDrawer();
  const mainMarginClass = isDrawerOpen ? "md:ml-64" : "md:ml-20";
  const navigate = useNavigate();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const companyIdParam = params.get('companyId')?.trim() || '';
  const companyName = params.get('companyName')?.trim() || '';
  const companyId = companyIdParam ? Number(companyIdParam) : NaN;
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
  
  const [isEditServerModalOpen, setIsEditServerModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerRecord | null>(null);
  const [isUpdatingServer, setIsUpdatingServer] = useState(false);
  const [editForm, setEditForm] = useState({ ipAddress: '', label: '' });

  const [isAddServerModalOpen, setIsAddServerModalOpen] = useState(false);
  const [addServerStep, setAddServerStep] = useState(1);
  const [isCreatingServer, setIsCreatingServer] = useState(false);
  const [addServerForm, setAddServerForm] = useState({
    companyId: companyIdParam || '',
    ipAddress: '',
    label: '',
  });
  const [addServerErrors, setAddServerErrors] = useState<{ companyId?: string; ipAddress?: string; label?: string }>({});

  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    companyName: '',
    ipAddress: '',
  });
  const [tempFilters, setTempFilters] = useState({
    fromDate: '',
    toDate: '',
    companyName: '',
    ipAddress: '',
  });

  const filterDropdownRef = useRef<HTMLDivElement>(null);


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

      const htmlTarget = event.target as HTMLElement;
      const isDatepickerClick = htmlTarget.closest('.datepicker') || htmlTarget.closest('[data-testid="datepicker-popup"]');
      
      if (filterDropdownRef.current && 
          !filterDropdownRef.current.contains(htmlTarget) && 
          !isDatepickerClick) {
        setIsFilterDropdownOpen(false);
      }

      closeAllSortMenus();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterDropdownOpen]);


  const filteredServers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = servers.filter((server) => {

      // Keyword Search
      const matchesKeyword = !normalizedSearch || (
        String(server.id).includes(normalizedSearch)
        || server.ipAddress.toLowerCase().includes(normalizedSearch)
        || server.label.toLowerCase().includes(normalizedSearch)
        || String(server.companyId).includes(normalizedSearch)
        || String(server.company?.name || '').toLowerCase().includes(normalizedSearch)
      );

      // Date Range Filter
      let matchesDate = true;
      if (filters.fromDate || filters.toDate) {
        const itemDate = new Date(server.createdAt).getTime();
        if (filters.fromDate) {
          const from = new Date(filters.fromDate).getTime();
          if (itemDate < from) matchesDate = false;
        }
        if (filters.toDate) {
          const to = new Date(filters.toDate).getTime();
          const toEndOfDay = to + (24 * 60 * 60 * 1000) - 1;
          if (itemDate > toEndOfDay) matchesDate = false;
        }
      }

      // Company Name Filter
      let matchesCompany = true;
      if (filters.companyName) {
        if (server.company?.name !== filters.companyName) matchesCompany = false;
      }

      // IP Address Filter
      let matchesIp = true;
      if (filters.ipAddress) {
        if (!server.ipAddress.toLowerCase().includes(filters.ipAddress.toLowerCase())) matchesIp = false;
      }

      return matchesKeyword && matchesDate && matchesCompany && matchesIp;
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

  const openEditServerModal = (server: ServerRecord) => {
    setEditingServer(server);
    setEditForm({
      ipAddress: server.ipAddress,
      label: server.label || '',
    });
    setIsEditServerModalOpen(true);
  };

  const closeEditServerModal = () => {
    setIsEditServerModalOpen(false);
    setEditingServer(null);
    setEditForm({ ipAddress: '', label: '' });
    setIsUpdatingServer(false);
  };

  const handleUpdateServer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingServer) return;

    try {
      const trimmedIp = editForm.ipAddress.trim();
      const trimmedLabel = editForm.label.trim();

      if (!trimmedIp) {
        toast.error('IP address is required');
        return;
      }

      setIsUpdatingServer(true);
      const response = await fetch(`${API_BASE_URL}/api/servers/${editingServer.id}`, {
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

      setServers((prev) => prev.map((row) => (row.id === editingServer.id ? payload.server as ServerRecord : row)));
      closeEditServerModal();
      toast.success('Server updated');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Failed to update server';
      toast.error(message);
    } finally {
      setIsUpdatingServer(false);
    }
  };

  const handleDeleteServer = async (serverId: number) => {
    if (!window.confirm('Are you sure you want to delete this server?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/servers/${serverId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
          onUnauthorized();
          return;
        }
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to delete server');
      }

      setServers((prev) => prev.filter((s) => s.id !== serverId));
      toast.success('Server deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete server');
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
    <div className={`min-h-screen flex flex-col transition-all duration-300 ${isDark ? 'bg-[#030712] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex-grow">
        <main className={`p-4 ${mainMarginClass} min-h-[calc(100vh-80px)] pt-24 transition-all duration-300`}>
          <div className={`w-full rounded-3xl border p-4 backdrop-blur-xl sm:p-6 transition-all duration-300 ${
            isDark 
              ? 'border-white/10 bg-white/5 shadow-[0_20px_80px_rgba(0,0,0,0.35)]' 
              : 'border-gray-200 bg-white shadow-xl shadow-gray-200/50'
          }`}>
            {/* Header section */}
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
                    <ServerCog size={20} />
                  </div>
                  <div>
                    <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {companyName ? `${companyName} Servers` : 'Server List'}
                    </h1>
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                      {companyName
                        ? `Showing server records for ${companyName}.`
                        : 'Open servers from a company row to view company-specific records.'}
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
                    placeholder="Search name, IP address, or label"
                    className={`w-full bg-transparent text-sm outline-none placeholder:text-slate-500 ${isDark ? 'text-white' : 'text-gray-900'}`}
                  />
                </label>

                <div className="relative" ref={filterDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFilterDropdownOpen(!isFilterDropdownOpen);
                      setTempFilters(filters);
                    }}
                    className={`h-[42px] px-3 rounded-xl border flex items-center gap-2 text-sm transition-all whitespace-nowrap ${
                      isFilterDropdownOpen 
                        ? (isDark ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600')
                        : (isDark ? 'bg-[#09090B] border-white/10 text-gray-300 hover:text-white' : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900')
                    }`}
                  >
                    <SlidersHorizontal size={15} /> Filter
                  </button>

                  {isFilterDropdownOpen && (
                    <div className={`absolute right-0 top-full z-[70] mt-2 w-[340px] rounded-2xl border p-5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 ${
                      isDark ? 'bg-[#10131A] border-white/10 shadow-black/60' : 'bg-white border-gray-100 shadow-gray-200/50'
                    }`}>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-white/5">
                        <h4 className="font-semibold text-sm">Filter</h4>
                      </div>

                      <div className="space-y-4">
                        {/* Date Range */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Publishing Date (MM/DD/YYYY)</span>
                            <button 
                              onClick={() => setTempFilters(prev => ({ ...prev, fromDate: '', toDate: '' }))}
                              className="text-[10px] text-blue-500 hover:underline"
                            >
                              Reset
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <span className="text-[10px] font-medium text-gray-400 mb-1 block">from</span>
                              <Datepicker
                                key={tempFilters.fromDate || 'from-empty'}
                                placeholder="From"


                                value={tempFilters.fromDate ? new Date(tempFilters.fromDate) : undefined}
                                onSelectedDateChanged={(date) => {
                                  if (date) {
                                    const yyyy = date.getFullYear();
                                    const mm = String(date.getMonth() + 1).padStart(2, '0');
                                    const dd = String(date.getDate()).padStart(2, '0');
                                    const dateStr = `${yyyy}-${mm}-${dd}`;
                                    setTempFilters(prev => ({ ...prev, fromDate: dateStr }));
                                    setFilters(prev => ({ ...prev, fromDate: dateStr }));

                                  }
                                }}
                                theme={{
                                  root: { input: { base: `block w-full rounded-lg border text-xs outline-none py-2.5 px-4 transition-all ${isDark ? 'bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20'}` } },
                                  popup: { root: { base: `absolute top-12 left-0 z-50 block pt-2 ${isDark ? 'bg-[#0B0E14]' : 'bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-xl border border-gray-100'}` }, footer: { base: "hidden" } },
                                  header: { root: { base: "flex justify-between items-center mb-2 px-2", title: "text-sm font-semibold text-gray-700 dark:text-gray-200" }, selectors: { button: { base: "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 rounded-lg transition-colors p-1" } } },
                                  views: { days: { header: { base: "grid grid-cols-7 mb-1", title: "text-[11px] font-medium text-gray-400 text-center" }, items: { base: "grid grid-cols-7", item: { base: "block flex-1 cursor-pointer rounded-lg border-0 text-center text-xs font-semibold leading-9 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5", selected: "bg-cyan-500 text-white hover:bg-cyan-600", disabled: "text-gray-300 dark:text-gray-600 cursor-not-allowed" } } } }
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] font-medium text-gray-400 mb-1 block">to</span>
                              <Datepicker
                                key={tempFilters.toDate || 'to-empty'}
                                placeholder="to"


                                value={tempFilters.toDate ? new Date(tempFilters.toDate) : undefined}
                                onSelectedDateChanged={(date) => {
                                  if (date) {
                                    const yyyy = date.getFullYear();
                                    const mm = String(date.getMonth() + 1).padStart(2, '0');
                                    const dd = String(date.getDate()).padStart(2, '0');
                                    const dateStr = `${yyyy}-${mm}-${dd}`;
                                    setTempFilters(prev => ({ ...prev, toDate: dateStr }));
                                    setFilters(prev => ({ ...prev, toDate: dateStr }));

                                  }
                                }}
                                theme={{
                                  root: { input: { base: `block w-full rounded-lg border text-xs outline-none py-2.5 px-4 transition-all ${isDark ? 'bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20'}` } },
                                  popup: { root: { base: `absolute top-12 right-0 z-50 block pt-2 ${isDark ? 'bg-[#0B0E14]' : 'bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-xl border border-gray-100'}` }, footer: { base: "hidden" } },
                                  header: { root: { base: "flex justify-between items-center mb-2 px-2", title: "text-sm font-semibold text-gray-700 dark:text-gray-200" }, selectors: { button: { base: "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 rounded-lg transition-colors p-1" } } },
                                  views: { days: { header: { base: "grid grid-cols-7 mb-1", title: "text-[11px] font-medium text-gray-400 text-center" }, items: { base: "grid grid-cols-7", item: { base: "block flex-1 cursor-pointer rounded-lg border-0 text-center text-xs font-semibold leading-9 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5", selected: "bg-cyan-500 text-white hover:bg-cyan-600", disabled: "text-gray-300 dark:text-gray-600 cursor-not-allowed" } } } }
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Company Name */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Company Name</span>
                            <button 
                              onClick={() => setTempFilters(prev => ({ ...prev, companyName: '' }))}
                              className="text-[10px] text-blue-500 hover:underline"
                            >
                              Reset
                            </button>
                          </div>
                          <select
                            value={tempFilters.companyName}
                            onChange={(e) => setTempFilters(prev => ({ ...prev, companyName: e.target.value }))}
                            className={`w-full text-xs rounded-lg p-2 border outline-none ${
                              isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                            }`}
                          >
                            <option value="">All companies</option>
                            {Array.from(new Set(servers.map(s => s.company?.name).filter(Boolean))).sort().map(name => (
                              <option key={name} value={name!}>{name}</option>
                            ))}
                          </select>
                        </div>

                        {/* IP Address */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">IP Address</span>
                            <button 
                              onClick={() => setTempFilters(prev => ({ ...prev, ipAddress: '' }))}
                              className="text-[10px] text-blue-500 hover:underline"
                            >
                              Reset
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Enter IP address..."
                            value={tempFilters.ipAddress}
                            onChange={(e) => setTempFilters(prev => ({ ...prev, ipAddress: e.target.value }))}
                            className={`w-full text-xs rounded-lg p-2.5 border outline-none transition-all ${
                              isDark ? 'bg-black/20 border-white/10 text-white focus:border-blue-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500/50'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                        <button
                          onClick={() => {
                            setTempFilters({ fromDate: '', toDate: '', companyName: '', ipAddress: '' });
                            setFilters({ fromDate: '', toDate: '', companyName: '', ipAddress: '' });
                          }}

                          className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                            isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          Reset all
                        </button>
                        <button
                          onClick={() => {
                            setFilters(tempFilters);
                            setIsFilterDropdownOpen(false);
                          }}
                          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all shadow-lg ${
                            isDark ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/20' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
                          }`}
                        >
                          Apply now
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={openAddServerModal}
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
                Loading servers...
              </div>
            ) : filteredServers.length === 0 ? (
              <div className={`rounded-3xl border border-dashed px-6 py-16 text-center text-sm ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                No server records found.
              </div>
            ) : (
              <div className={`overflow-hidden rounded-3xl border shadow-lg transition-all duration-300 ${isDark ? 'border-white/10 bg-white/5 shadow-black/40' : 'border-gray-200 bg-white shadow-gray-200/20'}`}>
                <div className="overflow-x-auto">
                  <table className={`min-w-full divide-y text-left ${isDark ? 'divide-white/10' : 'divide-gray-100'}`}>
                    <thead className={`text-[11px] uppercase tracking-[0.24em] ${isDark ? 'bg-black/20 text-slate-400' : 'bg-gray-50 text-gray-500'}`}>
                      <tr>
                        <th className="px-5 py-4 font-semibold">
                          <div className="relative inline-flex items-center gap-2" ref={idSortMenuRef}>
                            <span>ID</span>
                            <button
                              type="button"
                              onClick={() => {
                                const isOpen = isIdSortMenuOpen;
                                closeAllSortMenus();
                                setIsIdSortMenuOpen(!isOpen);
                              }}
                              className="rounded-md p-1 transition-colors hover:bg-white/10"
                            >
                              <ArrowUpDown size={13} />
                            </button>
                            {isIdSortMenuOpen && (
                              <div className={`absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border p-1 shadow-xl ${isDark ? 'border-white/10 bg-[#111318]' : 'border-gray-200 bg-white'}`}>
                                <button
                                  type="button"
                                  onClick={() => applyColumnSort('id', 'asc')}
                                  className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                                    sortBy === 'id' && sortOrder === 'asc'
                                      ? 'bg-blue-500/20 text-blue-300'
                                      : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
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
                                      : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
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
                                const isOpen = isCompanySortMenuOpen;
                                closeAllSortMenus();
                                setIsCompanySortMenuOpen(!isOpen);
                              }}
                              className="rounded-md p-1 transition-colors hover:bg-white/10"
                            >
                              <ArrowUpDown size={13} />
                            </button>
                            {isCompanySortMenuOpen && (
                              <div className={`absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border p-1 shadow-xl ${isDark ? 'border-white/10 bg-[#111318]' : 'border-gray-200 bg-white'}`}>
                                <button
                                  type="button"
                                  onClick={() => applyColumnSort('company', 'asc')}
                                  className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                                    sortBy === 'company' && sortOrder === 'asc'
                                      ? 'bg-blue-500/20 text-blue-300'
                                      : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
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
                                      : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
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
                                const isOpen = isIpAddressSortMenuOpen;
                                closeAllSortMenus();
                                setIsIpAddressSortMenuOpen(!isOpen);
                              }}
                              className="rounded-md p-1 transition-colors hover:bg-white/10"
                            >
                              <ArrowUpDown size={13} />
                            </button>
                            {isIpAddressSortMenuOpen && (
                              <div className={`absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border p-1 shadow-xl ${isDark ? 'border-white/10 bg-[#111318]' : 'border-gray-200 bg-white'}`}>
                                <button
                                  type="button"
                                  onClick={() => applyColumnSort('ipAddress', 'asc')}
                                  className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                                    sortBy === 'ipAddress' && sortOrder === 'asc'
                                      ? 'bg-blue-500/20 text-blue-300'
                                      : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
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
                                      : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
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
                                const isOpen = isLabelSortMenuOpen;
                                closeAllSortMenus();
                                setIsLabelSortMenuOpen(!isOpen);
                              }}
                              className="rounded-md p-1 transition-colors hover:bg-white/10"
                            >
                              <ArrowUpDown size={13} />
                            </button>
                            {isLabelSortMenuOpen && (
                              <div className={`absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border p-1 shadow-xl ${isDark ? 'border-white/10 bg-[#111318]' : 'border-gray-200 bg-white'}`}>
                                <button
                                  type="button"
                                  onClick={() => applyColumnSort('label', 'asc')}
                                  className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                                    sortBy === 'label' && sortOrder === 'asc'
                                      ? 'bg-blue-500/20 text-blue-300'
                                      : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
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
                                      : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
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
                            <span>Created At</span>
                            <button
                              type="button"
                              onClick={() => {
                                const isOpen = isCreatedAtSortMenuOpen;
                                closeAllSortMenus();
                                setIsCreatedAtSortMenuOpen(!isOpen);
                              }}
                              className="rounded-md p-1 transition-colors hover:bg-white/10"
                            >
                              <ArrowUpDown size={13} />
                            </button>
                            {isCreatedAtSortMenuOpen && (
                              <div className={`absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border p-1 shadow-xl ${isDark ? 'border-white/10 bg-[#111318]' : 'border-gray-200 bg-white'}`}>
                                <button
                                  type="button"
                                  onClick={() => applyColumnSort('createdAt', 'asc')}
                                  className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                                    sortBy === 'createdAt' && sortOrder === 'asc'
                                      ? 'bg-blue-500/20 text-blue-300'
                                      : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
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
                                      : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  dsc
                                </button>
                              </div>
                            )}
                          </div>
                        </th>
                        <th className="px-5 py-4 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-white/8' : 'divide-gray-50'}`}>
                      {filteredServers.map((server) => (
                        <tr key={server.id} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-blue-50/50'}`}>
                          <td className={`px-5 py-4 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{server.id}</td>
                          <td className={`px-5 py-4 text-sm font-medium ${isDark ? 'text-violet-200' : 'text-violet-600 font-semibold'}`}>
                            {server.company?.name || 'N/A'}
                          </td>
                          <td className={`px-5 py-4 text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                            {server.ipAddress}
                          </td>
                          <td className={`px-5 py-4 text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                            {server.label || '-'}
                          </td>
                          <td className={`px-5 py-4 text-sm font-mono whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            {server.createdAt ?? '—'}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditServerModal(server)}
                                className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${
                                  isDark 
                                    ? 'border-blue-400/30 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20' 
                                    : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-300'
                                }`}
                                title="Edit"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteServer(server.id)}
                                className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${
                                  isDark 
                                    ? 'border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20' 
                                    : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300'
                                }`}
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
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


          {/* Add Server Modal */}
          {isAddServerModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className={`w-full max-w-xl rounded-3xl border p-5 shadow-2xl ${isDark ? 'border-white/10 bg-[#0B1220]' : 'border-gray-200 bg-white'}`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add Server</h2>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      {companyName ? `Create a server for ${companyName}.` : 'Create a new server record.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeAddServerModal}
                    className={`rounded-full border p-2 transition-all ${
                      isDark 
                        ? 'border-white/10 text-slate-300 hover:border-white/20 hover:text-white hover:bg-white/5' 
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className={`mb-6 rounded-2xl border px-4 py-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.2em]">
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Step {addServerStep} of {addServerWizardSteps.length}</span>
                    <span className={isDark ? 'text-cyan-400' : 'text-cyan-600'}>{addServerWizardSteps[addServerStep - 1]?.title}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {addServerWizardSteps.map((step) => (
                      <div
                        key={step.step}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          addServerStep >= step.step 
                            ? isDark ? 'bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'bg-cyan-600' 
                            : isDark ? 'bg-white/10' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {addServerStep === 1 && (
                    <div>
                      <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Company ID</label>
                      <input
                        type="number"
                        autoFocus
                        value={addServerForm.companyId}
                        onChange={(e) => setAddServerForm({ ...addServerForm, companyId: e.target.value })}
                        className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all ${
                          addServerErrors.companyId
                            ? 'border-rose-500/50 bg-rose-500/5 focus:border-rose-500'
                            : isDark 
                              ? 'border-white/10 bg-black/20 text-white placeholder:text-slate-500 focus:border-cyan-400/40' 
                              : 'border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500/40'
                        }`}
                        placeholder="Enter company ID"
                      />
                      {addServerErrors.companyId && <p className="mt-2 text-xs text-rose-400">{addServerErrors.companyId}</p>}
                    </div>
                  )}

                  {addServerStep === 2 && (
                    <div>
                      <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>IP Address</label>
                      <input
                        type="text"
                        autoFocus
                        value={addServerForm.ipAddress}
                        onChange={(e) => setAddServerForm({ ...addServerForm, ipAddress: e.target.value })}
                        className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all ${
                          addServerErrors.ipAddress
                            ? 'border-rose-500/50 bg-rose-500/5 focus:border-rose-500'
                            : isDark 
                              ? 'border-white/10 bg-black/20 text-white placeholder:text-slate-500 focus:border-cyan-400/40' 
                              : 'border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500/40'
                        }`}
                        placeholder="e.g. 192.168.1.1"
                      />
                      {addServerErrors.ipAddress && <p className="mt-2 text-xs text-rose-400">{addServerErrors.ipAddress}</p>}
                    </div>
                  )}

                  {addServerStep === 3 && (
                    <div>
                      <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Label</label>
                      <input
                        type="text"
                        autoFocus
                        value={addServerForm.label}
                        onChange={(e) => setAddServerForm({ ...addServerForm, label: e.target.value })}
                        className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all ${
                          isDark 
                            ? 'border-white/10 bg-black/20 text-white placeholder:text-slate-500 focus:border-cyan-400/40' 
                            : 'border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500/40'
                        }`}
                        placeholder="e.g. Production Server"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  {addServerStep > 1 && (
                    <button
                      type="button"
                      onClick={handleAddServerBack}
                      className={`h-[42px] rounded-xl border px-6 text-sm font-medium transition-all ${
                        isDark 
                          ? 'border-white/10 text-slate-300 hover:border-white/20 hover:text-white hover:bg-white/5' 
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={addServerStep === addServerWizardSteps.length ? handleCreateServer : handleAddServerNext}
                    disabled={isCreatingServer}
                    className={`h-[42px] rounded-xl border px-6 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                      isDark 
                        ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20' 
                        : 'border-cyan-500/30 bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm'
                    }`}
                  >
                    {isCreatingServer ? 'Saving...' : addServerStep === addServerWizardSteps.length ? 'Create Server' : 'Next'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Server Modal */}
          {isEditServerModalOpen && editingServer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className={`w-full max-w-xl rounded-3xl border p-5 shadow-2xl ${isDark ? 'border-white/10 bg-[#0B1220]' : 'border-gray-200 bg-white'}`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Edit Server</h2>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Update server record for {editingServer.company?.name || 'N/A'}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeEditServerModal}
                    className={`rounded-full border p-2 transition-all ${
                      isDark 
                        ? 'border-white/10 text-slate-300 hover:border-white/20 hover:text-white hover:bg-white/5' 
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleUpdateServer} className="space-y-4">
                  <div>
                    <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>IP Address</label>
                    <input
                      type="text"
                      value={editForm.ipAddress}
                      onChange={(e) => setEditForm({ ...editForm, ipAddress: e.target.value })}
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all ${
                        isDark 
                          ? 'border-white/10 bg-black/20 text-white placeholder:text-slate-500 focus:border-cyan-400/40' 
                          : 'border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500/40'
                      }`}
                      placeholder="e.g. 192.168.1.1"
                      required
                    />
                  </div>

                  <div>
                    <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Label</label>
                    <input
                      type="text"
                      value={editForm.label}
                      onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all ${
                        isDark 
                          ? 'border-white/10 bg-black/20 text-white placeholder:text-slate-500 focus:border-cyan-400/40' 
                          : 'border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500/40'
                      }`}
                      placeholder="e.g. Main Server"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeEditServerModal}
                      className={`h-[42px] rounded-xl border px-4 text-sm transition-all ${
                        isDark 
                          ? 'border-white/10 text-slate-300 hover:border-white/20 hover:text-white hover:bg-white/5' 
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingServer}
                      className={`h-[42px] rounded-xl border px-4 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                        isDark 
                          ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20' 
                          : 'border-cyan-500/30 bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm'
                      }`}
                    >
                      {isUpdatingServer ? 'Saving...' : 'Update Server'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
