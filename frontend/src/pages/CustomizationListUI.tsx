import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowUpDown, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

type CustomizationRecord = {
  id: number;
  subsectionId: number | null;
  companyId: number | null;
  name: string;
  description: string;
  createdAt: string;
  company: null | {
    id: number;
    name: string;
  };
  subsection: null | {
    id: number;
    name: string;
    description: string;
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
  const nameSortMenuRef = useRef<HTMLDivElement>(null);
  const subsectionSortMenuRef = useRef<HTMLDivElement>(null);
  const descriptionSortMenuRef = useRef<HTMLDivElement>(null);
  const createdAtSortMenuRef = useRef<HTMLDivElement>(null);

  const companyIdParam = searchParams.get('companyId')?.trim() || '';
  const companyName = searchParams.get('companyName')?.trim() || '';
  const companyId = companyIdParam ? Number(companyIdParam) : NaN;

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customizations, setCustomizations] = useState<CustomizationRecord[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'subsection' | 'description' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isNameSortMenuOpen, setIsNameSortMenuOpen] = useState(false);
  const [isSubsectionSortMenuOpen, setIsSubsectionSortMenuOpen] = useState(false);
  const [isDescriptionSortMenuOpen, setIsDescriptionSortMenuOpen] = useState(false);
  const [isCreatedAtSortMenuOpen, setIsCreatedAtSortMenuOpen] = useState(false);
  const [isAddCustomizationOpen, setIsAddCustomizationOpen] = useState(false);
  const [isSavingCustomization, setIsSavingCustomization] = useState(false);
  const [sections, setSections] = useState<CustomizationSectionOption[]>([]);
  const [subsections, setSubsections] = useState<CustomizationSubsectionOption[]>([]);
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
          setSubsections([]);
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
        setSubsections((payload.subsections || []).map((subsection: any) => ({
          id: Number(subsection.id),
          sectionId: subsection.sectionId === null || subsection.sectionId === undefined ? null : Number(subsection.sectionId),
          name: String(subsection.name || ''),
        })));
      } catch (loadError) {
        console.error('Load customization subsections error:', loadError);
      }
    };

    loadSubsections();
  }, [createForm.sectionId, onUnauthorized, token]);

  const closeAllSortMenus = () => {
    setIsNameSortMenuOpen(false);
    setIsSubsectionSortMenuOpen(false);
    setIsDescriptionSortMenuOpen(false);
    setIsCreatedAtSortMenuOpen(false);
  };

  const applyColumnSort = (field: 'name' | 'subsection' | 'description' | 'createdAt', nextSortOrder: 'asc' | 'desc') => {
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        nameSortMenuRef.current?.contains(target)
        || subsectionSortMenuRef.current?.contains(target)
        || descriptionSortMenuRef.current?.contains(target)
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
    if (!keyword) {
      return [...customizations].sort((a, b) => {
        const direction = sortOrder === 'asc' ? 1 : -1;

        if (sortBy === 'createdAt') {
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
        }

        if (sortBy === 'subsection') {
          const leftSubsection = String(a.subsection?.name || 'Unassigned').toLowerCase();
          const rightSubsection = String(b.subsection?.name || 'Unassigned').toLowerCase();
          return leftSubsection.localeCompare(rightSubsection) * direction;
        }

        const left = String(a[sortBy] || '').toLowerCase();
        const right = String(b[sortBy] || '').toLowerCase();
        return left.localeCompare(right) * direction;
      });
    }

    const filtered = customizations.filter((item) => {
      return (
        item.name.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword) ||
        item.subsection?.name.toLowerCase().includes(keyword)
      );
    });

    return filtered.sort((a, b) => {
      const direction = sortOrder === 'asc' ? 1 : -1;

      if (sortBy === 'createdAt') {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
      }

      if (sortBy === 'subsection') {
        const leftSubsection = String(a.subsection?.name || 'Unassigned').toLowerCase();
        const rightSubsection = String(b.subsection?.name || 'Unassigned').toLowerCase();
        return leftSubsection.localeCompare(rightSubsection) * direction;
      }

      const left = String(a[sortBy] || '').toLowerCase();
      const right = String(b[sortBy] || '').toLowerCase();
      return left.localeCompare(right) * direction;
    });
  }, [customizations, searchTerm, sortBy, sortOrder]);

  return (
    <div className="theme-page min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_28%),linear-gradient(180deg,_#07111f_0%,_#0b1729_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6">
        <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
            >
              <ArrowLeft size={14} />
              Back to dashboard
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.18)]">
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {companyName ? `${companyName} Customizations` : 'Customization List'}
                </h1>
                <p className="text-sm text-slate-300">
                  {companyName
                    ? `Showing customization records for ${companyName}.`
                    : 'Open customizations from a company row to view company-specific records.'}
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
                placeholder="Search name, description, or subsection"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>

            <button
              type="button"
              onClick={openAddCustomizationModal}
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
            Loading customizations...
          </div>
        ) : filteredCustomizations.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center text-sm text-slate-300">
            No customizations found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
            <table className="min-w-full divide-y divide-white/10 text-left">
              <thead className="bg-black/20 text-[11px] uppercase tracking-[0.24em] text-slate-400">
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
                            className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                              sortBy === 'name' && sortOrder === 'asc'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'text-gray-300 hover:bg-white/5'
                            }`}
                          >
                            asc
                          </button>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('name', 'desc')}
                            className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                              sortBy === 'name' && sortOrder === 'desc'
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
                            className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                              sortBy === 'subsection' && sortOrder === 'asc'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'text-gray-300 hover:bg-white/5'
                            }`}
                          >
                            asc
                          </button>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('subsection', 'desc')}
                            className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                              sortBy === 'subsection' && sortOrder === 'desc'
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
                            className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                              sortBy === 'description' && sortOrder === 'asc'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'text-gray-300 hover:bg-white/5'
                            }`}
                          >
                            asc
                          </button>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('description', 'desc')}
                            className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase transition-colors ${
                              sortBy === 'description' && sortOrder === 'desc'
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
                          setIsNameSortMenuOpen(false);
                          setIsSubsectionSortMenuOpen(false);
                          setIsDescriptionSortMenuOpen(false);
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
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {filteredCustomizations.map((item) => (
                  <tr key={item.id} className="transition hover:bg-white/5">
                    <td className="px-5 py-4 text-sm font-medium text-white">{item.name}</td>
                    <td className="px-5 py-4 text-sm text-cyan-200">
                      {item.subsection?.name || 'Unassigned'}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {item.description || 'No description provided'}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">{item.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAddCustomizationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0B1220] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Add Customization</h2>
                <p className="text-sm text-slate-400">
                  {companyName ? `Create a customization for ${companyName}.` : 'Create a customization.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAddCustomizationModal}
                className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:border-white/20 hover:text-white"
                aria-label="Close add customization modal"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomization} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Name</label>
                <input
                  value={createForm.name}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                  placeholder="Enter customization name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Section</label>
                <select
                  value={createForm.sectionId}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, sectionId: event.target.value, subsectionId: '' }))}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
                >
                  <option value="">Select section</option>
                  {sections.map((section) => (
                    <option key={section.id} value={String(section.id)}>
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
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
                >
                  <option value="">{createForm.sectionId ? 'Unassigned' : 'Select section first'}</option>
                  {subsections.map((subsection) => (
                    <option key={subsection.id} value={String(subsection.id)}>
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
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                  placeholder="Enter customization description"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAddCustomizationModal}
                  className="h-[42px] rounded-xl border border-white/10 px-4 text-sm text-slate-300 transition hover:border-white/20 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCustomization}
                  className="h-[42px] rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 text-sm text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingCustomization ? 'Saving...' : 'Create Customization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}