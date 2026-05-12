import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowUpDown, Edit2, Plus, Search, SlidersHorizontal, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { useDrawer } from '../context/DrawerContext';

type CustomizationRecord = {
  id: number;
  subsectionId: number | null;
  companyId: number | null;
  name: string;
  description: string;
  tenantCount: number;
  createdAt: string;
  company: null | {
    id: number;
    name: string;
  };
  subsection: null | {
    id: number;
    name: string;
    description: string;
    sectionId: number | null;
    createdAt: string;
  };
};

type CustomizationsResponse = {
  customizations?: CustomizationRecord[];
};

type CustomizationSubsectionOption = {
  id: number;
  sectionId: number | null;
  name: string;
};

type CustomizationSectionOption = {
  id: number;
  name: string;
};

type CustomizationListUIProps = {
  token: string;
  onUnauthorized: () => void;
};

export default function CustomizationListUI({ token, onUnauthorized }: CustomizationListUIProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDark } = useTheme();
  const { isDrawerOpen } = useDrawer();
  const mainMarginClass = isDrawerOpen ? "md:ml-64" : "md:ml-20";
  const [isEditCustomizationOpen, setIsEditCustomizationOpen] = useState(false);
  const [editingCustomization, setEditingCustomization] = useState<CustomizationRecord | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    sectionId: '',
    subsectionId: '',
  });
  const [isUpdatingCustomization, setIsUpdatingCustomization] = useState(false);
  const nameSortMenuRef = useRef<HTMLDivElement>(null);
  const subsectionSortMenuRef = useRef<HTMLDivElement>(null);
  const descriptionSortMenuRef = useRef<HTMLDivElement>(null);
  const tenantCountSortMenuRef = useRef<HTMLDivElement>(null);
  const createdAtSortMenuRef = useRef<HTMLDivElement>(null);

  const companyIdParam = searchParams.get('companyId')?.trim() || '';
  const companyName = searchParams.get('companyName')?.trim() || '';
  const companyId = companyIdParam ? Number(companyIdParam) : NaN;

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customizations, setCustomizations] = useState<CustomizationRecord[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'subsection' | 'description' | 'tenantCount' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isNameSortMenuOpen, setIsNameSortMenuOpen] = useState(false);
  const [isSubsectionSortMenuOpen, setIsSubsectionSortMenuOpen] = useState(false);
  const [isDescriptionSortMenuOpen, setIsDescriptionSortMenuOpen] = useState(false);
  const [isTenantCountSortMenuOpen, setIsTenantCountSortMenuOpen] = useState(false);
  const [isCreatedAtSortMenuOpen, setIsCreatedAtSortMenuOpen] = useState(false);
  const [isAddCustomizationOpen, setIsAddCustomizationOpen] = useState(false);
  const [isSavingCustomization, setIsSavingCustomization] = useState(false);
  const [sections, setSections] = useState<CustomizationSectionOption[]>([]);
  const [createSubsections, setCreateSubsections] = useState<CustomizationSubsectionOption[]>([]);
  const [editSubsections, setEditSubsections] = useState<CustomizationSubsectionOption[]>([]);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    sectionId: '',
    subsectionId: '',
  });

  useEffect(() => {
    const loadCustomizations = async () => {
      try {
        setLoading(true);
        setError('');

        if (!Number.isFinite(companyId) || companyId <= 0) {
          throw new Error('Open customizations from a company row to load company-specific records.');
        }

        const response = await fetch(`${API_BASE_URL}/api/customizations?companyId=${companyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast.error('Session expired. Please log in again.');
            onUnauthorized();
            return;
          }

          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to load customizations');
        }

        const payload = (await response.json()) as CustomizationsResponse;
        setCustomizations(payload.customizations || []);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Failed to load customizations';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadCustomizations();
  }, [companyId, onUnauthorized, token]);

  useEffect(() => {
    const loadSections = async () => {
      try {
        if (!Number.isFinite(companyId) || companyId <= 0) {
          setSections([]);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/customization-sections?companyId=${companyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast.error('Session expired. Please log in again.');
            onUnauthorized();
          }
          return;
        }

        const payload = await response.json();
        setSections((payload.sections || []).map((section: any) => ({
          id: Number(section.id),
          name: String(section.name || ''),
        })));
      } catch (loadError) {
        console.error('Load customization sections error:', loadError);
      }
    };

    loadSections();
  }, [companyId, onUnauthorized, token]);

  useEffect(() => {
    const loadSubsections = async () => {
      try {
        const sectionId = createForm.sectionId.trim() ? Number(createForm.sectionId) : NaN;
        if (!Number.isFinite(sectionId) || sectionId <= 0) {
          setCreateSubsections([]);
          return;
        }

        console.log('[DEBUG] Fetching subsections for sectionId:', sectionId);
        const response = await fetch(`${API_BASE_URL}/api/customization-subsections?sectionId=${sectionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          console.error('[DEBUG] Fetch subsections failed:', response.status);
          if (response.status === 401) {
            toast.error('Session expired. Please log in again.');
            onUnauthorized();
          }
          return;
        }

        const payload = await response.json();
        console.log('[DEBUG] Fetched subsections:', payload.subsections?.length || 0);
        setCreateSubsections((payload.subsections || []).map((subsection: any) => ({
          id: Number(subsection.id),
          sectionId: subsection.sectionId === null || subsection.sectionId === undefined ? null : Number(subsection.sectionId),
          name: String(subsection.name || ''),
        })));
      } catch (loadError) {
        console.error('[DEBUG] Load customization subsections error:', loadError);
      }
    };

    loadSubsections();
  }, [createForm.sectionId, onUnauthorized, token]);

  useEffect(() => {
    const loadSubsections = async () => {
      try {
        const sectionId = editForm.sectionId ? Number(editForm.sectionId) : NaN;
        if (!Number.isFinite(sectionId) || sectionId <= 0) {
          setEditSubsections([]);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/customization-subsections?sectionId=${sectionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast.error('Session expired. Please log in again.');
            onUnauthorized();
          }
          return;
        }

        const payload = await response.json();
        setEditSubsections((payload.subsections || []).map((subsection: any) => ({
          id: Number(subsection.id),
          sectionId: subsection.sectionId === null || subsection.sectionId === undefined ? null : Number(subsection.sectionId),
          name: String(subsection.name || ''),
        })));
      } catch (loadError) {
        console.error('Load customization subsections error:', loadError);
      }
    };

    loadSubsections();
  }, [editForm.sectionId, onUnauthorized, token]);

  const closeAllSortMenus = () => {
    setIsNameSortMenuOpen(false);
    setIsSubsectionSortMenuOpen(false);
    setIsDescriptionSortMenuOpen(false);
    setIsTenantCountSortMenuOpen(false);
    setIsCreatedAtSortMenuOpen(false);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);


  const applyColumnSort = (field: 'name' | 'subsection' | 'description' | 'tenantCount' | 'createdAt', nextSortOrder: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(nextSortOrder);
    closeAllSortMenus();
  };

  const openAddCustomizationModal = () => {
    if (!Number.isFinite(companyId) || companyId <= 0) {
      toast.error('Open a company-specific customizations page first.');
      return;
    }

    setCreateForm({ name: '', description: '', sectionId: '', subsectionId: '' });
    setIsAddCustomizationOpen(true);
  };

  const closeAddCustomizationModal = () => {
    setIsAddCustomizationOpen(false);
    setCreateForm({ name: '', description: '', sectionId: '', subsectionId: '' });
  };

  const handleCreateCustomization = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!Number.isFinite(companyId) || companyId <= 0) {
      toast.error('Company context is required to create a customization.');
      return;
    }

    const name = createForm.name.trim();
    const description = createForm.description.trim();
    const sectionId = createForm.sectionId.trim() ? Number(createForm.sectionId) : null;
    const subsectionId = createForm.subsectionId.trim() ? Number(createForm.subsectionId) : null;

    if (!name) {
      toast.error('Customization name is required');
      return;
    }

    if (sectionId !== null && (!Number.isFinite(sectionId) || sectionId <= 0)) {
      toast.error('Please select a valid section');
      return;
    }

    if (subsectionId !== null && (!Number.isFinite(subsectionId) || subsectionId <= 0)) {
      toast.error('Please select a valid subsection');
      return;
    }

    try {
      setIsSavingCustomization(true);

      const response = await fetch(`${API_BASE_URL}/api/customizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId,
          name,
          description,
          sectionId,
          subsectionId,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
          onUnauthorized();
          return;
        }

        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to create customization');
      }

      const payload = await response.json();
      if (payload.customization) {
        setCustomizations((prev) => [payload.customization, ...prev]);
      }

      toast.success('Customization added');
      closeAddCustomizationModal();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Failed to create customization';
      toast.error(message);
    } finally {
      setIsSavingCustomization(false);
    }
  };

  const openEditCustomizationModal = (customization: CustomizationRecord) => {
    setEditingCustomization(customization);
    setEditForm({
      name: customization.name || '',
      description: customization.description || '',
      sectionId: customization.subsection?.sectionId?.toString() || '',
      subsectionId: customization.subsectionId?.toString() || '',
    });
    setIsEditCustomizationOpen(true);
  };

  const closeEditCustomizationModal = () => {
    setIsEditCustomizationOpen(false);
    setEditingCustomization(null);
    setEditForm({ name: '', description: '', sectionId: '', subsectionId: '' });
  };

  const handleUpdateCustomization = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCustomization) return;

    const name = editForm.name.trim();
    const description = editForm.description.trim();
    const sectionId = editForm.sectionId.trim() ? Number(editForm.sectionId) : null;
    const subsectionId = editForm.subsectionId.trim() ? Number(editForm.subsectionId) : null;

    if (!name) {
      toast.error('Customization name is required');
      return;
    }

    try {
      setIsUpdatingCustomization(true);
      const response = await fetch(`${API_BASE_URL}/api/customizations/${editingCustomization.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          sectionId,
          subsectionId,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
          onUnauthorized();
          return;
        }
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to update customization');
      }

      const payload = await response.json();
      if (payload.customization) {
        setCustomizations((prev) =>
          prev.map((c) => (c.id === editingCustomization.id ? payload.customization : c))
        );
      }

      toast.success('Customization updated');
      closeEditCustomizationModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update customization';
      toast.error(message);
    } finally {
      setIsUpdatingCustomization(false);
    }
  };

  const handleDeleteCustomization = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this customization?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/customizations/${id}`, {
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
        throw new Error(payload.error || 'Failed to delete customization');
      }

      setCustomizations((prev) => prev.filter((c) => c.id !== id));
      toast.success('Customization deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete customization';
      toast.error(message);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        nameSortMenuRef.current?.contains(target)
        || subsectionSortMenuRef.current?.contains(target)
        || descriptionSortMenuRef.current?.contains(target)
        || tenantCountSortMenuRef.current?.contains(target)
        || createdAtSortMenuRef.current?.contains(target)
      ) {
        return;
      }

      closeAllSortMenus();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCustomizations = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    // Parse MySQL timestamp ("YYYY-MM-DD HH:MM:SS.mmm") safely by replacing space with T
    const parseTs = (ts: string | null | undefined) => {
      if (!ts) return '';
      return String(ts).replace(' ', 'T');
    };

    const sortFn = (a: CustomizationRecord, b: CustomizationRecord) => {
      const direction = sortOrder === 'asc' ? 1 : -1;

      if (sortBy === 'tenantCount') {
        return ((a.tenantCount || 0) - (b.tenantCount || 0)) * direction;
      }

      if (sortBy === 'createdAt') {
        return parseTs(a.createdAt).localeCompare(parseTs(b.createdAt)) * direction;
      }

      if (sortBy === 'subsection') {
        const leftSubsection = String(a.subsection?.name || 'Unassigned').toLowerCase();
        const rightSubsection = String(b.subsection?.name || 'Unassigned').toLowerCase();
        return leftSubsection.localeCompare(rightSubsection) * direction;
      }

      const left = String(a[sortBy] || '').toLowerCase();
      const right = String(b[sortBy] || '').toLowerCase();
      return left.localeCompare(right) * direction;
    };

    return customizations
      .filter((item) =>
        item.name.toLowerCase().includes(keyword) ||
        (item.description || '').toLowerCase().includes(keyword) ||
        (item.subsection?.name?.toLowerCase().includes(keyword) ?? false)
      )

      .sort(sortFn);
  }, [customizations, searchTerm, sortBy, sortOrder]);


  const pagedCustomizations = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredCustomizations.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredCustomizations, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredCustomizations.length / rowsPerPage);


  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow">
        <main className={`p-4 ${mainMarginClass} min-h-[calc(100vh-80px)] pt-18 transition-all duration-300`}>
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
                    <SlidersHorizontal size={20} />
                  </div>
                  <div>
                    <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {companyName ? `${companyName} Customizations` : 'Customization List'}
                    </h1>
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                      {companyName
                        ? `Showing customization records for ${companyName}.`
                        : 'Open customizations from a company row to view company-specific records.'}
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
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search name, description, or subsection"
                    className={`w-full bg-transparent text-sm outline-none placeholder:text-slate-500 ${isDark ? 'text-white' : 'text-gray-900'}`}
                  />
                </label>

                <button
                  type="button"
                  onClick={openAddCustomizationModal}
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
                Loading customizations...
              </div>
            ) : filteredCustomizations.length === 0 ? (
              <div className={`rounded-3xl border border-dashed px-6 py-16 text-center text-sm ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                No customizations found.
              </div>
            ) : (
              <div className={`overflow-hidden rounded-3xl border shadow-lg transition-all duration-300 ${isDark ? 'border-white/10 bg-white/5 shadow-black/40' : 'border-gray-200 bg-white shadow-gray-200/20'}`}>
                <div className="overflow-x-auto">
                  <table className={`min-w-full divide-y text-left ${isDark ? 'divide-white/10' : 'divide-gray-100'}`}>
                    <thead className={`text-[11px] uppercase tracking-[0.24em] ${isDark ? 'bg-black/20 text-slate-400' : 'bg-gray-50 text-gray-500'}`}>
                      <tr>
                        <th className="px-5 py-4 font-semibold">
                          <div className="relative inline-flex items-center gap-2" ref={nameSortMenuRef}>
                            <span>Name</span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsNameSortMenuOpen((prev) => !prev);
                                setIsSubsectionSortMenuOpen(false);
                                setIsDescriptionSortMenuOpen(false);
                                setIsTenantCountSortMenuOpen(false);
                                setIsCreatedAtSortMenuOpen(false);
                              }}
                              className="rounded-md p-1 transition-colors hover:bg-white/10"
                              aria-label="Sort customization name"
                              title="Sort customization name"
                            >
                              <ArrowUpDown size={13} />
                            </button>

                            {isNameSortMenuOpen && (
                              <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                                <button
                                  type="button"
                                  onClick={() => applyColumnSort('name', 'asc')}
                                  className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${sortBy === 'name' && sortOrder === 'asc'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'text-gray-300 hover:bg-white/5'
                                    }`}
                                >
                                  asc
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyColumnSort('name', 'desc')}
                                  className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${sortBy === 'name' && sortOrder === 'desc'
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
                          <div className="relative inline-flex items-center gap-2" ref={subsectionSortMenuRef}>
                            <span>Subsection</span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsSubsectionSortMenuOpen((prev) => !prev);
                                setIsNameSortMenuOpen(false);
                                setIsDescriptionSortMenuOpen(false);
                                setIsTenantCountSortMenuOpen(false);
                                setIsCreatedAtSortMenuOpen(false);
                              }}
                              className="rounded-md p-1 transition-colors hover:bg-white/10"
                              aria-label="Sort customization subsection"
                              title="Sort customization subsection"
                            >
                              <ArrowUpDown size={13} />
                            </button>

                            {isSubsectionSortMenuOpen && (
                              <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                                <button
                                  type="button"
                                  onClick={() => applyColumnSort('subsection', 'asc')}
                                  className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${sortBy === 'subsection' && sortOrder === 'asc'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'text-gray-300 hover:bg-white/5'
                                    }`}
                                >
                                  asc
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyColumnSort('subsection', 'desc')}
                                  className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${sortBy === 'subsection' && sortOrder === 'desc'
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
                          <div className="relative inline-flex items-center gap-2" ref={descriptionSortMenuRef}>
                            <span>Description</span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsDescriptionSortMenuOpen((prev) => !prev);
                                setIsNameSortMenuOpen(false);
                                setIsSubsectionSortMenuOpen(false);
                                setIsTenantCountSortMenuOpen(false);
                                setIsCreatedAtSortMenuOpen(false);
                              }}
                              className="rounded-md p-1 transition-colors hover:bg-white/10"
                              aria-label="Sort customization description"
                              title="Sort customization description"
                            >
                              <ArrowUpDown size={13} />
                            </button>

                            {isDescriptionSortMenuOpen && (
                              <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                                <button
                                  type="button"
                                  onClick={() => applyColumnSort('description', 'asc')}
                                  className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${sortBy === 'description' && sortOrder === 'asc'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'text-gray-300 hover:bg-white/5'
                                    }`}
                                >
                                  asc
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyColumnSort('description', 'desc')}
                                  className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${sortBy === 'description' && sortOrder === 'desc'
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
                          <div className="relative inline-flex items-center gap-2" ref={tenantCountSortMenuRef}>
                            <span>TENANT_COUNT</span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsTenantCountSortMenuOpen((prev) => !prev);
                                setIsNameSortMenuOpen(false);
                                setIsSubsectionSortMenuOpen(false);
                                setIsDescriptionSortMenuOpen(false);
                                setIsCreatedAtSortMenuOpen(false);
                              }}
                              className="rounded-md p-1 transition-colors hover:bg-white/10"
                              aria-label="Sort customization tenant count"
                              title="Sort customization tenant count"
                            >
                              <ArrowUpDown size={13} />
                            </button>

                            {isTenantCountSortMenuOpen && (
                              <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                                <button
                                  type="button"
                                  onClick={() => applyColumnSort('tenantCount', 'asc')}
                                  className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${sortBy === 'tenantCount' && sortOrder === 'asc'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'text-gray-300 hover:bg-white/5'
                                    }`}
                                >
                                  asc
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyColumnSort('tenantCount', 'desc')}
                                  className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${sortBy === 'tenantCount' && sortOrder === 'desc'
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
                            <span>CREATED_AT</span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatedAtSortMenuOpen((prev) => !prev);
                                setIsNameSortMenuOpen(false);
                                setIsSubsectionSortMenuOpen(false);
                                setIsDescriptionSortMenuOpen(false);
                                setIsTenantCountSortMenuOpen(false);
                              }}
                              className="rounded-md p-1 transition-colors hover:bg-white/10"
                              aria-label="Sort customization created date"
                              title="Sort customization created date"
                            >
                              <ArrowUpDown size={13} />
                            </button>

                            {isCreatedAtSortMenuOpen && (
                              <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                                <button
                                  type="button"
                                  onClick={() => applyColumnSort('createdAt', 'asc')}
                                  className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${sortBy === 'createdAt' && sortOrder === 'asc'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'text-gray-300 hover:bg-white/5'
                                    }`}
                                >
                                  asc
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyColumnSort('createdAt', 'desc')}
                                  className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${sortBy === 'createdAt' && sortOrder === 'desc'
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
                        <th className="px-5 py-4 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-white/8' : 'divide-gray-50'}`}>
                      {pagedCustomizations.map((item) => (
                        <tr key={item.id} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-blue-50/50'}`}>

                          <td className={`px-5 py-4 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.name}</td>
                          <td className={`px-5 py-4 text-sm ${isDark ? 'text-cyan-200' : 'text-cyan-600 font-semibold'}`}>
                            {item.subsection?.name || 'Unassigned'}
                          </td>
                          <td className={`px-5 py-4 text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                            {item.description || 'No description provided'}
                          </td>
                          <td className={`px-5 py-4 text-sm font-medium tracking-wide ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                            {item.tenantCount}
                          </td>
                          <td className={`px-5 py-4 text-sm font-mono whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            {item.createdAt ?? '—'}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditCustomizationModal(item)}
                                className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${isDark
                                  ? 'border-blue-400/30 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20'
                                  : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-300'
                                  }`}
                                title="Edit"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomization(item.id)}
                                className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${isDark
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

                <div className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-t ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-100 bg-gray-50/50'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Show</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className={`bg-transparent text-xs font-bold border-none focus:ring-0 p-0 pr-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}
                    >
                      {[5, 10, 15, 20, 50].map(size => (
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

            {isAddCustomizationOpen && (
              <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[5vh] backdrop-blur-sm">
                <div className={`w-full max-w-xl rounded-3xl border p-5 shadow-2xl ${isDark ? 'border-white/10 bg-[#0B1220]' : 'border-gray-200 bg-white'}`}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add Customization</h2>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {companyName ? `Create a customization for ${companyName}.` : 'Create a customization.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeAddCustomizationModal}
                      className={`rounded-full border p-2 transition-all ${isDark
                        ? 'border-white/10 text-slate-300 hover:border-white/20 hover:text-white hover:bg-white/5'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      aria-label="Close add customization modal"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateCustomization} className="space-y-4">
                    <div>
                      <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Name</label>
                      <input
                        value={createForm.name}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                        className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all ${isDark
                          ? 'border-white/10 bg-black/20 text-white placeholder:text-slate-500 focus:border-cyan-400/40'
                          : 'border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500/40'
                          }`}
                        placeholder="Enter customization name"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Section</label>
                      <select
                        value={createForm.sectionId}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, sectionId: event.target.value, subsectionId: '' }))}
                        className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all ${isDark
                          ? 'border-white/10 bg-[#1e293b] text-white focus:border-cyan-400/40'
                          : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-cyan-500/40'
                          }`}
                      >
                        <option value="" className={isDark ? 'bg-slate-800' : ''}>Select section</option>
                        {sections.map((section) => (
                          <option key={section.id} value={String(section.id)} className={isDark ? 'bg-slate-800' : ''}>
                            {section.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Subsection</label>
                      <select
                        value={createForm.subsectionId}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, subsectionId: event.target.value }))}
                        disabled={!createForm.sectionId}
                        className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all ${isDark
                          ? 'border-white/10 bg-[#1e293b] text-white focus:border-cyan-400/40'
                          : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-cyan-500/40'
                          }`}
                      >
                        <option value="" className={isDark ? 'bg-slate-800' : ''}>{createForm.sectionId ? 'Unassigned' : 'Select section first'}</option>
                        {createSubsections.map((subsection) => (
                          <option key={subsection.id} value={String(subsection.id)} className={isDark ? 'bg-slate-800' : ''}>
                            {subsection.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Description</label>
                      <textarea
                        value={createForm.description}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                        rows={4}
                        className={`w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition-all ${isDark
                          ? 'border-white/10 bg-[#1e293b] text-white placeholder:text-slate-500 focus:border-cyan-400/40'
                          : 'border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500/40'
                          }`}
                        placeholder="Enter customization description"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={closeAddCustomizationModal}
                        className={`h-[42px] rounded-xl border px-4 text-sm transition-all ${isDark
                          ? 'border-white/10 text-slate-300 hover:border-white/20 hover:text-white hover:bg-white/5'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingCustomization}
                        className={`h-[42px] rounded-xl border px-4 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-60 ${isDark
                          ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20'
                          : 'border-cyan-500/30 bg-cyan-600 text-white hover:bg-cyan-700'
                          }`}
                      >
                        {isSavingCustomization ? 'Saving...' : 'Create Customization'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Customization Modal */}
            {isEditCustomizationOpen && editingCustomization && (
              <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] backdrop-blur-sm">
                <div className="absolute inset-0 bg-slate-950/60" onClick={closeEditCustomizationModal} />
                <div className={`relative w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${isDark ? 'border-white/10 bg-[#0b1729]' : 'border-gray-200 bg-white'}`}>
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Edit Customization</h3>
                    <button
                      onClick={closeEditCustomizationModal}
                      className={`rounded-full p-2 transition-all ${isDark
                        ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateCustomization} className="space-y-5">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${isDark
                          ? 'border-white/10 bg-white/5 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50'
                          : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                          }`}
                        placeholder="e.g. Dark Mode"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Description
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className={`h-24 w-full resize-none rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${isDark
                          ? 'border-white/10 bg-white/5 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50'
                          : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                          }`}
                        placeholder="What does this customization do?"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Section
                        </label>
                        <select
                          value={editForm.sectionId}
                          onChange={(e) => setEditForm({ ...editForm, sectionId: e.target.value, subsectionId: '' })}
                          className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all ${isDark
                            ? 'border-white/10 bg-[#1e293b] text-white focus:border-blue-500/50'
                            : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500'
                            }`}
                        >
                          <option value="" className={isDark ? 'bg-slate-800' : ''}>Select Section</option>
                          {sections.map((s) => (
                            <option key={s.id} value={s.id} className={isDark ? 'bg-slate-800' : ''}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Subsection
                        </label>
                        <select
                          value={editForm.subsectionId}
                          onChange={(e) => setEditForm({ ...editForm, subsectionId: e.target.value })}
                          className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all ${isDark
                            ? 'border-white/10 bg-[#1e293b] text-white focus:border-blue-500/50'
                            : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500'
                            }`}
                          disabled={!editForm.sectionId}
                        >
                          <option value="" className={isDark ? 'bg-slate-800' : ''}>Select Subsection</option>
                          {editSubsections.map((ss) => (
                            <option key={ss.id} value={ss.id} className={isDark ? 'bg-slate-800' : ''}>
                              {ss.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={closeEditCustomizationModal}
                        className={`rounded-xl px-6 py-2.5 text-sm font-medium transition-all ${isDark
                          ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdatingCustomization}
                        className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-500 disabled:opacity-50"
                      >
                        {isUpdatingCustomization ? 'Updating...' : 'Update Customization'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}