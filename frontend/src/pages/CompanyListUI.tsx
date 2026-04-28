import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, Edit2, Plus, Search, ServerCog, Settings2, Users, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Label } from 'flowbite-react';
import { API_BASE_URL } from '../config/api';

type CompanyListUIProps = {
  isDark: boolean;
  isSidebarMinimized: boolean;
  token: string;
  onUnauthorized: () => void;
};

type CompanyRecord = {
  id: number;
  name: string;
  description: string;
  email: string;
  tenantCount: number;
  createdAt: string;
  updatedAt: string;
};

export default function CompanyListUI({ isDark, isSidebarMinimized, token, onUnauthorized }: CompanyListUIProps) {
  const navigate = useNavigate();
  const idSortMenuRef = useRef<HTMLDivElement>(null);
  const nameSortMenuRef = useRef<HTMLDivElement>(null);
  const descriptionSortMenuRef = useRef<HTMLDivElement>(null);
  const tenantCountSortMenuRef = useRef<HTMLDivElement>(null);
  const createdAtSortMenuRef = useRef<HTMLDivElement>(null);
  const updatedAtSortMenuRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'description' | 'tenantCount' | 'createdAt' | 'updatedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isIdSortMenuOpen, setIsIdSortMenuOpen] = useState(false);
  const [isNameSortMenuOpen, setIsNameSortMenuOpen] = useState(false);
  const [isDescriptionSortMenuOpen, setIsDescriptionSortMenuOpen] = useState(false);
  const [isTenantCountSortMenuOpen, setIsTenantCountSortMenuOpen] = useState(false);
  const [isCreatedAtSortMenuOpen, setIsCreatedAtSortMenuOpen] = useState(false);
  const [isUpdatedAtSortMenuOpen, setIsUpdatedAtSortMenuOpen] = useState(false);
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    description: '',
    email: '',
    tenantCount: '0',
    serverIpAddress: '',
    serverLabel: '',
    tenantName: '',
    tenantDescription: '',
    sipCount: '',
    sipProvider: '',
    sipChannelCount: '',
    sipDescription: '',
    licenseCount: '',
  });
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    description?: string;
    email?: string;
    tenantCount?: string;
    serverIpAddress?: string;
    tenantName?: string;
    sipProvider?: string;
  }>({});
  const [companyWizardStep, setCompanyWizardStep] = useState(1);

  const formatDateTime = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  };

  const closeCompanyModal = () => {
    setIsCompanyModalOpen(false);
    setIsDeleteConfirmOpen(false);
    setEditingCompanyId(null);
    setCompanyForm({
      name: '',
      description: '',
      email: '',
      tenantCount: '0',
      serverIpAddress: '',
      serverLabel: '',
      tenantName: '',
      tenantDescription: '',
      sipCount: '',
      sipProvider: '',
      sipChannelCount: '',
      sipDescription: '',
      licenseCount: '',
    });
    setFormErrors({});
    setCompanyWizardStep(1);
  };

  const updateCompanyForm = (field: keyof typeof companyForm, value: string) => {
    setCompanyForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const openAddCompanyModal = () => {
    setEditingCompanyId(null);
    setCompanyForm({
      name: '',
      description: '',
      email: '',
      tenantCount: '0',
      serverIpAddress: '',
      serverLabel: '',
      tenantName: '',
      tenantDescription: '',
      sipCount: '',
      sipProvider: '',
      sipChannelCount: '',
      sipDescription: '',
      licenseCount: '',
    });
    setFormErrors({});
    setCompanyWizardStep(1);
    setIsCompanyModalOpen(true);
  };

  const openEditCompanyModal = (company: CompanyRecord) => {
    setEditingCompanyId(company.id);
    setCompanyForm({
      name: company.name,
      description: company.description,
      email: company.email,
      tenantCount: String(company.tenantCount),
      serverIpAddress: '',
      serverLabel: '',
      tenantName: '',
      tenantDescription: '',
      sipCount: '',
      sipProvider: '',
      sipChannelCount: '',
      sipDescription: '',
      licenseCount: '',
    });
    setFormErrors({});
    setIsCompanyModalOpen(true);
  };

  const addCompanyWizardSteps = [
    { step: 1, title: 'Step 1: Company form' },
    { step: 2, title: 'Step 2: Company servers form' },
    { step: 3, title: 'Step 3: Tenants form' },
    { step: 4, title: 'Step 4: SIP configs form' },
  ];

  const mapApiCompany = (company: any): CompanyRecord => ({
    id: Number(company.id),
    name: String(company.name || ''),
    description: String(company.description || ''),
    email: String(company.email || ''),
    tenantCount: Number(company.tenantCount || 0),
    createdAt: formatDateTime(new Date(company.createdAt)),
    updatedAt: formatDateTime(new Date(company.updatedAt)),
  });

  const getApiErrorMessage = async (response: Response, fallback: string) => {
    const rawBody = await response.text().catch(() => '');
    if (!rawBody) {
      return `${fallback} (HTTP ${response.status})`;
    }

    try {
      const parsed = JSON.parse(rawBody);
      const apiMessage = String(parsed?.error || parsed?.message || '').trim();
      if (apiMessage) {
        return `${apiMessage} (HTTP ${response.status})`;
      }
    } catch {
      // Keep fallback below for non-JSON responses.
    }

    return `${fallback} (HTTP ${response.status}): ${rawBody.slice(0, 160)}`;
  };

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await fetch(`${API_BASE_URL}/api/companies`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
          onUnauthorized();
          return;
        }
        const message = await getApiErrorMessage(response, 'Failed to fetch companies');
        toast.error(message);
        return;
      }

      const data = await response.json();
      const rows = Array.isArray(data.companies) ? data.companies.map(mapApiCompany) : [];
      setCompanies(rows);
    } catch (error) {
      console.error('Fetch companies error:', error);
      toast.error('Unable to load companies');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const validateCompanyForm = (): boolean => {
    const errors: { name?: string; description?: string; email?: string; tenantCount?: string } = {};

    if (!isEditingCompany) {
      const trimmedName = companyForm.name.trim();
      if (!trimmedName) {
        errors.name = 'Company name is required';
      }

      const trimmedDescription = companyForm.description.trim();
      if (!trimmedDescription) {
        errors.description = 'Company description is required';
      }

      const trimmedEmail = companyForm.email.trim();
      if (!trimmedEmail) {
        errors.email = 'Company email is required';
      } else {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(trimmedEmail)) {
          errors.email = 'Please provide a valid email address';
        }
      }
    }

    const parsedTenantCount = Number(companyForm.tenantCount);
    if (!isEditingCompany && (!Number.isFinite(parsedTenantCount) || parsedTenantCount <= 0)) {
      errors.tenantCount = 'Tenant count must be a positive number';
    }

    if (isEditingCompany && companyForm.tenantCount.trim()) {
      if (!Number.isFinite(parsedTenantCount) || parsedTenantCount < 0) {
        errors.tenantCount = 'Tenant count must be a valid number';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCompanyWizardStep = (step: number): boolean => {
    const errors: {
      name?: string;
      description?: string;
      email?: string;
      tenantCount?: string;
      serverIpAddress?: string;
      tenantName?: string;
      sipProvider?: string;
    } = {};

    if (step === 1) {
      if (!companyForm.name.trim()) {
        errors.name = 'Company name is required';
      }

      if (!companyForm.description.trim()) {
        errors.description = 'Company description is required';
      }

      const trimmedEmail = companyForm.email.trim();
      if (!trimmedEmail) {
        errors.email = 'Company email is required';
      } else {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(trimmedEmail)) {
          errors.email = 'Please provide a valid email address';
        }
      }

      const parsedTenantCount = Number(companyForm.tenantCount);
      if (!Number.isFinite(parsedTenantCount) || parsedTenantCount <= 0) {
        errors.tenantCount = 'Tenant count must be a positive number';
      }
    }

    if (step === 2 && !companyForm.serverIpAddress.trim()) {
      errors.serverIpAddress = 'Server IP address is required';
    }

    if (step === 3 && !companyForm.tenantName.trim()) {
      errors.tenantName = 'Tenant name is required';
    }

    if (step === 4 && !companyForm.sipProvider.trim()) {
      errors.sipProvider = 'SIP provider is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCompanyBundle = (): boolean => {
    const errors: {
      name?: string;
      description?: string;
      email?: string;
      tenantCount?: string;
      serverIpAddress?: string;
      tenantName?: string;
      sipProvider?: string;
    } = {};

    if (!companyForm.name.trim()) {
      errors.name = 'Company name is required';
    }

    if (!companyForm.description.trim()) {
      errors.description = 'Company description is required';
    }

    const trimmedEmail = companyForm.email.trim();
    if (!trimmedEmail) {
      errors.email = 'Company email is required';
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = 'Please provide a valid email address';
      }
    }

    const parsedTenantCount = Number(companyForm.tenantCount);
    if (!Number.isFinite(parsedTenantCount) || parsedTenantCount <= 0) {
      errors.tenantCount = 'Tenant count must be a positive number';
    }

    if (!companyForm.serverIpAddress.trim()) {
      errors.serverIpAddress = 'Server IP address is required';
    }

    if (!companyForm.tenantName.trim()) {
      errors.tenantName = 'Tenant name is required';
    }

    if (!companyForm.sipProvider.trim()) {
      errors.sipProvider = 'SIP provider is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleWizardNext = () => {
    if (!validateCompanyWizardStep(companyWizardStep)) {
      return;
    }

    setCompanyWizardStep((prev) => Math.min(prev + 1, addCompanyWizardSteps.length));
  };

  const handleWizardBack = () => {
    setFormErrors({});
    setCompanyWizardStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCompanySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (editingCompanyId !== null) {
        if (!validateCompanyForm()) {
          toast.error('Please enter a valid tenant count');
          return;
        }

        const trimmedName = companyForm.name.trim();
        const trimmedDescription = companyForm.description.trim();
        const trimmedEmail = companyForm.email.trim();
        const parsedTenantCount = Number(companyForm.tenantCount);
        const tenantCount = Number.isFinite(parsedTenantCount) && parsedTenantCount >= 0 ? Math.floor(parsedTenantCount) : 0;

        const response = await fetch(`${API_BASE_URL}/api/companies/${editingCompanyId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: trimmedName,
            description: trimmedDescription,
            email: trimmedEmail,
            tenantCount,
          }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast.error('Session expired. Please log in again.');
            onUnauthorized();
            return;
          }
          const message = await getApiErrorMessage(response, 'Failed to save company');
          toast.error(message);
          return;
        }

        await fetchCompanies();
        closeCompanyModal();
        toast.success('Company updated');
        return;
      }

      if (!validateCompanyBundle()) {
        toast.error('Please fill in all required fields correctly');
        return;
      }

      const parsedTenantCount = Number(companyForm.tenantCount);
      const companyResponse = await fetch(`${API_BASE_URL}/api/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: companyForm.name.trim(),
          description: companyForm.description.trim(),
          email: companyForm.email.trim(),
          tenantCount: Number.isFinite(parsedTenantCount) && parsedTenantCount >= 0 ? Math.floor(parsedTenantCount) : 0,
        }),
      });

      if (!companyResponse.ok) {
        if (companyResponse.status === 401) {
          toast.error('Session expired. Please log in again.');
          onUnauthorized();
          return;
        }

        const message = await getApiErrorMessage(companyResponse, 'Failed to create company');
        toast.error(message);
        return;
      }

      const companyPayload = await companyResponse.json().catch(() => ({}));
      const createdCompanyId = Number(companyPayload?.company?.id);
      if (!Number.isFinite(createdCompanyId) || createdCompanyId <= 0) {
        throw new Error('Created company id missing');
      }

      const serverResponse = await fetch(`${API_BASE_URL}/api/servers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId: createdCompanyId,
          ipAddress: companyForm.serverIpAddress.trim(),
          label: companyForm.serverLabel.trim(),
        }),
      });

      if (!serverResponse.ok) {
        const message = await getApiErrorMessage(serverResponse, 'Company was created, but server creation failed');
        toast.error(message);
        return;
      }

      const tenantResponse = await fetch(`${API_BASE_URL}/api/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId: createdCompanyId,
          name: companyForm.tenantName.trim(),
          description: companyForm.tenantDescription.trim(),
        }),
      });

      if (!tenantResponse.ok) {
        const message = await getApiErrorMessage(tenantResponse, 'Company and server were created, but tenant creation failed');
        toast.error(message);
        return;
      }

      const tenantPayload = await tenantResponse.json().catch(() => ({}));
      const createdTenantId = Number(tenantPayload?.tenant?.id);
      if (!Number.isFinite(createdTenantId) || createdTenantId <= 0) {
        throw new Error('Created tenant id missing');
      }

      const sipCountValue = companyForm.sipCount.trim();
      const sipChannelCountValue = companyForm.sipChannelCount.trim();
      const licenseCountValue = companyForm.licenseCount.trim();

      const sipConfigResponse = await fetch(`${API_BASE_URL}/api/sip-configs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId: createdTenantId,
          sipCount: sipCountValue ? Number(sipCountValue) : null,
          sipProvider: companyForm.sipProvider.trim(),
          sipChannelCount: sipChannelCountValue ? Number(sipChannelCountValue) : null,
          sipDescription: companyForm.sipDescription.trim(),
          licenseCount: licenseCountValue ? Number(licenseCountValue) : null,
        }),
      });

      if (!sipConfigResponse.ok) {
        const message = await getApiErrorMessage(sipConfigResponse, 'Company, server, and tenant were created, but SIP config creation failed');
        toast.error(message);
        return;
      }

      await fetchCompanies();
      closeCompanyModal();
      toast.success('Company, server, tenant, and SIP config created');
    } catch (error) {
      console.error('Save company error:', error);
      toast.error('Unable to save company');
    }
  };

  const handleDeleteCompany = async () => {
    if (editingCompanyId === null) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/companies/${editingCompanyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
          onUnauthorized();
          return;
        }
        const message = await getApiErrorMessage(response, 'Failed to delete company');
        toast.error(message);
        return;
      }

      await fetchCompanies();
      closeCompanyModal();
      toast.success('Company deleted');
    } catch (error) {
      console.error('Delete company error:', error);
      toast.error('Unable to delete company');
    }
  };

  const editingCompany = editingCompanyId === null
    ? null
    : companies.find((company) => company.id === editingCompanyId) || null;
  const isEditingCompany = editingCompanyId !== null;

  const actionTooltipClass = `action-tooltip pointer-events-none absolute -top-9 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-semibold text-sky-50 shadow-lg opacity-0 transition-opacity duration-75 ease-out peer-hover:opacity-100 peer-focus-visible:opacity-100 ${
    isDark
      ? 'bg-[#0B1220] border border-white/10'
      : 'bg-slate-900 border border-slate-700'
  }`;

  useEffect(() => {
    if (token) {
      fetchCompanies();
    }
  }, [token]);

  const closeAllSortMenus = () => {
    setIsIdSortMenuOpen(false);
    setIsNameSortMenuOpen(false);
    setIsDescriptionSortMenuOpen(false);
    setIsTenantCountSortMenuOpen(false);
    setIsCreatedAtSortMenuOpen(false);
    setIsUpdatedAtSortMenuOpen(false);
  };

  const applyColumnSort = (field: 'id' | 'name' | 'description' | 'tenantCount' | 'createdAt' | 'updatedAt', nextSortOrder: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(nextSortOrder);
    setCurrentPage(1);
    closeAllSortMenus();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        idSortMenuRef.current?.contains(target) ||
        nameSortMenuRef.current?.contains(target) ||
        descriptionSortMenuRef.current?.contains(target) ||
        tenantCountSortMenuRef.current?.contains(target) ||
        createdAtSortMenuRef.current?.contains(target) ||
        updatedAtSortMenuRef.current?.contains(target)
      ) {
        return;
      }

      closeAllSortMenus();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAndSortedCompanies = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    let rows = companies.filter((company) => !keyword || (
      company.name.toLowerCase().includes(keyword) ||
      company.description.toLowerCase().includes(keyword) ||
      String(company.tenantCount).includes(keyword) ||
      company.createdAt.toLowerCase().includes(keyword) ||
      company.updatedAt.toLowerCase().includes(keyword)
    ));

    rows = [...rows].sort((a, b) => {
      const direction = sortOrder === 'asc' ? 1 : -1;

      if (sortBy === 'id' || sortBy === 'tenantCount') {
        return (a[sortBy] - b[sortBy]) * direction;
      }

      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        return (new Date(a[sortBy]).getTime() - new Date(b[sortBy]).getTime()) * direction;
      }

      const left = String(a[sortBy]).toLowerCase();
      const right = String(b[sortBy]).toLowerCase();
      return left.localeCompare(right) * direction;
    });

    return rows;
  }, [companies, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedCompanies.length / rowsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedCompanies = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedCompanies.slice(start, start + rowsPerPage);
  }, [filteredAndSortedCompanies, currentPage, rowsPerPage]);

  const handleExportCompanies = () => {
    const rows = filteredAndSortedCompanies.map((company) => ({
      ID: company.id,
      Name: company.name,
      Description: company.description,
      Tenant_Count: company.tenantCount,
      Created_At: company.createdAt,
      Updated_At: company.updatedAt,
    }));

    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'CompanyList');
    XLSX.writeFile(workbook, `company-list-${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`);
  };

  return (
    <>
    <div className="mt-4 w-full">
      <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5 pl-2 border-b pb-3 ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
        <h3 className={`text-[1.1rem] font-medium tracking-wide ${isDark ? 'text-white/90' : 'text-gray-900'}`}>
          Company List
        </h3>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative w-full lg:w-[320px] max-w-full">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search name, description, tenant count"
              className={`w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-all ${
                isDark
                  ? 'bg-[#09090B] border border-white/10 text-gray-200 placeholder:text-gray-600 focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.12)]'
                  : 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-400 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)]'
              }`}
            />
          </div>

          <button
            type="button"
            onClick={openAddCompanyModal}
            className={`h-[42px] px-3 rounded-xl border flex items-center gap-2 text-sm transition-all whitespace-nowrap ${
              isDark
                ? 'bg-[#09090B] border-white/10 text-gray-300 hover:text-white hover:border-white/20'
                : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400'
            }`}
            title="Add"
            aria-label="Add"
          >
            <Plus size={15} /> Add
          </button>

          <button
            type="button"
            onClick={handleExportCompanies}
            className={`h-[42px] px-3 rounded-xl border flex items-center gap-2 text-sm transition-all ${
              isDark
                ? 'bg-[#09090B] border-white/10 text-gray-300 hover:text-white hover:border-white/20'
                : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400'
            }`}
            title="Export companies to Excel"
          >
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      <div className={`rounded-2xl px-3 pb-3 pt-2 table-animated-surface ${isDark ? 'table-animated-surface--dark' : 'table-animated-surface--light'} ${
        isDark
          ? 'bg-gradient-to-b from-[#10131D]/95 to-[#0D1018]/95 shadow-[0_22px_50px_rgba(0,0,0,0.45)]'
          : 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
      }`}>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-separate [border-spacing:0_10px]">
            <thead>
              <tr>
                <th className={`font-semibold tracking-[0.12em] uppercase ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`} style={{ padding: isSidebarMinimized ? '12px 24px' : '12px 16px', fontSize: isSidebarMinimized ? '10px' : '9px' }}>
                  <div className="relative inline-flex items-center gap-2" ref={idSortMenuRef}>
                    <span>id</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsIdSortMenuOpen(prev => !prev);
                        setIsNameSortMenuOpen(false);
                        setIsDescriptionSortMenuOpen(false);
                        setIsTenantCountSortMenuOpen(false);
                        setIsCreatedAtSortMenuOpen(false);
                        setIsUpdatedAtSortMenuOpen(false);
                      }}
                      className={`rounded-md p-1 transition-colors ${
                        isDark ? 'hover:bg-white/10 text-blue-200/70' : 'hover:bg-blue-100 text-blue-600'
                      }`}
                      aria-label="Sort company id"
                      title="Sort company id"
                    >
                      <ArrowUpDown size={13} />
                    </button>

                    {isIdSortMenuOpen && (
                      <div className={`absolute top-full left-0 mt-2 min-w-[92px] rounded-lg border p-1 z-30 shadow-xl ${
                        isDark ? 'bg-[#111318] border-white/10' : 'bg-white border-gray-200'
                      }`}>
                        <button
                          type="button"
                          onClick={() => applyColumnSort('id', 'asc')}
                          className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] uppercase transition-colors ${
                            sortBy === 'id' && sortOrder === 'asc'
                              ? isDark
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-blue-100 text-blue-700'
                              : isDark
                                ? 'text-gray-300 hover:bg-white/5'
                                : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          asc
                        </button>
                        <button
                          type="button"
                          onClick={() => applyColumnSort('id', 'desc')}
                          className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] uppercase transition-colors ${
                            sortBy === 'id' && sortOrder === 'desc'
                              ? isDark
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-blue-100 text-blue-700'
                              : isDark
                                ? 'text-gray-300 hover:bg-white/5'
                                : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          dsc
                        </button>
                      </div>
                    )}
                  </div>
                </th>
                <th className={`px-6 py-3 text-[11px] font-semibold tracking-[0.12em] uppercase ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>
                  <div className="relative inline-flex items-center gap-2" ref={nameSortMenuRef}>
                    <span>name</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNameSortMenuOpen(prev => !prev);
                        setIsIdSortMenuOpen(false);
                        setIsDescriptionSortMenuOpen(false);
                        setIsTenantCountSortMenuOpen(false);
                        setIsCreatedAtSortMenuOpen(false);
                        setIsUpdatedAtSortMenuOpen(false);
                      }}
                      className={`rounded-md p-1 transition-colors ${
                        isDark ? 'hover:bg-white/10 text-blue-200/70' : 'hover:bg-blue-100 text-blue-600'
                      }`}
                      aria-label="Sort name"
                      title="Sort name"
                    >
                      <ArrowUpDown size={13} />
                    </button>

                    {isNameSortMenuOpen && (
                      <div className={`absolute top-full left-0 mt-2 min-w-[92px] rounded-lg border p-1 z-30 shadow-xl ${
                        isDark ? 'bg-[#111318] border-white/10' : 'bg-white border-gray-200'
                      }`}>
                        <button
                          type="button"
                          onClick={() => applyColumnSort('name', 'asc')}
                          className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] uppercase transition-colors ${
                            sortBy === 'name' && sortOrder === 'asc'
                              ? isDark
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-blue-100 text-blue-700'
                              : isDark
                                ? 'text-gray-300 hover:bg-white/5'
                                : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          asc
                        </button>
                        <button
                          type="button"
                          onClick={() => applyColumnSort('name', 'desc')}
                          className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] uppercase transition-colors ${
                            sortBy === 'name' && sortOrder === 'desc'
                              ? isDark
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-blue-100 text-blue-700'
                              : isDark
                                ? 'text-gray-300 hover:bg-white/5'
                                : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          dsc
                        </button>
                      </div>
                    )}
                  </div>
                </th>
                <th className={`px-6 py-3 text-[11px] font-semibold tracking-[0.12em] uppercase ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>
                  <div className="relative inline-flex items-center gap-2" ref={descriptionSortMenuRef}>
                    <span>description</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDescriptionSortMenuOpen(prev => !prev);
                        setIsIdSortMenuOpen(false);
                        setIsNameSortMenuOpen(false);
                        setIsTenantCountSortMenuOpen(false);
                        setIsCreatedAtSortMenuOpen(false);
                        setIsUpdatedAtSortMenuOpen(false);
                      }}
                      className={`rounded-md p-1 transition-colors ${
                        isDark ? 'hover:bg-white/10 text-blue-200/70' : 'hover:bg-blue-100 text-blue-600'
                      }`}
                      aria-label="Sort description"
                      title="Sort description"
                    >
                      <ArrowUpDown size={13} />
                    </button>

                    {isDescriptionSortMenuOpen && (
                      <div className={`absolute top-full left-0 mt-2 min-w-[92px] rounded-lg border p-1 z-30 shadow-xl ${
                        isDark ? 'bg-[#111318] border-white/10' : 'bg-white border-gray-200'
                      }`}>
                        <button
                          type="button"
                          onClick={() => applyColumnSort('description', 'asc')}
                          className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] uppercase transition-colors ${
                            sortBy === 'description' && sortOrder === 'asc'
                              ? isDark
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-blue-100 text-blue-700'
                              : isDark
                                ? 'text-gray-300 hover:bg-white/5'
                                : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          asc
                        </button>
                        <button
                          type="button"
                          onClick={() => applyColumnSort('description', 'desc')}
                          className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] uppercase transition-colors ${
                            sortBy === 'description' && sortOrder === 'desc'
                              ? isDark
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-blue-100 text-blue-700'
                              : isDark
                                ? 'text-gray-300 hover:bg-white/5'
                                : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          dsc
                        </button>
                      </div>
                    )}
                  </div>
                </th>
                <th className={`px-6 py-3 text-[11px] font-semibold tracking-[0.12em] uppercase ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>
                  <div className="relative inline-flex items-center gap-2" ref={tenantCountSortMenuRef}>
                    <span>tenant_count</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsTenantCountSortMenuOpen(prev => !prev);
                        setIsIdSortMenuOpen(false);
                        setIsNameSortMenuOpen(false);
                        setIsDescriptionSortMenuOpen(false);
                        setIsCreatedAtSortMenuOpen(false);
                        setIsUpdatedAtSortMenuOpen(false);
                      }}
                      className={`rounded-md p-1 transition-colors ${
                        isDark ? 'hover:bg-white/10 text-blue-200/70' : 'hover:bg-blue-100 text-blue-600'
                      }`}
                      aria-label="Sort tenant count"
                      title="Sort tenant count"
                    >
                      <ArrowUpDown size={13} />
                    </button>

                    {isTenantCountSortMenuOpen && (
                      <div className={`absolute top-full left-0 mt-2 min-w-[92px] rounded-lg border p-1 z-30 shadow-xl ${
                        isDark ? 'bg-[#111318] border-white/10' : 'bg-white border-gray-200'
                      }`}>
                        <button
                          type="button"
                          onClick={() => applyColumnSort('tenantCount', 'asc')}
                          className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] uppercase transition-colors ${
                            sortBy === 'tenantCount' && sortOrder === 'asc'
                              ? isDark
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-blue-100 text-blue-700'
                              : isDark
                                ? 'text-gray-300 hover:bg-white/5'
                                : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          asc
                        </button>
                        <button
                          type="button"
                          onClick={() => applyColumnSort('tenantCount', 'desc')}
                          className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] uppercase transition-colors ${
                            sortBy === 'tenantCount' && sortOrder === 'desc'
                              ? isDark
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-blue-100 text-blue-700'
                              : isDark
                                ? 'text-gray-300 hover:bg-white/5'
                                : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          dsc
                        </button>
                      </div>
                    )}
                  </div>
                </th>
                <th className={`px-6 py-3 text-[11px] font-semibold tracking-[0.12em] uppercase ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>
                  <div className="relative inline-flex items-center gap-2" ref={createdAtSortMenuRef}>
                    <span>created_at</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatedAtSortMenuOpen(prev => !prev);
                        setIsIdSortMenuOpen(false);
                        setIsNameSortMenuOpen(false);
                        setIsDescriptionSortMenuOpen(false);
                        setIsTenantCountSortMenuOpen(false);
                        setIsUpdatedAtSortMenuOpen(false);
                      }}
                      className={`rounded-md p-1 transition-colors ${
                        isDark ? 'hover:bg-white/10 text-blue-200/70' : 'hover:bg-blue-100 text-blue-600'
                      }`}
                      aria-label="Sort created at"
                      title="Sort created at"
                    >
                      <ArrowUpDown size={13} />
                    </button>

                    {isCreatedAtSortMenuOpen && (
                      <div className={`absolute top-full left-0 mt-2 min-w-[92px] rounded-lg border p-1 z-30 shadow-xl ${
                        isDark ? 'bg-[#111318] border-white/10' : 'bg-white border-gray-200'
                      }`}>
                        <button
                          type="button"
                          onClick={() => applyColumnSort('createdAt', 'asc')}
                          className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] uppercase transition-colors ${
                            sortBy === 'createdAt' && sortOrder === 'asc'
                              ? isDark
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-blue-100 text-blue-700'
                              : isDark
                                ? 'text-gray-300 hover:bg-white/5'
                                : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          asc
                        </button>
                        <button
                          type="button"
                          onClick={() => applyColumnSort('createdAt', 'desc')}
                          className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] uppercase transition-colors ${
                            sortBy === 'createdAt' && sortOrder === 'desc'
                              ? isDark
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-blue-100 text-blue-700'
                              : isDark
                                ? 'text-gray-300 hover:bg-white/5'
                                : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          dsc
                        </button>
                      </div>
                    )}
                  </div>
                </th>

                <th className={`px-4 py-3 text-[11px] font-semibold tracking-[0.12em] uppercase text-center ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loadingCompanies && (
                <tr>
                                  <td colSpan={7} className="text-center py-8 text-gray-500 text-sm">Loading companies...</td>
                </tr>
              )}

              {!loadingCompanies && pagedCompanies.map((company, index) => (
                <tr key={company.id} className="group transition-transform duration-200 hover:-translate-y-[1px]">
                  <td
                    className={`rounded-l-xl transition-colors ${
                      isDark
                        ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]`
                        : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-blue-50`
                    }`}
                    style={{ padding: isSidebarMinimized ? '16px 24px' : '16px 16px' }}
                  >
                    <span className={`font-semibold tracking-wide ${isDark ? 'text-blue-200/90' : 'text-blue-700'}`} style={{ fontSize: isSidebarMinimized ? '13px' : '12px' }}>
                      #{company.id}
                    </span>
                  </td>

                  <td
                    className={`transition-colors ${
                      isDark
                        ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]`
                        : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-blue-50`
                    }`}
                    style={{ padding: isSidebarMinimized ? '16px 24px' : '16px 16px' }}
                  >
                    <span className={`font-semibold tracking-[0.01em] ${isDark ? 'text-gray-100' : 'text-gray-900'}`} style={{ fontSize: isSidebarMinimized ? '13px' : '13px' }}>
                      {company.name}
                    </span>
                  </td>

                  <td
                    className={`transition-colors ${
                      isDark
                        ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]`
                        : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-blue-50`
                    }`}
                    style={{ padding: isSidebarMinimized ? '16px 24px' : '16px 16px' }}
                  >
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: isSidebarMinimized ? '12px' : '12px' }}>
                      {company.description}
                    </span>
                  </td>

                  <td
                    className={`transition-colors ${
                      isDark
                        ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]`
                        : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-blue-50`
                    }`}
                    style={{ padding: isSidebarMinimized ? '16px 24px' : '16px 16px' }}
                  >
                    <span className={`font-medium tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: isSidebarMinimized ? '12px' : '12px' }}>
                      {company.tenantCount}
                    </span>
                  </td>

                  <td
                    className={`transition-colors ${
                      isDark
                        ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]`
                        : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-blue-50`
                    }`}
                    style={{ padding: isSidebarMinimized ? '16px 24px' : '16px 16px' }}
                  >
                    <span className={`font-medium tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: isSidebarMinimized ? '12px' : '12px' }}>
                      {company.createdAt}
                    </span>
                  </td>



                  <td
                    className={`rounded-r-xl transition-colors ${
                      isDark
                        ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]`
                        : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-blue-50`
                    }`}
                    style={{ padding: isSidebarMinimized ? '12px 20px' : '12px 16px' }}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => navigate(`/customizations?companyId=${company.id}&companyName=${encodeURIComponent(company.name)}`)}
                          className={`peer inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ${
                            isDark
                              ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.22)] hover:bg-cyan-500/20 hover:shadow-[0_0_18px_rgba(34,211,238,0.38)]'
                              : 'border-cyan-300 bg-cyan-50 text-cyan-700 shadow-[0_0_12px_rgba(34,211,238,0.14)] hover:bg-cyan-100'
                          }`}
                          aria-label="Customization"
                          title="Customization"
                        >
                          <Settings2 size={13} />
                        </button>
                        <span className={actionTooltipClass}>Customization</span>
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => navigate(`/servers?companyId=${company.id}&companyName=${encodeURIComponent(company.name)}`)}
                          className={`peer inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ${
                            isDark
                              ? 'border-violet-400/40 bg-violet-500/10 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.22)] hover:bg-violet-500/20 hover:shadow-[0_0_18px_rgba(139,92,246,0.38)]'
                              : 'border-violet-300 bg-violet-50 text-violet-700 shadow-[0_0_12px_rgba(139,92,246,0.14)] hover:bg-violet-100'
                          }`}
                          aria-label="Servers"
                          title="Servers"
                        >
                          <ServerCog size={13} />
                        </button>
                        <span className={actionTooltipClass}>Servers</span>
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => navigate(`/tenants?companyId=${company.id}&companyName=${encodeURIComponent(company.name)}`)}
                          className={`peer inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ${
                            isDark
                              ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200 shadow-[0_0_12px_rgba(34,197,94,0.22)] hover:bg-emerald-500/20 hover:shadow-[0_0_18px_rgba(34,197,94,0.38)]'
                              : 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-[0_0_12px_rgba(34,197,94,0.14)] hover:bg-emerald-100'
                          }`}
                          aria-label="Tenants"
                          title="Tenants"
                        >
                          <Users size={13} />
                        </button>
                        <span className={actionTooltipClass}>Tenants</span>
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => openEditCompanyModal(company)}
                          className={`peer inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ${
                            isDark
                              ? 'border-rose-400/40 bg-rose-500/10 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.22)] hover:bg-rose-500/20 hover:shadow-[0_0_18px_rgba(244,63,94,0.38)]'
                              : 'border-rose-300 bg-rose-50 text-rose-700 shadow-[0_0_12px_rgba(244,63,94,0.14)] hover:bg-rose-100'
                          }`}
                          aria-label="Edit"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <span className={actionTooltipClass}>Edit</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

              {!loadingCompanies && pagedCompanies.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500 text-sm">No companies found in companyList table.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="w-full flex flex-wrap items-center justify-between gap-3 mt-6">
        <div className="flex items-center gap-2">
          <Label htmlFor="companiesPerPage" className={`text-[12px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Per page
          </Label>
          <select
            id="companiesPerPage"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className={`rounded-lg px-2.5 py-1.5 text-sm outline-none transition-all ${
              isDark
                ? 'bg-[#121214] border border-white/10 text-gray-200 focus:border-blue-500/50'
                : 'bg-white border border-gray-300 text-gray-900 focus:border-blue-400'
            }`}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2 -mr-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-[#121214] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  : 'bg-white border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
              }`}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <span className={`min-w-[36px] text-center text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {currentPage}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-[#121214] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  : 'bg-white border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
              }`}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>

    {isCompanyModalOpen && (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? 'bg-black/65' : 'bg-black/40'}`}>
        <div className={`w-full max-w-2xl rounded-2xl border p-6 ${
          isDark
            ? 'bg-[#111318] border-white/10 shadow-[0_0_35px_rgba(59,130,246,0.25)]'
            : 'bg-white border-gray-200 shadow-[0_0_25px_rgba(59,130,246,0.15)]'
        }`}>
          <div className="flex items-center justify-between gap-3 mb-5">
            <h4 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {editingCompanyId === null ? 'Add a new company' : 'Edit Company'}
            </h4>
            <button
              type="button"
              onClick={closeCompanyModal}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${
                isDark
                  ? 'border-white/10 text-gray-300 hover:text-white hover:bg-white/5'
                  : 'border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              aria-label="Close company modal"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleCompanySubmit}>
            {!isEditingCompany && (
              <div className={`mb-5 rounded-xl border px-4 py-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Step {companyWizardStep} of {addCompanyWizardSteps.length}</span>
                  <span className={isDark ? 'text-blue-200' : 'text-blue-700'}>{addCompanyWizardSteps[companyWizardStep - 1]?.title}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  {addCompanyWizardSteps.map((step) => (
                    <div
                      key={step.step}
                      className={`h-2 flex-1 rounded-full transition-colors ${
                        companyWizardStep >= step.step
                          ? isDark
                            ? 'bg-blue-500/80'
                            : 'bg-blue-500'
                          : isDark
                            ? 'bg-white/10'
                            : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {isEditingCompany && (
              <p className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Edit company details and tenant count below.
              </p>
            )}

            {isEditingCompany ? (
              <>
                  <div>
                  <Label htmlFor="companyName" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name</Label>
                  <input
                    id="companyName"
                    type="text"
                    value={companyForm.name}
                    onChange={(event) => updateCompanyForm('name', event.target.value)}
                    className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none border ${
                      formErrors.name
                        ? isDark
                          ? 'border-red-500/50 bg-red-500/10 text-gray-200'
                          : 'border-red-500 bg-red-50 text-gray-900'
                        : isDark
                          ? 'bg-[#09090B] border-white/10 text-gray-200 focus:border-blue-500/50'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                    }`}
                    placeholder="Company name"
                  />
                </div>

                  <div>
                  <Label htmlFor="companyDescription" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Description</Label>
                  <textarea
                    id="companyDescription"
                    rows={3}
                    value={companyForm.description}
                    onChange={(event) => updateCompanyForm('description', event.target.value)}
                    className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none resize-none border ${
                      formErrors.description
                        ? isDark
                          ? 'border-red-500/50 bg-red-500/10 text-gray-200'
                          : 'border-red-500 bg-red-50 text-gray-900'
                        : isDark
                          ? 'bg-[#09090B] border-white/10 text-gray-200 focus:border-blue-500/50'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                    }`}
                    placeholder="Company description"
                  />
                </div>

                  <div>
                  <Label htmlFor="companyEmail" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</Label>
                  <input
                    id="companyEmail"
                    type="email"
                    value={companyForm.email}
                    onChange={(event) => updateCompanyForm('email', event.target.value)}
                    className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none border ${
                      formErrors.email
                        ? isDark
                          ? 'border-red-500/50 bg-red-500/10 text-gray-200'
                          : 'border-red-500 bg-red-50 text-gray-900'
                        : isDark
                          ? 'bg-[#09090B] border-white/10 text-gray-200 focus:border-blue-500/50'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                    }`}
                    placeholder="company@example.com"
                  />
                </div>

                  <div>
                  <Label htmlFor="tenantCount" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tenant Count</Label>
                  <input
                    id="tenantCount"
                    type="number"
                    value={companyForm.tenantCount}
                    onChange={(event) => updateCompanyForm('tenantCount', event.target.value)}
                    className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none border ${
                      formErrors.tenantCount
                        ? isDark
                          ? 'border-red-500/50 bg-red-500/10 text-gray-200'
                          : 'border-red-500 bg-red-50 text-gray-900'
                        : isDark
                          ? 'bg-[#09090B] border-white/10 text-gray-200 focus:border-blue-500/50'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                    }`}
                  />
                  {formErrors.tenantCount && <p className={`mt-1 text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>{formErrors.tenantCount}</p>}
                </div>
              </>
            ) : (
              <>
                {companyWizardStep === 1 && (
                  <div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="companyName" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name *</Label>
                        <input
                          id="companyName"
                          type="text"
                          autoFocus
                          value={companyForm.name}
                          onChange={(event) => updateCompanyForm('name', event.target.value)}
                          className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none border ${
                            formErrors.name
                              ? isDark
                                ? 'border-red-500/50 bg-red-500/10 text-gray-200'
                                : 'border-red-500 bg-red-50 text-gray-900'
                              : isDark
                                ? 'bg-[#09090B] border-white/10 text-gray-200 focus:border-blue-500/50'
                                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                          }`}
                          placeholder="Company name"
                        />
                        {formErrors.name && <p className={`mt-1 text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>{formErrors.name}</p>}
                      </div>

                      <div>
                        <Label htmlFor="companyTenantCount" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tenant Count *</Label>
                        <input
                          id="companyTenantCount"
                          type="number"
                          value={companyForm.tenantCount}
                          onChange={(event) => updateCompanyForm('tenantCount', event.target.value)}
                          className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none border ${
                            formErrors.tenantCount
                              ? isDark
                                ? 'border-red-500/50 bg-red-500/10 text-gray-200'
                                : 'border-red-500 bg-red-50 text-gray-900'
                              : isDark
                                ? 'bg-[#09090B] border-white/10 text-gray-200 focus:border-blue-500/50'
                                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                          }`}
                          placeholder="0"
                        />
                        {formErrors.tenantCount && <p className={`mt-1 text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>{formErrors.tenantCount}</p>}
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="companyDescription" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Description *</Label>
                      <textarea
                        id="companyDescription"
                        rows={4}
                        value={companyForm.description}
                        onChange={(event) => updateCompanyForm('description', event.target.value)}
                        className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none resize-none border ${
                          formErrors.description
                            ? isDark
                              ? 'border-red-500/50 bg-red-500/10 text-gray-200'
                              : 'border-red-500 bg-red-50 text-gray-900'
                            : isDark
                              ? 'bg-[#09090B] border-white/10 text-gray-200 focus:border-blue-500/50'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                        }`}
                        placeholder="Company description"
                      />
                      {formErrors.description && <p className={`mt-1 text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>{formErrors.description}</p>}
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="companyEmail" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email *</Label>
                      <input
                        id="companyEmail"
                        type="email"
                        value={companyForm.email}
                        onChange={(event) => updateCompanyForm('email', event.target.value)}
                        className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none border ${
                          formErrors.email
                            ? isDark
                              ? 'border-red-500/50 bg-red-500/10 text-gray-200'
                              : 'border-red-500 bg-red-50 text-gray-900'
                            : isDark
                              ? 'bg-[#09090B] border-white/10 text-gray-200 focus:border-blue-500/50'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                        }`}
                        placeholder="company@example.com"
                      />
                      {formErrors.email && <p className={`mt-1 text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>{formErrors.email}</p>}
                    </div>
                  </div>
                )}

                {companyWizardStep === 2 && (
                  <div>
                    <Label htmlFor="serverIpAddress" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Server IP Address *</Label>
                    <input
                      id="serverIpAddress"
                      type="text"
                      autoFocus
                      value={companyForm.serverIpAddress}
                      onChange={(event) => updateCompanyForm('serverIpAddress', event.target.value)}
                      className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none border ${
                        formErrors.serverIpAddress
                          ? isDark
                            ? 'border-red-500/50 bg-red-500/10 text-gray-200'
                            : 'border-red-500 bg-red-50 text-gray-900'
                          : isDark
                            ? 'bg-[#09090B] border-white/10 text-gray-200 focus:border-blue-500/50'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                      }`}
                      placeholder="192.168.0.10"
                    />
                    {formErrors.serverIpAddress && <p className={`mt-1 text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>{formErrors.serverIpAddress}</p>}

                    <div className="mt-4">
                      <Label htmlFor="serverLabel" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Server Label</Label>
                      <input
                        id="serverLabel"
                        type="text"
                        value={companyForm.serverLabel}
                        onChange={(event) => setCompanyForm((prev) => ({ ...prev, serverLabel: event.target.value }))}
                        className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none border ${
                          isDark
                            ? 'bg-[#09090B] border-white/10 text-gray-200 focus:border-blue-500/50'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                        }`}
                        placeholder="Primary server"
                      />
                    </div>
                  </div>
                )}

                {companyWizardStep === 3 && (
                  <div>
                    <Label htmlFor="tenantName" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tenant Name *</Label>
                    <input
                      id="tenantName"
                      type="text"
                      autoFocus
                      value={companyForm.tenantName}
                      onChange={(event) => updateCompanyForm('tenantName', event.target.value)}
                      className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none border ${
                        formErrors.tenantName
                          ? isDark
                            ? 'border-red-500/50 bg-red-500/10 text-gray-200'
                            : 'border-red-500 bg-red-50 text-gray-900'
                          : isDark
                            ? 'bg-[#09090B] border-white/10 text-gray-200 focus:border-blue-500/50'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                      }`}
                      placeholder="Tenant name"
                    />
                    {formErrors.tenantName && <p className={`mt-1 text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>{formErrors.tenantName}</p>}

                    <div className="mt-4">
                      <Label htmlFor="tenantDescription" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tenant Description</Label>
                      <textarea
                        id="tenantDescription"
                        rows={4}
                        value={companyForm.tenantDescription}
                        onChange={(event) => setCompanyForm((prev) => ({ ...prev, tenantDescription: event.target.value }))}
                        className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none resize-none border ${
                          isDark
                            ? 'bg-[#09090B] border-white/10 text-gray-200 focus:border-blue-500/50'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                        }`}
                        placeholder="Tenant description"
                      />
                    </div>
                  </div>
                )}

                {companyWizardStep === 4 && (
                  <div>
                    <div>
                      <Label htmlFor="sipProvider" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>SIP Provider *</Label>
                      <input
                        id="sipProvider"
                        type="text"
                        autoFocus
                        value={companyForm.sipProvider}
                        onChange={(event) => updateCompanyForm('sipProvider', event.target.value)}
                        className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none border ${
                          formErrors.sipProvider
                            ? isDark
                              ? 'border-red-500/50 bg-red-500/10 text-gray-200'
                              : 'border-red-500 bg-red-50 text-gray-900'
                            : isDark
                              ? 'bg-[#09090B] border-white/10 text-gray-200 focus:border-blue-500/50'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                        }`}
                        placeholder="Twilio SIP"
                      />
                      {formErrors.sipProvider && <p className={`mt-1 text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>{formErrors.sipProvider}</p>}
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="sipCount" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>SIP Count</Label>
                        <input
                          id="sipCount"
                          type="number"
                          value={companyForm.sipCount}
                          onChange={(event) => setCompanyForm((prev) => ({ ...prev, sipCount: event.target.value }))}
                          className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none border ${
                            isDark
                              ? 'bg-[#09090B] border-white/10 text-gray-200 focus:border-blue-500/50'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                          }`}
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <Label htmlFor="sipChannelCount" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Channel Count</Label>
                        <input
                          id="sipChannelCount"
                          type="number"
                          value={companyForm.sipChannelCount}
                          onChange={(event) => setCompanyForm((prev) => ({ ...prev, sipChannelCount: event.target.value }))}
                          className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none border ${
                            isDark
                              ? 'bg-[#09090B] border-white/10 text-gray-200 focus:border-blue-500/50'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                          }`}
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <Label htmlFor="licenseCount" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>License Count</Label>
                        <input
                          id="licenseCount"
                          type="number"
                          value={companyForm.licenseCount}
                          onChange={(event) => setCompanyForm((prev) => ({ ...prev, licenseCount: event.target.value }))}
                          className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none border ${
                            isDark
                              ? 'bg-[#09090B] border-white/10 text-gray-200 focus:border-blue-500/50'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                          }`}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="sipDescription" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>SIP Description</Label>
                      <textarea
                        id="sipDescription"
                        rows={4}
                        value={companyForm.sipDescription}
                        onChange={(event) => setCompanyForm((prev) => ({ ...prev, sipDescription: event.target.value }))}
                        className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none resize-none border ${
                          isDark
                            ? 'bg-[#09090B] border-white/10 text-gray-200 focus:border-blue-500/50'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                        }`}
                        placeholder="SIP config description"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              {editingCompanyId !== null && (
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                    isDark
                      ? 'border-rose-400/40 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25'
                      : 'border-rose-300 bg-rose-100 text-rose-700 hover:bg-rose-200'
                  }`}
                >
                  Delete
                </button>
              )}
              {isEditingCompany ? (
                <button
                  type="submit"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                    isDark
                      ? 'border-blue-400/40 bg-blue-500/15 text-blue-200 hover:bg-blue-500/25'
                      : 'border-blue-300 bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  Save Changes
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    {companyWizardStep > 1 && (
                      <button
                        type="button"
                        onClick={handleWizardBack}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition text-3xl ${
                          isDark
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900'
                        }`}
                      >
                        ←
                      </button>
                    )}
                    {companyWizardStep < addCompanyWizardSteps.length ? (
                      <button
                        type="button"
                        onClick={handleWizardNext}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition text-3xl ${
                          isDark
                            ? 'bg-blue-600 text-blue-200 hover:bg-blue-500 hover:text-white'
                            : 'bg-blue-400 text-white hover:bg-blue-500'
                        }`}
                      >
                        →
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                          isDark
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        Add Company Bundle
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    )}

    {isDeleteConfirmOpen && editingCompanyId !== null && (
      <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${isDark ? 'bg-black/70' : 'bg-black/45'}`}>
        <div className={`w-full max-w-sm rounded-xl border p-4 ${
          isDark
            ? 'bg-[#10131A] border-rose-400/30 shadow-[0_0_30px_rgba(244,63,94,0.25)]'
            : 'bg-white border-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <h5 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Delete this company?
            </h5>
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${
                isDark
                  ? 'border-white/10 text-gray-300 hover:text-white hover:bg-white/5'
                  : 'border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              aria-label="Close delete confirmation"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
          <p className={`mt-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Are you sure you want to delete {editingCompany?.name || 'this company'}? This action cannot be undone.
          </p>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className={`px-3 py-1.5 rounded-lg text-xs border ${
                isDark
                  ? 'border-white/10 text-gray-300 hover:text-white hover:bg-white/5'
                  : 'border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteCompany}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                isDark
                  ? 'border-rose-400/40 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25'
                  : 'border-rose-300 bg-rose-100 text-rose-700 hover:bg-rose-200'
              }`}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
