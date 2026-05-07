import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowUpDown, Check, ChevronLeft, ChevronRight, Download, Edit2, Plus, Search, ServerCog, Settings2, SlidersHorizontal, Users, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Datepicker, Label } from 'flowbite-react';
import { API_BASE_URL } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { useDrawer } from '../context/DrawerContext';

type CompanyListUIProps = {
  isDark?: boolean;
  isSidebarMinimized?: boolean;
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

export default function CompanyListUI({ token, onUnauthorized }: CompanyListUIProps) {
  const { isDark } = useTheme();
  const { isDrawerOpen, setIsUserManagementOpen } = useDrawer();
  const mainMarginClass = isDrawerOpen ? "md:ml-64" : "md:ml-20";
  const isSidebarMinimized = !isDrawerOpen;
  const navigate = useNavigate();
  const idSortMenuRef = useRef<HTMLDivElement>(null);
  const nameSortMenuRef = useRef<HTMLDivElement>(null);
  const emailSortMenuRef = useRef<HTMLDivElement>(null);
  const descriptionSortMenuRef = useRef<HTMLDivElement>(null);
  const tenantCountSortMenuRef = useRef<HTMLDivElement>(null);
  const createdAtSortMenuRef = useRef<HTMLDivElement>(null);
  const updatedAtSortMenuRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'email' | 'description' | 'tenantCount' | 'createdAt' | 'updatedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isIdSortMenuOpen, setIsIdSortMenuOpen] = useState(false);
  const [isNameSortMenuOpen, setIsNameSortMenuOpen] = useState(false);
  const [isEmailSortMenuOpen, setIsEmailSortMenuOpen] = useState(false);
  const [isDescriptionSortMenuOpen, setIsDescriptionSortMenuOpen] = useState(false);
  const [isTenantCountSortMenuOpen, setIsTenantCountSortMenuOpen] = useState(false);
  const [isCreatedAtSortMenuOpen, setIsCreatedAtSortMenuOpen] = useState(false);

  // Modal Pagination State
  const [modalServerPage, setModalServerPage] = useState(1);
  const [modalServerRowsPerPage, setModalServerRowsPerPage] = useState(5);
  const [modalTenantPage, setModalTenantPage] = useState(1);
  const [modalTenantRowsPerPage, setModalTenantRowsPerPage] = useState(5);

  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  const [activeServerCompanyId, setActiveServerCompanyId] = useState<number | null>(null);
  const [serverRecords, setServerRecords] = useState<any[]>([]);
  const [loadingServers, setLoadingServers] = useState(false);
  const [serverSearchTerm, setServerSearchTerm] = useState('');
  const [serverSortBy, setServerSortBy] = useState<'ipAddress' | 'label' | 'tenantCount' | 'createdAt'>('ipAddress');
  const [serverSortOrder, setServerSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isModalServerIpSortMenuOpen, setIsModalServerIpSortMenuOpen] = useState(false);
  const [isModalServerLabelSortMenuOpen, setIsModalServerLabelSortMenuOpen] = useState(false);
  const [isModalServerTenantCountSortMenuOpen, setIsModalServerTenantCountSortMenuOpen] = useState(false);
  const [isModalServerCreatedAtSortMenuOpen, setIsModalServerCreatedAtSortMenuOpen] = useState(false);

  const [activeTenantCompanyId, setActiveTenantCompanyId] = useState<number | null>(null);
  const [tenantRecords, setTenantRecords] = useState<any[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [tenantSearchTerm, setTenantSearchTerm] = useState('');
  const [tenantSortBy, setTenantSortBy] = useState<'name' | 'description' | 'sipConfigsCount' | 'licenseCount' | 'createdAt'>('name');
  const [tenantSortOrder, setTenantSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isModalTenantNameSortMenuOpen, setIsModalTenantNameSortMenuOpen] = useState(false);
  const [isModalTenantDescSortMenuOpen, setIsModalTenantDescSortMenuOpen] = useState(false);
  const [isModalTenantSipSortMenuOpen, setIsModalTenantSipSortMenuOpen] = useState(false);
  const [isModalTenantLicenseSortMenuOpen, setIsModalTenantLicenseSortMenuOpen] = useState(false);
  const [isModalTenantCreatedAtSortMenuOpen, setIsModalTenantCreatedAtSortMenuOpen] = useState(false);

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
  const nextStep = () => {
    if (validateCompanyWizardStep(companyWizardStep)) {
      setCompanyWizardStep(prev => Math.min(4, prev + 1));
    } else {
      toast.error('Please fix the errors in this step first');
    }
  };
  const prevStep = () => {
    setCompanyWizardStep(prev => Math.max(1, prev - 1));
  };
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    companyName: '',
    tenantCount: '',
  });
  const [tempFilters, setTempFilters] = useState({
    fromDate: '',
    toDate: '',
    companyName: '',
    tenantCount: '',
  });

  const filterDropdownRef = useRef<HTMLDivElement>(null);



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

  const mapApiCompany = (company: any): CompanyRecord => {
    const parseDate = (d: any) => {
      if (!d) return 'N/A';
      const dateObj = new Date(d);
      if (isNaN(dateObj.getTime())) return 'N/A';
      return formatDateTime(dateObj);
    };

    return {
      id: Number(company.id),
      name: String(company.name || ''),
      description: String(company.description || ''),
      email: String(company.email || ''),
      tenantCount: Number(company.tenantCount || 0),
      createdAt: parseDate(company.createdAt),
      updatedAt: parseDate(company.updatedAt),
    };
  };

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
      // Handle either the new { companies: [...] } format or the legacy [...] format
      const companiesArray = Array.isArray(data) ? data : (data.companies || []);
      const rows = companiesArray.map(mapApiCompany);
      setCompanies(rows);
    } catch (error) {
      console.error('Fetch companies error:', error);
      toast.error('Unable to load companies');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchCompanyServers = async (companyId: number) => {
    try {
      setLoadingServers(true);
      const response = await fetch(`${API_BASE_URL}/api/servers?companyId=${companyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch servers');
      const data = await response.json();
      setServerRecords(data.servers || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load servers');
      setServerRecords([]);
    } finally {
      setLoadingServers(false);
    }
  };

  const fetchCompanyTenants = async (companyId: number) => {
    try {
      setLoadingTenants(true);
      const response = await fetch(`${API_BASE_URL}/api/tenants?companyId=${companyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch tenants');
      const data = await response.json();
      setTenantRecords(data.tenants || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load tenants');
      setTenantRecords([]);
    } finally {
      setLoadingTenants(false);
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
      if (!Number.isFinite(parsedTenantCount) || parsedTenantCount < 0) {
        errors.tenantCount = 'Tenant count must be a non-negative number';
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





  const handleCompanySubmit = async (event?: any) => {
    if (event && event.preventDefault) event.preventDefault();

    setIsSavingCompany(true);
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
      console.log('Creating company...', { name: companyForm.name, email: companyForm.email, tenantCount: parsedTenantCount });
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
        console.error('Company creation failed:', companyResponse.status);
        if (companyResponse.status === 401) {
          toast.error('Session expired. Please log in again.');
          onUnauthorized();
          return;
        }

        const message = await getApiErrorMessage(companyResponse, 'Failed to create company');
        toast.error(message);
        return;
      }

      console.log('Company created successfully');

      const companyPayload = await companyResponse.json().catch(() => ({}));
      const createdCompanyId = Number(companyPayload?.company?.id);
      if (!Number.isFinite(createdCompanyId) || createdCompanyId <= 0) {
        console.error('Create company failed: Invalid response', companyPayload);
        throw new Error('Created company id missing in response');
      }

      console.log('Creating server for companyId:', createdCompanyId);
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
        console.error('Server creation failed:', serverResponse.status);
        const message = await getApiErrorMessage(serverResponse, 'Company was created, but server creation failed');
        toast.error(message);
        return;
      }

      console.log('Server created successfully');

      console.log('Creating tenant for companyId:', createdCompanyId);
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
        console.error('Tenant creation failed:', tenantResponse.status);
        const message = await getApiErrorMessage(tenantResponse, 'Company and server were created, but tenant creation failed');
        toast.error(message);
        return;
      }

      console.log('Tenant created successfully');

      const tenantPayload = await tenantResponse.json().catch(() => ({}));
      const createdTenantId = Number(tenantPayload?.tenant?.id);
      if (!Number.isFinite(createdTenantId) || createdTenantId <= 0) {
        console.error('Create tenant failed: Invalid response', tenantPayload);
        throw new Error('Created tenant id missing in response');
      }

      const sipCountValue = companyForm.sipCount.trim();
      const sipChannelCountValue = companyForm.sipChannelCount.trim();
      const licenseCountValue = companyForm.licenseCount.trim();

      console.log('Creating SIP config for tenantId:', createdTenantId);
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
        console.error('SIP config creation failed:', sipConfigResponse.status);
        const message = await getApiErrorMessage(sipConfigResponse, 'Company, server, and tenant were created, but SIP config creation failed');
        toast.error(message);
        return;
      }

      console.log('All components created successfully');

      await fetchCompanies();
      closeCompanyModal();
      toast.success('Company, server, tenant, and SIP config created');
    } catch (error: any) {
      console.error('Save company full error object:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('Network error or CORS issue detected');
        toast.error('Network error: Unable to reach the server. Please check your connection or CORS settings.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Unable to save company');
      }
    } finally {
      setIsSavingCompany(false);
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

  const actionTooltipClass = `action-tooltip pointer-events-none absolute -top-9 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-md px-2.5 py-1 text-[0.75rem] font-bold shadow-xl opacity-0 transition-all duration-150 ease-out peer-hover:opacity-100 peer-focus-visible:opacity-100 ${isDark
    ? 'bg-slate-950 text-sky-200 border border-sky-500/30 shadow-sky-500/10'
    : 'bg-slate-900 text-slate-100 border border-slate-800'
    }`;

  useEffect(() => {
    if (token) {
      fetchCompanies();
    }
  }, [token]);

  const closeAllSortMenus = () => {
    setIsIdSortMenuOpen(false);
    setIsNameSortMenuOpen(false);
    setIsEmailSortMenuOpen(false);
    setIsDescriptionSortMenuOpen(false);
    setIsTenantCountSortMenuOpen(false);
    setIsCreatedAtSortMenuOpen(false);
  };

  const applyColumnSort = (field: 'id' | 'name' | 'email' | 'description' | 'tenantCount' | 'createdAt' | 'updatedAt', nextSortOrder: 'asc' | 'desc') => {
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
        emailSortMenuRef.current?.contains(target) ||
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

  useEffect(() => {
    const handleClickOutsideFilter = (event: MouseEvent) => {
      // Check if the click is inside the dropdown or on a flowbite datepicker element
      const target = event.target as HTMLElement;
      const isDatepickerClick = target.closest('.datepicker') || target.closest('[data-testid="datepicker-popup"]');

      if (filterDropdownRef.current &&
        !filterDropdownRef.current.contains(target) &&
        !isDatepickerClick) {
        setIsFilterDropdownOpen(false);
      }
    };
    if (isFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutsideFilter);
    }
    return () => document.removeEventListener('mousedown', handleClickOutsideFilter);
  }, [isFilterDropdownOpen]);



  const filteredAndSortedCompanies = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    let rows = companies.filter((company) => {
      // Keyword Search
      const matchesKeyword = !keyword || (
        company.name.toLowerCase().includes(keyword) ||
        (company.description || '').toLowerCase().includes(keyword) ||
        String(company.tenantCount).includes(keyword) ||
        (company.createdAt || '').toLowerCase().includes(keyword) ||
        (company.updatedAt || '').toLowerCase().includes(keyword)
      );

      // Date Range Filter
      let matchesDate = true;
      if (filters.fromDate || filters.toDate) {
        const companyDate = new Date(company.createdAt).getTime();
        if (filters.fromDate) {
          const from = new Date(filters.fromDate).getTime();
          if (companyDate < from) matchesDate = false;
        }
        if (filters.toDate) {
          const to = new Date(filters.toDate).getTime();
          // Add one day to 'to' date to include the full day
          const toEndOfDay = to + (24 * 60 * 60 * 1000) - 1;
          if (companyDate > toEndOfDay) matchesDate = false;
        }
      }

      // Company Name Filter
      let matchesCompany = true;
      if (filters.companyName) {
        if (company.name !== filters.companyName) matchesCompany = false;
      }


      // Tenant Count Filter
      let matchesTenantCount = true;
      if (filters.tenantCount) {
        if (company.tenantCount !== Number(filters.tenantCount)) matchesTenantCount = false;
      }

      return matchesKeyword && matchesDate && matchesCompany && matchesTenantCount;
    });

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
  }, [companies, searchTerm, sortBy, sortOrder, filters]);

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
    <main className={`p-4 ${mainMarginClass} h-auto pt-20 transition-all duration-300 pb-12`}>
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
                className={`w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-all ${isDark
                  ? 'bg-[#09090B] border border-white/10 text-gray-200 placeholder:text-gray-600 focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.12)]'
                  : 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-400 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                  }`}
              />
            </div>

            <div className="relative" ref={filterDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setTempFilters(filters);
                  setIsFilterDropdownOpen(!isFilterDropdownOpen);
                }}
                className={`h-[42px] px-3 rounded-xl border flex items-center gap-2 text-sm transition-all whitespace-nowrap ${isDark
                  ? 'bg-[#09090B] border-white/10 text-gray-300 hover:text-white hover:border-white/20'
                  : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400'
                  }`}
                title="Filter"
              >
                <SlidersHorizontal size={15} /> Filter
              </button>

              {isFilterDropdownOpen && (
                <div className={`absolute top-full right-0 mt-2 w-80 rounded-2xl border p-4 z-[60] shadow-2xl ${isDark ? 'bg-[#0B0E14] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
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
                              root: {
                                input: {
                                  base: `block w-full rounded-lg border text-xs outline-none py-2.5 px-4 transition-all ${isDark
                                      ? 'bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10'
                                      : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20'
                                    }`,
                                }
                              },
                              popup: {
                                root: {
                                  base: `absolute top-12 left-0 z-50 block pt-2 ${isDark ? 'bg-[#0B0E14]' : 'bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-xl border border-gray-100'}`
                                },
                                header: {
                                  base: "flex justify-between items-center mb-2 px-2",
                                  title: "text-sm font-semibold text-gray-700 dark:text-gray-200",
                                  selectors: {
                                    button: {
                                      base: "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 rounded-lg transition-colors p-1"
                                    }
                                  }
                                },
                                footer: {
                                  base: "hidden"
                                }
                              },
                              views: {
                                days: {
                                  header: {
                                    base: "grid grid-cols-7 mb-1",
                                    title: "text-[0.75rem] font-medium text-gray-400 text-center"
                                  },
                                  items: {
                                    base: "grid grid-cols-7",
                                    item: {
                                      base: "block flex-1 cursor-pointer rounded-lg border-0 text-center text-xs font-semibold leading-9 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5",
                                      selected: "bg-cyan-500 text-white hover:bg-cyan-600",
                                      disabled: "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                    }
                                  }
                                }
                              }
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
                              root: {
                                input: {
                                  base: `block w-full rounded-lg border text-xs outline-none py-2.5 px-4 transition-all ${isDark
                                      ? 'bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10'
                                      : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20'
                                    }`,
                                }
                              },
                              popup: {
                                root: {
                                  base: `absolute top-12 right-0 z-50 block pt-2 ${isDark ? 'bg-[#0B0E14]' : 'bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-xl border border-gray-100'}`
                                },
                                header: {
                                  base: "flex justify-between items-center mb-2 px-2",
                                  title: "text-sm font-semibold text-gray-700 dark:text-gray-200",
                                  selectors: {
                                    button: {
                                      base: "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 rounded-lg transition-colors p-1"
                                    }
                                  }
                                },
                                footer: {
                                  base: "hidden"
                                }
                              },
                              views: {
                                days: {
                                  header: {
                                    base: "grid grid-cols-7 mb-1",
                                    title: "text-[0.75rem] font-medium text-gray-400 text-center"
                                  },
                                  items: {
                                    base: "grid grid-cols-7",
                                    item: {
                                      base: "block flex-1 cursor-pointer rounded-lg border-0 text-center text-xs font-semibold leading-9 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5",
                                      selected: "bg-cyan-500 text-white hover:bg-cyan-600",
                                      disabled: "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                    }
                                  }
                                }
                              }
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
                        {Array.from(new Set(companies.map(c => c.name))).sort().map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>


                    {/* Tenants Count */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400">Tenants Count</span>
                        <button
                          onClick={() => setTempFilters(prev => ({ ...prev, tenantCount: '' }))}
                          className="text-[10px] text-blue-500 hover:underline"
                        >
                          Reset
                        </button>
                      </div>
                      <input
                        type="number"
                        placeholder="Input count..."
                        value={tempFilters.tenantCount}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, tenantCount: e.target.value }))}
                        className={`w-full text-xs rounded-lg p-2 border outline-none ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                          }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                    <button
                      onClick={() => {
                        setTempFilters({ fromDate: '', toDate: '', companyName: '', tenantCount: '' });
                        setFilters({ fromDate: '', toDate: '', companyName: '', tenantCount: '' });
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
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all shadow-lg ${isDark
                          ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/20'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
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
              onClick={() => navigate('/users')}
              className={`h-[42px] px-3 rounded-xl border flex items-center gap-2 text-sm transition-all whitespace-nowrap ${isDark
                ? 'bg-[#09090B] border-white/10 text-gray-300 hover:text-white hover:border-white/20'
                : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400'
                }`}
              title="User Management"
            >
              <Users size={15} className="text-blue-500" /> User Management
            </button>

            <button
              type="button"
              onClick={openAddCompanyModal}
              className={`h-[42px] px-3 rounded-xl border flex items-center gap-2 text-sm transition-all whitespace-nowrap ${isDark
                ? 'bg-[#09090B] border-white/10 text-gray-300 hover:text-white hover:border-white/20'
                : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400'
                }`}
              title="Add"
              aria-label="Add"
            >
              <Plus size={15} className="text-emerald-500" /> Add
            </button>

            <button
              type="button"
              onClick={handleExportCompanies}
              className={`h-[42px] px-3 rounded-xl border flex items-center gap-2 text-sm transition-all ${isDark
                ? 'bg-[#09090B] border-white/10 text-gray-300 hover:text-white hover:border-white/20'
                : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400'
                }`}
              title="Export companies to Excel"
            >
              <Download size={15} /> Export
            </button>
          </div>
        </div>

        <div className={`w-full max-w-full rounded-2xl px-3 pb-3 pt-2 table-animated-surface ${isDark ? 'table-animated-surface--dark' : 'table-animated-surface--light'} ${isDark
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
                        }}
                        className={`rounded-md p-1.5 transition-colors ${isDark ? 'hover:bg-white/10 text-blue-200/70' : 'hover:bg-blue-100 text-blue-600'
                          }`}
                        aria-label="Sort company id"
                        title="Sort company id"
                      >
                        <ArrowUpDown size={13} />
                      </button>

                      {isIdSortMenuOpen && (
                        <div className={`absolute top-full left-0 mt-2 min-w-[92px] rounded-lg border p-1 z-30 shadow-xl ${isDark ? 'bg-[#111318] border-white/10' : 'bg-white border-gray-200'
                          }`}>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('id', 'asc')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[0.75rem] uppercase transition-colors ${sortBy === 'id' && sortOrder === 'asc'
                              ? isDark
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-blue-100 text-blue-700'
                              : isDark
                                ? 'text-gray-300 hover:bg-white/5'
                                : 'text-gray-700 hover:bg-gray-100'
                              }`}
                          >
                            ASC
                          </button>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('id', 'desc')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[0.75rem] uppercase transition-colors ${sortBy === 'id' && sortOrder === 'desc'
                              ? isDark
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-blue-100 text-blue-700'
                              : isDark
                                ? 'text-gray-300 hover:bg-white/5'
                                : 'text-gray-700 hover:bg-gray-100'
                              }`}
                          >
                            DSC
                          </button>

                        </div>
                      )}
                    </div>
                  </th>
                  <th className={`px-6 py-3 text-[0.75rem] font-semibold tracking-[0.12em] uppercase ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>
                    <div className="relative inline-flex items-center gap-2" ref={nameSortMenuRef}>
                      <span>name</span>
                      <button
                        type="button"
                        onClick={() => {
                          const isOpen = isNameSortMenuOpen;
                          closeAllSortMenus();
                          setIsNameSortMenuOpen(!isOpen);
                        }}
                        className={`rounded-md p-1.5 transition-colors ${isDark ? 'hover:bg-white/10 text-blue-200/70' : 'hover:bg-blue-100 text-blue-600'
                          }`}
                        aria-label="Sort name"
                        title="Sort name"
                      >
                        <ArrowUpDown size={13} />
                      </button>

                      {isNameSortMenuOpen && (
                        <div className={`absolute top-full left-0 mt-2 min-w-[92px] rounded-lg border p-1 z-30 shadow-xl ${isDark ? 'bg-[#111318] border-white/10' : 'bg-white border-gray-200'
                          }`}>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('name', 'asc')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[0.75rem] uppercase transition-colors ${sortBy === 'name' && sortOrder === 'asc'
                              ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                              : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
                              }`}
                          >
                            ASC
                          </button>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('name', 'desc')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[0.75rem] uppercase transition-colors ${sortBy === 'name' && sortOrder === 'desc'
                              ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                              : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
                              }`}
                          >
                            DSC
                          </button>

                        </div>
                      )}
                    </div>
                  </th>
                  <th className={`px-6 py-3 text-[0.75rem] font-semibold tracking-[0.12em] uppercase ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>
                    <div className="relative inline-flex items-center gap-2" ref={emailSortMenuRef}>
                      <span>email</span>
                      <button
                        type="button"
                        onClick={() => {
                          const isOpen = isEmailSortMenuOpen;
                          closeAllSortMenus();
                          setIsEmailSortMenuOpen(!isOpen);
                        }}
                        className={`rounded-md p-1.5 transition-colors ${isDark ? 'hover:bg-white/10 text-blue-200/70' : 'hover:bg-blue-100 text-blue-600'
                          }`}
                        aria-label="Sort email"
                        title="Sort email"
                      >
                        <ArrowUpDown size={13} />
                      </button>

                      {isEmailSortMenuOpen && (
                        <div className={`absolute top-full left-0 mt-2 min-w-[92px] rounded-lg border p-1 z-30 shadow-xl ${isDark ? 'bg-[#111318] border-white/10' : 'bg-white border-gray-200'
                          }`}>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('email', 'asc')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[0.75rem] uppercase transition-colors ${sortBy === 'email' && sortOrder === 'asc'
                              ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                              : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
                              }`}
                          >
                            ASC
                          </button>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('email', 'desc')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[0.75rem] uppercase transition-colors ${sortBy === 'email' && sortOrder === 'desc'
                              ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                              : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
                              }`}
                          >
                            DSC
                          </button>

                        </div>
                      )}
                    </div>
                  </th>
                  <th className={`px-6 py-3 text-[0.75rem] font-semibold tracking-[0.12em] uppercase ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>
                    <div className="relative inline-flex items-center gap-2" ref={tenantCountSortMenuRef}>
                      <span>tenant_count</span>
                      <button
                        type="button"
                        onClick={() => {
                          const isOpen = isTenantCountSortMenuOpen;
                          closeAllSortMenus();
                          setIsTenantCountSortMenuOpen(!isOpen);
                        }}
                        className={`rounded-md p-1.5 transition-colors ${isDark ? 'hover:bg-white/10 text-blue-200/70' : 'hover:bg-blue-100 text-blue-600'
                          }`}
                        aria-label="Sort tenant count"
                        title="Sort tenant count"
                      >
                        <ArrowUpDown size={13} />
                      </button>

                      {isTenantCountSortMenuOpen && (
                        <div className={`absolute top-full left-0 mt-2 min-w-[92px] rounded-lg border p-1 z-30 shadow-xl ${isDark ? 'bg-[#111318] border-white/10' : 'bg-white border-gray-200'
                          }`}>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('tenantCount', 'asc')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[0.75rem] uppercase transition-colors ${sortBy === 'tenantCount' && sortOrder === 'asc'
                              ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                              : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
                              }`}
                          >
                            ASC
                          </button>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('tenantCount', 'desc')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[0.75rem] uppercase transition-colors ${sortBy === 'tenantCount' && sortOrder === 'desc'
                              ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                              : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
                              }`}
                          >
                            DSC
                          </button>

                        </div>
                      )}
                    </div>
                  </th>
                  <th className={`px-6 py-3 text-[0.75rem] font-semibold tracking-[0.12em] uppercase ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>
                    <div className="relative inline-flex items-center gap-2" ref={createdAtSortMenuRef}>
                      <span>created_at</span>
                      <button
                        type="button"
                        onClick={() => {
                          const isOpen = isCreatedAtSortMenuOpen;
                          closeAllSortMenus();
                          setIsCreatedAtSortMenuOpen(!isOpen);
                        }}
                        className={`rounded-md p-1.5 transition-colors ${isDark ? 'hover:bg-white/10 text-blue-200/70' : 'hover:bg-blue-100 text-blue-600'
                          }`}
                        aria-label="Sort created at"
                        title="Sort created at"
                      >
                        <ArrowUpDown size={13} />
                      </button>

                      {isCreatedAtSortMenuOpen && (
                        <div className={`absolute top-full left-0 mt-2 min-w-[92px] rounded-lg border p-1 z-30 shadow-xl ${isDark ? 'bg-[#111318] border-white/10' : 'bg-white border-gray-200'
                          }`}>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('createdAt', 'asc')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[0.75rem] uppercase transition-colors ${sortBy === 'createdAt' && sortOrder === 'asc'
                              ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                              : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
                              }`}
                          >
                            ASC
                          </button>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('createdAt', 'desc')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[0.75rem] uppercase transition-colors ${sortBy === 'createdAt' && sortOrder === 'desc'
                              ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                              : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
                              }`}
                          >
                            DSC
                          </button>

                        </div>
                      )}
                    </div>
                  </th>



                  <th className={`px-4 py-3 text-[0.75rem] font-semibold tracking-[0.12em] uppercase text-center ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>
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
                      className={`rounded-l-xl transition-colors ${isDark
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
                      className={`transition-colors ${isDark
                        ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]`
                        : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-blue-50`
                        }`}
                      style={{ padding: isSidebarMinimized ? '16px 24px' : '16px 16px' }}
                    >
                      <span className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`} style={{ fontSize: isSidebarMinimized ? '13px' : '13px' }}>
                        {company.name}
                      </span>
                    </td>

                    <td
                      className={`transition-colors ${isDark
                        ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]`
                        : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-blue-50`
                        }`}
                      style={{ padding: isSidebarMinimized ? '16px 24px' : '16px 16px' }}
                    >
                      <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: isSidebarMinimized ? '12px' : '12px' }}>
                        {company.email}
                      </span>
                    </td>

                    <td
                      className={`transition-colors ${isDark
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
                      className={`transition-colors ${isDark
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
                      className={`rounded-r-xl transition-colors ${isDark
                        ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]`
                        : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-blue-50`
                        }`}
                      style={{ padding: isSidebarMinimized ? '12px 20px' : '12px 16px' }}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => navigate(`/customizations?companyId=${company.id}&companyName=${encodeURIComponent(company.name)}`)}
                            className={`peer inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ${isDark
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

                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => navigate(`/servers?companyId=${company.id}&companyName=${encodeURIComponent(company.name)}`)}
                            className={`peer inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ${isDark
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

                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => navigate(`/tenants?companyId=${company.id}&companyName=${encodeURIComponent(company.name)}`)}
                            className={`peer inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ${isDark
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

                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => openEditCompanyModal(company)}
                            className={`peer inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ${isDark
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
                    <td colSpan={8} className="text-center py-20">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className={`p-5 rounded-3xl ${isDark ? 'bg-slate-900/50 border border-slate-800' : 'bg-slate-50 border border-slate-100'}`}>
                          <Search size={32} className={`${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                        </div>
                        <div className="space-y-2">
                          <h3 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {searchTerm ? 'No matching results found' : 'No companies in record'}
                          </h3>
                          <p className={`text-sm max-w-xs mx-auto ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {searchTerm 
                              ? `We couldn't find any companies matching "${searchTerm}". Try adjusting your filters.`
                              : 'There are currently no companies listed in the system.'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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

      {activeServerCompanyId !== null && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? 'bg-black/65' : 'bg-black/40'}`}>
          <div className={`w-full max-w-4xl rounded-2xl border p-6 ${isDark
            ? 'bg-[#111318] border-white/10 shadow-[0_0_35px_rgba(139,92,246,0.25)]'
            : 'bg-white border-gray-200 shadow-[0_0_25px_rgba(139,92,246,0.15)]'
            }`}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-violet-500/10 p-2.5 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                  <ServerCog size={22} />
                </div>
                <div>
                  <h4 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Servers
                  </h4>
                  <p className="text-sm text-slate-400">
                    Managing servers for this company.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={serverSearchTerm}
                    onChange={(e) => setServerSearchTerm(e.target.value)}
                    className="w-48 rounded-2xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/40"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setActiveServerCompanyId(null)}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border ${isDark
                    ? 'border-white/10 text-gray-300 hover:text-white hover:bg-white/5'
                    : 'border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  aria-label="Close servers modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {loadingServers ? (
              <div className="text-center py-12 text-gray-500 text-sm">Loading servers...</div>
            ) : serverRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">No servers found for this company.</div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
                <table className="min-w-full divide-y divide-white/10 text-left">
                  <thead className="bg-black/20 text-[0.75rem] uppercase tracking-[0.24em] text-slate-400">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        <div className="relative inline-flex items-center gap-2">
                          <span>IP Address</span>
                          <button type="button" onClick={() => setIsModalServerIpSortMenuOpen(!isModalServerIpSortMenuOpen)} className="rounded-md p-1 hover:bg-white/10"><ArrowUpDown size={13} /></button>
                          {isModalServerIpSortMenuOpen && (
                            <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                              <button type="button" onClick={() => { setServerSortBy('ipAddress'); setServerSortOrder('asc'); setIsModalServerIpSortMenuOpen(false); }} className={`w-full rounded-md px-2 py-1.5 text-left text-[0.75rem] uppercase ${serverSortBy === 'ipAddress' && serverSortOrder === 'asc' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}>asc</button>
                              <button type="button" onClick={() => { setServerSortBy('ipAddress'); setServerSortOrder('desc'); setIsModalServerIpSortMenuOpen(false); }} className={`w-full rounded-md px-2 py-1.5 text-left text-[0.75rem] uppercase ${serverSortBy === 'ipAddress' && serverSortOrder === 'desc' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}>dsc</button>
                            </div>
                          )}
                        </div>
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        <div className="relative inline-flex items-center gap-2">
                          <span>Label</span>
                          <button type="button" onClick={() => setIsModalServerLabelSortMenuOpen(!isModalServerLabelSortMenuOpen)} className="rounded-md p-1 hover:bg-white/10"><ArrowUpDown size={13} /></button>
                          {isModalServerLabelSortMenuOpen && (
                            <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                              <button type="button" onClick={() => { setServerSortBy('label'); setServerSortOrder('asc'); setIsModalServerLabelSortMenuOpen(false); }} className={`w-full rounded-md px-2 py-1.5 text-left text-[0.75rem] uppercase ${serverSortBy === 'label' && serverSortOrder === 'asc' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}>asc</button>
                              <button type="button" onClick={() => { setServerSortBy('label'); setServerSortOrder('desc'); setIsModalServerLabelSortMenuOpen(false); }} className={`w-full rounded-md px-2 py-1.5 text-left text-[0.75rem] uppercase ${serverSortBy === 'label' && serverSortOrder === 'desc' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}>dsc</button>
                            </div>
                          )}
                        </div>
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        <div className="relative inline-flex items-center gap-2">
                          <span>Tenant Count</span>
                          <button type="button" onClick={() => setIsModalServerTenantCountSortMenuOpen(!isModalServerTenantCountSortMenuOpen)} className="rounded-md p-1 hover:bg-white/10"><ArrowUpDown size={13} /></button>
                          {isModalServerTenantCountSortMenuOpen && (
                            <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                              <button type="button" onClick={() => { setServerSortBy('tenantCount'); setServerSortOrder('asc'); setIsModalServerTenantCountSortMenuOpen(false); }} className={`w-full rounded-md px-2 py-1.5 text-left text-[0.75rem] uppercase ${serverSortBy === 'tenantCount' && serverSortOrder === 'asc' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}>asc</button>
                              <button type="button" onClick={() => { setServerSortBy('tenantCount'); setServerSortOrder('desc'); setIsModalServerTenantCountSortMenuOpen(false); }} className={`w-full rounded-md px-2 py-1.5 text-left text-[0.75rem] uppercase ${serverSortBy === 'tenantCount' && serverSortOrder === 'desc' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}>dsc</button>
                            </div>
                          )}
                        </div>
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        <div className="relative inline-flex items-center gap-2">
                          <span>Created At</span>
                          <button type="button" onClick={() => setIsModalServerCreatedAtSortMenuOpen(!isModalServerCreatedAtSortMenuOpen)} className="rounded-md p-1 hover:bg-white/10"><ArrowUpDown size={13} /></button>
                          {isModalServerCreatedAtSortMenuOpen && (
                            <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                              <button type="button" onClick={() => { setServerSortBy('createdAt'); setServerSortOrder('asc'); setIsModalServerCreatedAtSortMenuOpen(false); }} className={`w-full rounded-md px-2 py-1.5 text-left text-[0.75rem] uppercase ${serverSortBy === 'createdAt' && serverSortOrder === 'asc' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}>asc</button>
                              <button type="button" onClick={() => { setServerSortBy('createdAt'); setServerSortOrder('desc'); setIsModalServerCreatedAtSortMenuOpen(false); }} className={`w-full rounded-md px-2 py-1.5 text-left text-[0.75rem] uppercase ${serverSortBy === 'createdAt' && serverSortOrder === 'desc' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}>dsc</button>
                            </div>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8">
                    {(() => {
                      const filtered = serverRecords
                        .filter(item =>
                          item.ipAddress?.toLowerCase().includes(serverSearchTerm.toLowerCase()) ||
                          item.label?.toLowerCase().includes(serverSearchTerm.toLowerCase())
                        )
                        .sort((a, b) => {
                          const direction = serverSortOrder === 'asc' ? 1 : -1;
                          if (serverSortBy === 'tenantCount') return ((a.tenantCount || 0) - (b.tenantCount || 0)) * direction;
                          if (serverSortBy === 'createdAt') {
                            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                            return (dateA - dateB) * direction;
                          }
                          const left = String(a[serverSortBy] || '').toLowerCase();
                          const right = String(b[serverSortBy] || '').toLowerCase();
                          return left.localeCompare(right) * direction;
                        });

                      const totalPages = Math.ceil(filtered.length / modalServerRowsPerPage);
                      const paged = filtered.slice((modalServerPage - 1) * modalServerRowsPerPage, modalServerPage * modalServerRowsPerPage);

                      return (
                        <>
                          {paged.map((item, idx) => (
                            <tr key={item.id || idx} className="transition hover:bg-white/5">
                              <td className="px-5 py-4 text-sm font-medium text-white">
                                {item.ipAddress || 'N/A'}
                              </td>
                              <td className="px-5 py-4 text-sm text-violet-300">
                                {item.label || 'N/A'}
                              </td>
                              <td className="px-5 py-4 text-sm font-medium tracking-wide text-slate-300">
                                {item.tenantCount || 0}
                              </td>
                              <td className="px-5 py-4 text-sm font-mono text-slate-400 whitespace-nowrap">
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                              </td>
                            </tr>
                          ))}
                          {/* Modal Pagination Footer */}
                          <tr className="bg-black/20">
                            <td colSpan={4} className="px-5 py-4 border-t border-white/5">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <span className="text-[0.75rem] font-bold uppercase tracking-widest text-slate-500">Show</span>
                                  <select
                                    value={modalServerRowsPerPage}
                                    onChange={(e) => {
                                      setModalServerRowsPerPage(Number(e.target.value));
                                      setModalServerPage(1);
                                    }}
                                    className="bg-transparent text-xs font-bold border-none focus:ring-0 p-0 pr-6 text-cyan-400"
                                  >
                                    {[5, 10, 20, 50].map(size => (
                                      <option key={size} value={size} className="bg-[#111827]">{size} per page</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 mr-4 px-3 py-1 rounded-full border border-white/5 bg-white/5">
                                    <span className="text-[10px] font-bold text-slate-400">Page</span>
                                    <span className="text-xs font-black text-cyan-400">{modalServerPage}</span>
                                    <span className="text-[10px] font-bold text-slate-500">of {totalPages || 1}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => setModalServerPage(p => Math.max(1, p - 1))}
                                      disabled={modalServerPage === 1}
                                      className={`p-2 rounded-xl transition-all ${modalServerPage === 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/10 text-slate-400 hover:text-cyan-400'}`}
                                    >
                                      <ChevronLeft size={16} />
                                    </button>

                                    <div className="flex items-center gap-1">
                                      <button
                                        disabled
                                        className="w-10 h-10 rounded-xl text-sm font-black transition-all bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                      >
                                        {modalServerPage}
                                      </button>
                                    </div>

                                    <button
                                      onClick={() => setModalServerPage(p => Math.min(totalPages, p + 1))}
                                      disabled={modalServerPage >= totalPages || totalPages === 0}
                                      className={`p-2 rounded-xl transition-all ${modalServerPage >= totalPages || totalPages === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/10 text-slate-400 hover:text-cyan-400'}`}
                                    >
                                      <ChevronRight size={16} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>

                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTenantCompanyId !== null && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? 'bg-black/65' : 'bg-black/40'}`}>
          <div className={`w-full max-w-4xl rounded-2xl border p-6 ${isDark
            ? 'bg-[#111318] border-white/10 shadow-[0_0_35px_rgba(34,197,94,0.25)]'
            : 'bg-white border-gray-200 shadow-[0_0_25px_rgba(34,197,94,0.15)]'
            }`}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/10 p-2.5 text-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                  <Users size={22} />
                </div>
                <div>
                  <h4 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Tenants
                  </h4>
                  <p className="text-sm text-slate-400">
                    Managing tenants for this company.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={tenantSearchTerm}
                    onChange={(e) => setTenantSearchTerm(e.target.value)}
                    className="w-48 rounded-2xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/40"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTenantCompanyId(null)}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border ${isDark
                    ? 'border-white/10 text-gray-300 hover:text-white hover:bg-white/5'
                    : 'border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  aria-label="Close tenants modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {loadingTenants ? (
              <div className="text-center py-12 text-gray-500 text-sm">Loading tenants...</div>
            ) : tenantRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">No tenants found for this company.</div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
                <table className="min-w-full divide-y divide-white/10 text-left">
                  <thead className="bg-black/20 text-[0.75rem] uppercase tracking-[0.24em] text-slate-400">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        <div className="relative inline-flex items-center gap-2">
                          <span>Name</span>
                          <button type="button" onClick={() => setIsModalTenantNameSortMenuOpen(!isModalTenantNameSortMenuOpen)} className="rounded-md p-1 hover:bg-white/10"><ArrowUpDown size={13} /></button>
                          {isModalTenantNameSortMenuOpen && (
                            <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                              <button type="button" onClick={() => { setTenantSortBy('name'); setTenantSortOrder('asc'); setIsModalTenantNameSortMenuOpen(false); }} className={`w-full rounded-md px-2 py-1.5 text-left text-[0.75rem] uppercase ${tenantSortBy === 'name' && tenantSortOrder === 'asc' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}>asc</button>
                              <button type="button" onClick={() => { setTenantSortBy('name'); setTenantSortOrder('desc'); setIsModalTenantNameSortMenuOpen(false); }} className={`w-full rounded-md px-2 py-1.5 text-left text-[0.75rem] uppercase ${tenantSortBy === 'name' && tenantSortOrder === 'desc' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}>dsc</button>
                            </div>
                          )}
                        </div>
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        <div className="relative inline-flex items-center gap-2">
                          <span>Description</span>
                          <button type="button" onClick={() => setIsModalTenantDescSortMenuOpen(!isModalTenantDescSortMenuOpen)} className="rounded-md p-1 hover:bg-white/10"><ArrowUpDown size={13} /></button>
                          {isModalTenantDescSortMenuOpen && (
                            <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                              <button type="button" onClick={() => { setTenantSortBy('description'); setTenantSortOrder('asc'); setIsModalTenantDescSortMenuOpen(false); }} className={`w-full rounded-md px-2 py-1.5 text-left text-[0.75rem] uppercase ${tenantSortBy === 'description' && tenantSortOrder === 'asc' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}>asc</button>
                              <button type="button" onClick={() => { setTenantSortBy('description'); setTenantSortOrder('desc'); setIsModalTenantDescSortMenuOpen(false); }} className={`w-full rounded-md px-2 py-1.5 text-left text-[0.75rem] uppercase ${tenantSortBy === 'description' && tenantSortOrder === 'desc' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}>dsc</button>
                            </div>
                          )}
                        </div>
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        <div className="relative inline-flex items-center gap-2">
                          <span>SIP Count</span>
                          <button type="button" onClick={() => setIsModalTenantSipSortMenuOpen(!isModalTenantSipSortMenuOpen)} className="rounded-md p-1 hover:bg-white/10"><ArrowUpDown size={13} /></button>
                          {isModalTenantSipSortMenuOpen && (
                            <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                              <button type="button" onClick={() => { setTenantSortBy('sipConfigsCount'); setTenantSortOrder('asc'); setIsModalTenantSipSortMenuOpen(false); }} className={`w-full rounded-md px-2 py-1.5 text-left text-[0.75rem] uppercase ${tenantSortBy === 'sipConfigsCount' && tenantSortOrder === 'asc' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}>asc</button>
                              <button type="button" onClick={() => { setTenantSortBy('sipConfigsCount'); setTenantSortOrder('desc'); setIsModalTenantSipSortMenuOpen(false); }} className={`w-full rounded-md px-2 py-1.5 text-left text-[0.75rem] uppercase ${tenantSortBy === 'sipConfigsCount' && tenantSortOrder === 'desc' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}>dsc</button>
                            </div>
                          )}
                        </div>
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        <div className="relative inline-flex items-center gap-2">
                          <span>License Count</span>
                          <button type="button" onClick={() => setIsModalTenantLicenseSortMenuOpen(!isModalTenantLicenseSortMenuOpen)} className="rounded-md p-1 hover:bg-white/10"><ArrowUpDown size={13} /></button>
                          {isModalTenantLicenseSortMenuOpen && (
                            <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                              <button type="button" onClick={() => { setTenantSortBy('licenseCount'); setTenantSortOrder('asc'); setIsModalTenantLicenseSortMenuOpen(false); }} className={`w-full rounded-md px-2 py-1.5 text-left text-[0.75rem] uppercase ${tenantSortBy === 'licenseCount' && tenantSortOrder === 'asc' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}>asc</button>
                              <button type="button" onClick={() => { setTenantSortBy('licenseCount'); setTenantSortOrder('desc'); setIsModalTenantLicenseSortMenuOpen(false); }} className={`w-full rounded-md px-2 py-1.5 text-left text-[0.75rem] uppercase ${tenantSortBy === 'licenseCount' && tenantSortOrder === 'desc' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}>dsc</button>
                            </div>
                          )}
                        </div>
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        <div className="relative inline-flex items-center gap-2">
                          <span>Created At</span>
                          <button type="button" onClick={() => setIsModalTenantCreatedAtSortMenuOpen(!isModalTenantCreatedAtSortMenuOpen)} className="rounded-md p-1 hover:bg-white/10"><ArrowUpDown size={13} /></button>
                          {isModalTenantCreatedAtSortMenuOpen && (
                            <div className="absolute left-0 top-full z-30 mt-2 min-w-[92px] rounded-lg border border-white/10 bg-[#111318] p-1 shadow-xl">
                              <button type="button" onClick={() => { setTenantSortBy('createdAt'); setTenantSortOrder('asc'); setIsModalTenantCreatedAtSortMenuOpen(false); }} className={`w-full rounded-md px-2 py-1.5 text-left text-[0.75rem] uppercase ${tenantSortBy === 'createdAt' && tenantSortOrder === 'asc' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}>asc</button>
                              <button type="button" onClick={() => { setTenantSortBy('createdAt'); setTenantSortOrder('desc'); setIsModalTenantCreatedAtSortMenuOpen(false); }} className={`w-full rounded-md px-2 py-1.5 text-left text-[0.75rem] uppercase ${tenantSortBy === 'createdAt' && tenantSortOrder === 'desc' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}>dsc</button>
                            </div>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8">
                    {(() => {
                      const filtered = tenantRecords
                        .filter(item =>
                          item.name?.toLowerCase().includes(tenantSearchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(tenantSearchTerm.toLowerCase())
                        )
                        .sort((a, b) => {
                          const direction = tenantSortOrder === 'asc' ? 1 : -1;
                          if (tenantSortBy === 'sipConfigsCount' || tenantSortBy === 'licenseCount') return ((a[tenantSortBy] || 0) - (b[tenantSortBy] || 0)) * direction;
                          if (tenantSortBy === 'createdAt') {
                            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                            return (dateA - dateB) * direction;
                          }
                          const left = String(a[tenantSortBy] || '').toLowerCase();
                          const right = String(b[tenantSortBy] || '').toLowerCase();
                          return left.localeCompare(right) * direction;
                        });

                      const totalPages = Math.ceil(filtered.length / modalTenantRowsPerPage);
                      const paged = filtered.slice((modalTenantPage - 1) * modalTenantRowsPerPage, modalTenantPage * modalTenantRowsPerPage);

                      return (
                        <>
                          {paged.map((item, idx) => (
                            <tr key={item.id || idx} className="transition hover:bg-white/5">
                              <td className="px-5 py-4 text-sm font-medium text-white">
                                {item.name || 'N/A'}
                              </td>
                              <td className="px-5 py-4 text-sm text-slate-300">
                                {item.description || 'No description'}
                              </td>
                              <td className="px-5 py-4 text-sm font-medium font-mono text-emerald-300">
                                {item.sipConfigsCount || 0}
                              </td>
                              <td className="px-5 py-4 text-sm font-medium tracking-wide text-slate-300">
                                {item.licenseCount || 0}
                              </td>
                              <td className="px-5 py-4 text-sm font-mono text-slate-400 whitespace-nowrap">
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                              </td>
                            </tr>
                          ))}
                          {/* Modal Pagination Footer */}
                          <tr className="bg-black/20">
                            <td colSpan={5} className="px-5 py-4 border-t border-white/5">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <span className="text-[0.75rem] font-bold uppercase tracking-widest text-slate-500">Show</span>
                                  <select
                                    value={modalTenantRowsPerPage}
                                    onChange={(e) => {
                                      setModalTenantRowsPerPage(Number(e.target.value));
                                      setModalTenantPage(1);
                                    }}
                                    className="bg-transparent text-xs font-bold border-none focus:ring-0 p-0 pr-6 text-cyan-400"
                                  >
                                    {[5, 10, 20, 50].map(size => (
                                      <option key={size} value={size} className="bg-[#111827]">{size} per page</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 mr-4 px-3 py-1 rounded-full border border-white/5 bg-white/5">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setModalTenantPage(p => Math.max(1, p - 1))}
                                    disabled={modalTenantPage === 1}
                                    className={`p-2 rounded-xl transition-all ${modalTenantPage === 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/10 text-slate-400 hover:text-cyan-400'}`}
                                  >
                                    <ChevronLeft size={16} />
                                  </button>

                                  <div className="flex items-center gap-1">
                                    <button
                                      disabled
                                      className="w-10 h-10 rounded-xl text-sm font-black transition-all bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                    >
                                      {modalTenantPage}
                                    </button>
                                  </div>

                                  <button
                                    onClick={() => setModalTenantPage(p => Math.min(totalPages, p + 1))}
                                    disabled={modalTenantPage >= totalPages || totalPages === 0}
                                    className={`p-2 rounded-xl transition-all ${modalTenantPage >= totalPages || totalPages === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/10 text-slate-400 hover:text-cyan-400'}`}
                                  >
                                    <ChevronRight size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>

                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {isCompanyModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? 'bg-black/65' : 'bg-black/40'}`}>
          <div className={`w-full max-w-3xl rounded-2xl border p-6 ${isDark
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
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${isDark
                  ? 'border-white/10 text-gray-300 hover:text-white hover:bg-white/5'
                  : 'border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                aria-label="Close company modal"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4">

              {!isEditingCompany && (
                <div className="flex items-center justify-between mb-10 px-6">
                  {addCompanyWizardSteps.map((s) => (
                    <div key={s.step} className="flex items-center flex-1 last:flex-none">
                      <button 
                        type="button"
                        onClick={() => {
                          if (s.step <= companyWizardStep || validateCompanyWizardStep(companyWizardStep)) {
                            setCompanyWizardStep(s.step);
                          } else {
                            toast.error('Please complete the current step first');
                          }
                        }}
                        className="flex flex-col items-center relative group"
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                          companyWizardStep === s.step
                            ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]'
                            : companyWizardStep > s.step
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : isDark ? 'bg-white/5 border-white/10 text-slate-500 group-hover:border-white/20' : 'bg-gray-50 border-gray-200 text-gray-400 group-hover:border-gray-300'
                        }`}>
                          {companyWizardStep > s.step ? <Check size={16} /> : s.step}
                        </div>
                        <span className={`absolute -bottom-7 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          companyWizardStep === s.step ? 'text-blue-500' : 'text-slate-500'
                        }`}>
                          {s.title}
                        </span>
                      </button>
                      {s.step < 4 && (
                        <div className={`flex-1 h-0.5 mx-4 transition-all duration-500 ${
                          companyWizardStep > s.step ? 'bg-emerald-500' : isDark ? 'bg-white/5' : 'bg-gray-100'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isEditingCompany && (
                <p className={`text-[0.75rem] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
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
                      className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none border ${formErrors.name
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
                      className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none resize-none border ${formErrors.description
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
                      className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none border ${formErrors.email
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
                      className={`mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none border ${formErrors.tenantCount
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
                <div className="min-h-[280px]">
                  {/* Section 1: Company Details */}
                  {companyWizardStep === 1 && (
                    <div className="space-y-4 rounded-2xl border border-white/5 bg-white/5 p-8 animate-in fade-in slide-in-from-bottom-4">
                    <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Company Details</h5>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="companyName" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name *</Label>
                        <input
                          id="companyName"
                          type="text"
                          autoFocus
                          value={companyForm.name}
                          onChange={(event) => updateCompanyForm('name', event.target.value)}
                          className={`mt-1 w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all border ${formErrors.name
                            ? isDark ? 'border-red-500/50 bg-red-500/10 text-white' : 'border-red-500 bg-red-50 text-gray-900'
                            : isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                          }`}
                          placeholder="Company name"
                        />
                        {formErrors.name && <p className="mt-1 text-xs text-red-400">{formErrors.name}</p>}
                      </div>
                      <div>
                        <Label htmlFor="companyEmail" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email *</Label>
                        <input
                          id="companyEmail"
                          type="email"
                          value={companyForm.email}
                          onChange={(event) => updateCompanyForm('email', event.target.value)}
                          className={`mt-1 w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all border ${formErrors.email
                            ? isDark ? 'border-red-500/50 bg-red-500/10 text-white' : 'border-red-500 bg-red-50 text-gray-900'
                            : isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                          }`}
                          placeholder="email@example.com"
                        />
                        {formErrors.email && <p className="mt-1 text-xs text-red-400">{formErrors.email}</p>}
                      </div>
                      <div>
                        <Label htmlFor="companyDescription" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Description *</Label>
                        <textarea
                          id="companyDescription"
                          rows={2}
                          value={companyForm.description}
                          onChange={(event) => updateCompanyForm('description', event.target.value)}
                          className={`mt-1 w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all resize-none border ${formErrors.description
                            ? isDark ? 'border-red-500/50 bg-red-500/10 text-white' : 'border-red-500 bg-red-50 text-gray-900'
                            : isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                          }`}
                          placeholder="Brief description"
                        />
                      </div>
                    </div>
                  </div>
                )}

                  {/* Section 2: Server Details */}
                  {companyWizardStep === 2 && (
                    <div className="space-y-4 rounded-2xl border border-white/5 bg-white/5 p-8 animate-in fade-in slide-in-from-bottom-4">
                    <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Server Details</h5>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="serverIpAddress" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Server IP *</Label>
                        <input
                          id="serverIpAddress"
                          type="text"
                          value={companyForm.serverIpAddress}
                          onChange={(event) => updateCompanyForm('serverIpAddress', event.target.value)}
                          className={`mt-1 w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all border ${formErrors.serverIpAddress
                            ? isDark ? 'border-red-500/50 bg-red-500/10 text-white' : 'border-red-500 bg-red-50 text-gray-900'
                            : isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                          }`}
                          placeholder="192.168.0.1"
                        />
                        {formErrors.serverIpAddress && <p className="mt-1 text-xs text-red-400">{formErrors.serverIpAddress}</p>}
                      </div>
                      <div>
                        <Label htmlFor="serverLabel" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Server Label</Label>
                        <input
                          id="serverLabel"
                          type="text"
                          value={companyForm.serverLabel}
                          onChange={(event) => setCompanyForm(prev => ({ ...prev, serverLabel: event.target.value }))}
                          className={`mt-1 w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all border ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10' : 'bg-white border-gray-300 text-gray-900'}`}
                          placeholder="Primary server"
                        />
                      </div>
                    </div>
                  </div>
                )}

                  {/* Section 3: Tenant Details */}
                  {companyWizardStep === 3 && (
                    <div className="space-y-4 rounded-2xl border border-white/5 bg-white/5 p-8 animate-in fade-in slide-in-from-bottom-4">
                    <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">Tenant Details</h5>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="companyTenantCount" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tenant Count *</Label>
                          <input
                            id="companyTenantCount"
                            type="number"
                            value={companyForm.tenantCount}
                            onChange={(event) => updateCompanyForm('tenantCount', event.target.value)}
                            className={`mt-1 w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all border ${formErrors.tenantCount
                              ? isDark ? 'border-red-500/50 bg-red-500/10 text-white' : 'border-red-500 bg-red-50 text-gray-900'
                              : isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                            }`}
                            placeholder="0"
                          />
                          {formErrors.tenantCount && <p className="mt-1 text-xs text-red-400">{formErrors.tenantCount}</p>}
                        </div>
                        <div>
                          <Label htmlFor="tenantName" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tenant Name *</Label>
                          <input
                            id="tenantName"
                            type="text"
                            value={companyForm.tenantName}
                            onChange={(event) => updateCompanyForm('tenantName', event.target.value)}
                          className={`mt-1 w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all border ${formErrors.tenantName
                            ? isDark ? 'border-red-500/50 bg-red-500/10 text-white' : 'border-red-500 bg-red-50 text-gray-900'
                            : isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                          }`}
                            placeholder="Default tenant"
                          />
                          {formErrors.tenantName && <p className="mt-1 text-xs text-red-400">{formErrors.tenantName}</p>}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="tenantDescription" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tenant Description</Label>
                        <textarea
                          id="tenantDescription"
                          rows={1}
                          value={companyForm.tenantDescription}
                          onChange={(event) => setCompanyForm(prev => ({ ...prev, tenantDescription: event.target.value }))}
                          className={`mt-1 w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all resize-none border ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10' : 'bg-white border-gray-300 text-gray-900'}`}
                          placeholder="Tenant notes"
                        />
                      </div>
                    </div>
                  </div>
                )}

                  {/* Section 4: SIP Details */}
                  {companyWizardStep === 4 && (
                    <div className="space-y-4 rounded-2xl border border-white/5 bg-white/5 p-8 animate-in fade-in slide-in-from-bottom-4">
                    <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">SIP Details</h5>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="sipProvider" className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>SIP Provider *</Label>
                        <input
                          id="sipProvider"
                          type="text"
                          value={companyForm.sipProvider}
                          onChange={(event) => updateCompanyForm('sipProvider', event.target.value)}
                          className={`mt-1 w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all border ${formErrors.sipProvider
                            ? isDark ? 'border-red-500/50 bg-red-500/10 text-white' : 'border-red-500 bg-red-50 text-gray-900'
                            : isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'
                          }`}
                          placeholder="Twilio"
                        />
                        {formErrors.sipProvider && <p className="mt-1 text-xs text-red-400">{formErrors.sipProvider}</p>}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-[10px]">SIPs</Label>
                          <input type="number" value={companyForm.sipCount} onChange={(e) => updateCompanyForm('sipCount', e.target.value)} className={`w-full rounded-lg px-3 py-2 text-xs outline-none transition-all border ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'}`} />
                        </div>
                        <div>
                          <Label className="text-[10px]">Channels</Label>
                          <input type="number" value={companyForm.sipChannelCount} onChange={(e) => updateCompanyForm('sipChannelCount', e.target.value)} className={`w-full rounded-lg px-3 py-2 text-xs outline-none transition-all border ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'}`} />
                        </div>
                        <div>
                          <Label className="text-[10px]">Licenses</Label>
                          <input type="number" value={companyForm.licenseCount} onChange={(e) => updateCompanyForm('licenseCount', e.target.value)} className={`w-full rounded-lg px-3 py-2 text-xs outline-none transition-all border ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-400'}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                {editingCompanyId !== null && (
                  <button
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border ${isDark
                      ? 'border-rose-400/40 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25'
                      : 'border-rose-300 bg-rose-100 text-rose-700 hover:bg-rose-200'
                      }`}
                  >
                    Delete
                  </button>
                )}
                {isEditingCompany ? (
                  <button
                    type="button"
                    onClick={() => handleCompanySubmit()}
                    disabled={isSavingCompany}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border ${isDark
                      ? 'border-blue-400/40 bg-blue-500/15 text-blue-200 hover:bg-blue-500/25'
                      : 'border-blue-300 bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                  >
                    {isSavingCompany ? 'Saving...' : 'Save Changes'}
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    {companyWizardStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className={`px-6 py-2 rounded-xl text-sm font-bold border transition-all ${isDark 
                          ? 'border-white/10 text-gray-400 hover:bg-white/5' 
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        Back
                      </button>
                    )}
                    {companyWizardStep < 4 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="px-8 py-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all ml-auto"
                      >
                        Next Step
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCompanySubmit()}
                        disabled={isSavingCompany}
                        className="rounded-xl bg-blue-600 px-8 py-2 text-sm font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all disabled:opacity-50 ml-auto"
                      >
                        {isSavingCompany ? 'Saving...' : 'Create Company'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && editingCompanyId !== null && (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${isDark ? 'bg-black/70' : 'bg-black/45'}`}>
          <div className={`w-full max-w-sm rounded-xl border p-4 ${isDark
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
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${isDark
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
                className={`px-3 py-1.5 rounded-lg text-xs border ${isDark
                  ? 'border-white/10 text-gray-300 hover:text-white hover:bg-white/5'
                  : 'border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCompany}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${isDark
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
    </main>
  );
}
