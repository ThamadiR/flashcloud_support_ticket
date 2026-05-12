import { useEffect, useMemo, useRef, useState } from 'react';
import { Datepicker, Label } from 'flowbite-react';



import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Edit2, Plus, Search, ArrowLeft, Trash2, X, SlidersHorizontal, Check, ChevronRight, ChevronLeft, ArrowUpDown } from 'lucide-react';

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

  const idSortMenuRef = useRef<HTMLDivElement>(null);
  const companySortMenuRef = useRef<HTMLDivElement>(null);
  const companyIdSortMenuRef = useRef<HTMLDivElement>(null);
  const nameSortMenuRef = useRef<HTMLDivElement>(null);
  const descriptionSortMenuRef = useRef<HTMLDivElement>(null);
  const createdAtSortMenuRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [sortBy, setSortBy] = useState<'id' | 'company' | 'companyId' | 'name' | 'description' | 'createdAt'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isIdSortMenuOpen, setIsIdSortMenuOpen] = useState(false);
  const [isCompanySortMenuOpen, setIsCompanySortMenuOpen] = useState(false);
  const [isCompanyIdSortMenuOpen, setIsCompanyIdSortMenuOpen] = useState(false);
  const [isNameSortMenuOpen, setIsNameSortMenuOpen] = useState(false);
  const [isDescriptionSortMenuOpen, setIsDescriptionSortMenuOpen] = useState(false);
  const [isCreatedAtSortMenuOpen, setIsCreatedAtSortMenuOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);


  const [editingTenantId, setEditingTenantId] = useState<number | null>(null);

  const [tenantForm, setTenantForm] = useState({ name: '', description: '' });
  const [isSavingTenant, setIsSavingTenant] = useState(false);
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [isCreatingTenant, setIsCreatingTenant] = useState(false);
  const [addTenantForm, setAddTenantForm] = useState({
    companyId: companyId || '',
    name: '',
    description: '',
  });
  const [addTenantErrors, setAddTenantErrors] = useState<{ companyId?: string; name?: string; description?: string }>({});

  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    companyName: '',
    tenantName: '',
  });
  const [tempFilters, setTempFilters] = useState({
    fromDate: '',
    toDate: '',
    companyName: '',
    tenantName: '',
  });

  const filterDropdownRef = useRef<HTMLDivElement>(null);


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

  const closeAllSortMenus = () => {
    setIsIdSortMenuOpen(false);
    setIsCompanySortMenuOpen(false);
    setIsCompanyIdSortMenuOpen(false);
    setIsNameSortMenuOpen(false);
    setIsDescriptionSortMenuOpen(false);
    setIsCreatedAtSortMenuOpen(false);
  };

  const applyColumnSort = (
    field: 'id' | 'company' | 'companyId' | 'name' | 'description' | 'createdAt',
    nextSortOrder: 'asc' | 'desc'
  ) => {
    setSortBy(field);
    setSortOrder(nextSortOrder);
    closeAllSortMenus();
  };

  const filteredTenants = useMemo(() => {

    const keyword = searchTerm.trim().toLowerCase();
    let rows = tenants.filter((item) => {
      // Keyword Search
      const matchesKeyword = !keyword || (
        String(item.id).includes(keyword)
        || String(item.companyId).includes(keyword)
        || item.name.toLowerCase().includes(keyword)
        || (item.description || '').toLowerCase().includes(keyword)
        || String(item.company?.name || '').toLowerCase().includes(keyword)
      );

      // Date Range Filter
      let matchesDate = true;
      if (filters.fromDate || filters.toDate) {
        const itemDate = new Date(item.createdAt).getTime();
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
        if (item.company?.name !== filters.companyName) matchesCompany = false;
      }

      // Tenant Name Filter
      let matchesTenant = true;
      if (filters.tenantName) {
        if (item.name !== filters.tenantName) matchesTenant = false;
      }

      return matchesKeyword && matchesDate && matchesCompany && matchesTenant;
    });


    return rows.sort((a, b) => {
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
  }, [tenants, searchTerm, filters, sortBy, sortOrder]);

  const pagedTenants = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredTenants.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredTenants, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredTenants.length / rowsPerPage);



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        idSortMenuRef.current?.contains(target)
        || companySortMenuRef.current?.contains(target)
        || companyIdSortMenuRef.current?.contains(target)
        || nameSortMenuRef.current?.contains(target)
        || descriptionSortMenuRef.current?.contains(target)
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



  const startEditTenant = (tenant: TenantRecord) => {
    setEditingTenantId(tenant.id);
    setTenantForm({
      name: tenant.name,
      description: tenant.description || '',
    });
    setIsAddTenantModalOpen(true);
  };

  const cancelEditTenant = () => {
    setEditingTenantId(null);
    setTenantForm({ name: '', description: '' });
    setIsSavingTenant(false);
    setIsAddTenantModalOpen(false);
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

  const openAddTenantModal = () => {
    setAddTenantForm({
      companyId: companyId || '',
      name: '',
      description: '',
    });
    setEditingTenantId(null);
    setIsAddTenantModalOpen(true);
  };

  const closeAddTenantModal = () => {
    setIsAddTenantModalOpen(false);
    setAddTenantErrors({});
    setIsCreatingTenant(false);
  };


  const handleCreateTenant = async () => {
    const errors: { companyId?: string; name?: string; description?: string } = {};
    const parsedCompanyId = Number(addTenantForm.companyId);
    if (!Number.isFinite(parsedCompanyId) || parsedCompanyId <= 0) {
      errors.companyId = 'Company id must be a positive number';
    }
    if (!addTenantForm.name.trim()) {
      errors.name = 'Tenant name is required';
    }

    if (Object.keys(errors).length > 0) {
      setAddTenantErrors(errors);
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
        <main className={`p-4 ${mainMarginClass} min-h-[calc(100vh-80px)] pt-16 transition-all duration-300`}>
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

                <div className="relative" ref={filterDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFilterDropdownOpen(!isFilterDropdownOpen);
                      setTempFilters(filters);
                    }}
                    className={`h-[42px] px-3 rounded-xl border flex items-center gap-2 text-sm transition-all whitespace-nowrap ${isFilterDropdownOpen
                        ? (isDark ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600')
                        : (isDark ? 'bg-[#09090B] border-white/10 text-gray-300 hover:text-white' : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900')
                      }`}
                  >
                    <SlidersHorizontal size={15} /> Filter
                  </button>

                  {isFilterDropdownOpen && (
                    <div className={`absolute right-0 top-full z-[70] mt-2 w-[340px] rounded-2xl border p-5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? 'bg-[#10131A] border-white/10 shadow-black/60' : 'bg-white border-gray-100 shadow-gray-200/50'
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
                                onChange={(date: Date | null) => {
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
                                  popup: { 
                                    root: { base: `absolute top-12 left-0 z-50 block pt-2 ${isDark ? 'bg-[#0B0E14]' : 'bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-xl border border-gray-100'}` }, 
                                    header: { 
                                      base: "flex justify-between items-center mb-2 px-2", 
                                      title: "text-sm font-semibold text-gray-700 dark:text-gray-200",
                                      selectors: { button: { base: "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 rounded-lg transition-colors p-1" } } 
                                    },
                                    footer: { base: "hidden" } 
                                  },
                                  views: { days: { header: { base: "grid grid-cols-7 mb-1", title: "text-[0.75rem] font-medium text-gray-400 text-center" }, items: { base: "grid grid-cols-7", item: { base: "block flex-1 cursor-pointer rounded-lg border-0 text-center text-xs font-semibold leading-9 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5", selected: "bg-cyan-500 text-white hover:bg-cyan-600", disabled: "text-gray-300 dark:text-gray-600 cursor-not-allowed" } } } }
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] font-medium text-gray-400 mb-1 block">to</span>
                              <Datepicker
                                key={tempFilters.toDate || 'to-empty'}
                                placeholder="to"


                                value={tempFilters.toDate ? new Date(tempFilters.toDate) : undefined}
                                onChange={(date: Date | null) => {
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
                                  popup: { 
                                    root: { base: `absolute top-12 right-0 z-50 block pt-2 ${isDark ? 'bg-[#0B0E14]' : 'bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-xl border border-gray-100'}` }, 
                                    header: { 
                                      base: "flex justify-between items-center mb-2 px-2", 
                                      title: "text-sm font-semibold text-gray-700 dark:text-gray-200",
                                      selectors: { button: { base: "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 rounded-lg transition-colors p-1" } } 
                                    },
                                    footer: { base: "hidden" } 
                                  },
                                  views: { days: { header: { base: "grid grid-cols-7 mb-1", title: "text-[0.75rem] font-medium text-gray-400 text-center" }, items: { base: "grid grid-cols-7", item: { base: "block flex-1 cursor-pointer rounded-lg border-0 text-center text-xs font-semibold leading-9 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5", selected: "bg-cyan-500 text-white hover:bg-cyan-600", disabled: "text-gray-300 dark:text-gray-600 cursor-not-allowed" } } } }
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Company Name */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400">Company Name</span>
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
                            className={`w-full text-xs rounded-lg p-2 border outline-none ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                              }`}
                          >
                            <option value="">All companies</option>
                            {Array.from(new Set(tenants.map(t => t.company?.name).filter(Boolean))).sort().map(name => (
                              <option key={name} value={name!}>{name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Tenant Name */}
                        <div>

                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400">Tenant Name</span>
                            <button
                              onClick={() => setTempFilters(prev => ({ ...prev, tenantName: '' }))}
                              className="text-[10px] text-blue-500 hover:underline"
                            >
                              Reset
                            </button>
                          </div>
                          <select
                            value={tempFilters.tenantName}
                            onChange={(e) => setTempFilters(prev => ({ ...prev, tenantName: e.target.value }))}
                            className={`w-full text-xs rounded-lg p-2 border outline-none ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                              }`}
                          >
                            <option value="">All tenants</option>
                            {Array.from(new Set(tenants.map(t => t.name).filter(Boolean))).sort().map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                        <button
                          onClick={() => {
                            setTempFilters({ fromDate: '', toDate: '', companyName: '', tenantName: '' });
                            setFilters({ fromDate: '', toDate: '', companyName: '', tenantName: '' });
                          }}

                          className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                          Reset all
                        </button>
                        <button
                          onClick={() => {
                            setFilters(tempFilters);
                            setIsFilterDropdownOpen(false);
                          }}
                          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all shadow-lg ${isDark ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/20' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
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
                <div className="overflow-x-auto no-scrollbar">

                  <table className={`min-w-full divide-y text-left ${isDark ? 'divide-white/10' : 'divide-gray-100'}`}>
                    <thead className={`text-[0.75rem] uppercase tracking-[0.24em] ${isDark ? 'bg-black/20 text-slate-400' : 'bg-gray-50 text-gray-500'}`}>
                      <tr>
                        <th className="px-5 py-4 font-semibold">
                          <div className="relative inline-flex items-center gap-2" ref={idSortMenuRef}>
                            <span className="uppercase tracking-[0.2em]">ID</span>
                            <button
                              type="button"
                              onClick={() => {
                                closeAllSortMenus();
                                setIsIdSortMenuOpen(!isIdSortMenuOpen);
                              }}
                              className={`rounded-md p-1.5 transition-colors ${isDark ? 'hover:bg-white/10 text-cyan-400' : 'hover:bg-cyan-100 text-cyan-600'}`}
                            >
                              <ArrowUpDown size={12} className={sortBy === 'id' ? 'text-cyan-400' : 'opacity-50'} />
                            </button>
                            {isIdSortMenuOpen && (
                              <div className={`absolute left-0 top-full z-50 mt-2 w-32 rounded-xl border p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-200 ${isDark ? 'bg-[#111827] border-white/10 shadow-black/40' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
                                <button onClick={() => applyColumnSort('id', 'asc')} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all ${sortBy === 'id' && sortOrder === 'asc' ? 'bg-cyan-500/10 text-cyan-400' : 'hover:bg-white/5 text-slate-400'}`}>ASC</button>
                                <button onClick={() => applyColumnSort('id', 'desc')} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all ${sortBy === 'id' && sortOrder === 'desc' ? 'bg-cyan-500/10 text-cyan-400' : 'hover:bg-white/5 text-slate-400'}`}>DSC</button>
                              </div>
                            )}
                          </div>
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          <div className="relative inline-flex items-center gap-2" ref={companySortMenuRef}>
                            <span className="uppercase tracking-[0.2em]">Company</span>
                            <button
                              type="button"
                              onClick={() => {
                                closeAllSortMenus();
                                setIsCompanySortMenuOpen(!isCompanySortMenuOpen);
                              }}
                              className={`rounded-md p-1.5 transition-colors ${isDark ? 'hover:bg-white/10 text-cyan-400' : 'hover:bg-cyan-100 text-cyan-600'}`}
                            >
                              <ArrowUpDown size={12} className={sortBy === 'company' ? 'text-cyan-400' : 'opacity-50'} />
                            </button>
                            {isCompanySortMenuOpen && (
                              <div className={`absolute left-0 top-full z-50 mt-2 w-32 rounded-xl border p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-200 ${isDark ? 'bg-[#111827] border-white/10 shadow-black/40' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
                                <button onClick={() => applyColumnSort('company', 'asc')} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all ${sortBy === 'company' && sortOrder === 'asc' ? 'bg-cyan-500/10 text-cyan-400' : 'hover:bg-white/5 text-slate-400'}`}>ASC</button>
                                <button onClick={() => applyColumnSort('company', 'desc')} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all ${sortBy === 'company' && sortOrder === 'desc' ? 'bg-cyan-500/10 text-cyan-400' : 'hover:bg-white/5 text-slate-400'}`}>DSC</button>
                              </div>
                            )}
                          </div>
                        </th>

                        <th className="px-5 py-4 font-semibold whitespace-nowrap">
                          <div className="relative inline-flex items-center gap-2" ref={companyIdSortMenuRef}>
                            <span className="uppercase tracking-[0.2em]">Company ID</span>
                            <button
                              type="button"
                              onClick={() => {
                                closeAllSortMenus();
                                setIsCompanyIdSortMenuOpen(!isCompanyIdSortMenuOpen);
                              }}
                              className={`rounded-md p-1.5 transition-colors ${isDark ? 'hover:bg-white/10 text-cyan-400' : 'hover:bg-cyan-100 text-cyan-600'}`}
                            >
                              <ArrowUpDown size={12} className={sortBy === 'companyId' ? 'text-cyan-400' : 'opacity-50'} />
                            </button>
                            {isCompanyIdSortMenuOpen && (
                              <div className={`absolute left-0 top-full z-50 mt-2 w-32 rounded-xl border p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-200 ${isDark ? 'bg-[#111827] border-white/10 shadow-black/40' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
                                <button onClick={() => applyColumnSort('companyId', 'asc')} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all ${sortBy === 'companyId' && sortOrder === 'asc' ? 'bg-cyan-500/10 text-cyan-400' : 'hover:bg-white/5 text-slate-400'}`}>ASC</button>
                                <button onClick={() => applyColumnSort('companyId', 'desc')} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all ${sortBy === 'companyId' && sortOrder === 'desc' ? 'bg-cyan-500/10 text-cyan-400' : 'hover:bg-white/5 text-slate-400'}`}>DSC</button>
                              </div>
                            )}
                          </div>
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          <div className="relative inline-flex items-center gap-2" ref={nameSortMenuRef}>
                            <span className="uppercase tracking-[0.2em]">Name</span>
                            <button
                              type="button"
                              onClick={() => {
                                closeAllSortMenus();
                                setIsNameSortMenuOpen(!isNameSortMenuOpen);
                              }}
                              className={`rounded-md p-1.5 transition-colors ${isDark ? 'hover:bg-white/10 text-cyan-400' : 'hover:bg-cyan-100 text-cyan-600'}`}
                            >
                              <ArrowUpDown size={12} className={sortBy === 'name' ? 'text-cyan-400' : 'opacity-50'} />
                            </button>
                            {isNameSortMenuOpen && (
                              <div className={`absolute left-0 top-full z-50 mt-2 w-32 rounded-xl border p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-200 ${isDark ? 'bg-[#111827] border-white/10 shadow-black/40' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
                                <button onClick={() => applyColumnSort('name', 'asc')} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all ${sortBy === 'name' && sortOrder === 'asc' ? 'bg-cyan-500/10 text-cyan-400' : 'hover:bg-white/5 text-slate-400'}`}>ASC</button>
                                <button onClick={() => applyColumnSort('name', 'desc')} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all ${sortBy === 'name' && sortOrder === 'desc' ? 'bg-cyan-500/10 text-cyan-400' : 'hover:bg-white/5 text-slate-400'}`}>DSC</button>
                              </div>
                            )}
                          </div>
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          <div className="relative inline-flex items-center gap-2" ref={descriptionSortMenuRef}>
                            <span className="uppercase tracking-[0.2em]">Description</span>
                            <button
                              type="button"
                              onClick={() => {
                                closeAllSortMenus();
                                setIsDescriptionSortMenuOpen(!isDescriptionSortMenuOpen);
                              }}
                              className={`rounded-md p-1.5 transition-colors ${isDark ? 'hover:bg-white/10 text-cyan-400' : 'hover:bg-cyan-100 text-cyan-600'}`}
                            >
                              <ArrowUpDown size={12} className={sortBy === 'description' ? 'text-cyan-400' : 'opacity-50'} />
                            </button>
                            {isDescriptionSortMenuOpen && (
                              <div className={`absolute left-0 top-full z-50 mt-2 w-32 rounded-xl border p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-200 ${isDark ? 'bg-[#111827] border-white/10 shadow-black/40' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
                                <button onClick={() => applyColumnSort('description', 'asc')} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all ${sortBy === 'description' && sortOrder === 'asc' ? 'bg-cyan-500/10 text-cyan-400' : 'hover:bg-white/5 text-slate-400'}`}>ASC</button>
                                <button onClick={() => applyColumnSort('description', 'desc')} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all ${sortBy === 'description' && sortOrder === 'desc' ? 'bg-cyan-500/10 text-cyan-400' : 'hover:bg-white/5 text-slate-400'}`}>DSC</button>
                              </div>
                            )}
                          </div>
                        </th>

                        <th className="px-5 py-4 font-semibold whitespace-nowrap">
                          <div className="relative inline-flex items-center gap-2" ref={createdAtSortMenuRef}>
                            <span className="uppercase tracking-[0.2em]">Created At</span>
                            <button
                              type="button"
                              onClick={() => {
                                closeAllSortMenus();
                                setIsCreatedAtSortMenuOpen(!isCreatedAtSortMenuOpen);
                              }}
                              className={`rounded-md p-1.5 transition-colors ${isDark ? 'hover:bg-white/10 text-cyan-400' : 'hover:bg-cyan-100 text-cyan-600'}`}
                            >
                              <ArrowUpDown size={12} className={sortBy === 'createdAt' ? 'text-cyan-400' : 'opacity-50'} />
                            </button>
                            {isCreatedAtSortMenuOpen && (
                              <div className={`absolute left-0 top-full z-50 mt-2 w-32 rounded-xl border p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-200 ${isDark ? 'bg-[#111827] border-white/10 shadow-black/40' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
                                <button onClick={() => applyColumnSort('createdAt', 'asc')} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all ${sortBy === 'createdAt' && sortOrder === 'asc' ? 'bg-cyan-500/10 text-cyan-400' : 'hover:bg-white/5 text-slate-400'}`}>ASC</button>
                                <button onClick={() => applyColumnSort('createdAt', 'desc')} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all ${sortBy === 'createdAt' && sortOrder === 'desc' ? 'bg-cyan-500/10 text-cyan-400' : 'hover:bg-white/5 text-slate-400'}`}>DSC</button>
                              </div>
                            )}
                          </div>
                        </th>

                        <th className="px-5 py-4 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>

                    <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                      {pagedTenants.map((item) => (
                        <tr key={item.id} className={`group transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'}`}>
                          <td className={`px-5 py-4 font-medium ${isDark ? 'text-slate-300' : 'text-gray-900'}`} style={{ fontSize: '12px' }}>{item.id}</td>
                          <td className={`px-5 py-4 whitespace-nowrap ${isDark ? 'text-cyan-300/80' : 'text-cyan-700'}`} style={{ fontSize: '12px' }}>{item.company?.name || 'N/A'}</td>
                          <td className={`px-5 py-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} style={{ fontSize: '12px' }}>{item.companyId}</td>
                          <td className={`px-5 py-4 ${isDark ? 'text-slate-300' : 'text-gray-700'}`} style={{ fontSize: '12px' }}>
                            {item.name}
                          </td>
                          <td className={`px-5 py-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} style={{ fontSize: '12px' }}>
                            {item.description || <span className="italic opacity-40">No description</span>}
                          </td>
                          <td className={`px-5 py-4 whitespace-nowrap ${isDark ? 'text-slate-500' : 'text-gray-400'}`} style={{ fontSize: '12px' }}>{item.createdAt ?? '—'}</td>
                          <td className="px-5 py-4" style={{ fontSize: '12px' }}>
                            <div className="flex items-center justify-center gap-2">
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

                  <div className="flex items-center gap-1">
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
            )}
          </div>

          {isAddTenantModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className={`w-full max-w-xl rounded-3xl border p-6 shadow-2xl transition-all duration-500 ${isDark ? 'border-white/10 bg-[#0B1220]' : 'border-gray-200 bg-white'}`}>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{editingTenantId ? 'Edit Tenant' : 'Add Tenant'}</h2>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{editingTenantId ? `Update details for ${tenantForm.name}` : companyName ? `Create a tenant for ${companyName}.` : 'Create a new tenant record.'}</p>
                  </div>
                  <button onClick={cancelEditTenant} className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all ${isDark ? 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}><X size={18} /></button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className={`mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Company ID *</label>
                      <input
                        type="number"
                        disabled={!!editingTenantId}
                        value={editingTenantId ? String(tenants.find(t => t.id === editingTenantId)?.companyId || '') : addTenantForm.companyId}
                        onChange={(e) => setAddTenantForm({ ...addTenantForm, companyId: e.target.value })}
                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${isDark ? 'border-white/10 bg-black/40 text-white focus:border-blue-500/50' : 'border-gray-200 bg-gray-50 focus:border-blue-500/50 focus:bg-white'} ${editingTenantId ? 'opacity-50 cursor-not-allowed' : ''}`}
                        placeholder="Enter company ID"
                      />
                      {!editingTenantId && addTenantErrors.companyId && <p className="mt-1 text-xs text-rose-400">{addTenantErrors.companyId}</p>}
                    </div>

                    <div>
                      <label className={`mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Tenant Name *</label>
                      <input
                        autoFocus
                        value={editingTenantId ? tenantForm.name : addTenantForm.name}
                        onChange={(e) => {
                          if (editingTenantId) setTenantForm({ ...tenantForm, name: e.target.value });
                          else setAddTenantForm({ ...addTenantForm, name: e.target.value });
                        }}
                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${isDark ? 'border-white/10 bg-black/40 text-white focus:border-blue-500/50' : 'border-gray-200 bg-gray-50 focus:border-blue-500/50 focus:bg-white'}`}
                        placeholder="Enter tenant name"
                      />
                      {!editingTenantId && addTenantErrors.name && <p className="mt-1 text-xs text-rose-400">{addTenantErrors.name}</p>}
                    </div>

                    <div>
                      <label className={`mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Description</label>
                      <textarea
                        rows={4}
                        value={editingTenantId ? tenantForm.description : addTenantForm.description}
                        onChange={(e) => {
                          if (editingTenantId) setTenantForm({ ...tenantForm, description: e.target.value });
                          else setAddTenantForm({ ...addTenantForm, description: e.target.value });
                        }}
                        className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-all ${isDark ? 'border-white/10 bg-black/40 text-white focus:border-blue-500/50' : 'border-gray-200 bg-gray-50 focus:border-blue-500/50 focus:bg-white'}`}
                        placeholder="Enter tenant description"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end items-center gap-4 pt-6 mt-6 border-t border-white/5">
                  <button
                    onClick={cancelEditTenant}
                    className={`text-sm font-bold transition-all ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (editingTenantId) void saveTenantEdit(editingTenantId);
                      else void handleCreateTenant();
                    }}
                    disabled={editingTenantId ? isSavingTenant : isCreatingTenant}
                    className={`rounded-xl px-8 py-3 text-sm font-bold transition-all ${isDark ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'}`}
                  >
                    {editingTenantId ? (isSavingTenant ? 'Saving...' : 'Update Tenant') : (isCreatingTenant ? 'Saving...' : 'Save Tenant')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
