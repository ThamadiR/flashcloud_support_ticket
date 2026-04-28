import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { Label, Alert, Spinner } from 'flowbite-react';
import { UserCircle, LogOut, Check, Trash2, ChevronLeft, ChevronRight, X, Edit2, Search, Sun, Moon, ArrowUpDown, Download, Users, Building2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../config/api';
import { COUNTRY_CODE_OPTIONS, COUNTRY_DIAL_CODES_DESC } from '../config/countryCodes';
import { useTheme } from '../context/ThemeContext';
import CompanyListUI from './CompanyListUI';

export default function Dashboard({ token, user, onLogout, onUserUpdate }: { token: string, user: any, onLogout: () => void, onUserUpdate: (u: any) => void }) {
  const { isDark, toggleTheme } = useTheme();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const idSortMenuRef = useRef<HTMLDivElement>(null);
  const nameSortMenuRef = useRef<HTMLDivElement>(null);
  const emailSortMenuRef = useRef<HTMLDivElement>(null);
  const contactSortMenuRef = useRef<HTMLDivElement>(null);
  const roleSortMenuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({ username: user?.username || '', email: user?.email || '', countryCode: '+94', contactNo: '', password: '', confirmPassword: '', avatarUrl: user?.avatarUrl || user?.img || '' });
  const [loading, setLoading] = useState(false);
  const [error] = useState('');
  const [success] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editorRole, setEditorRole] = useState<'ADMIN' | 'NON_ADMIN'>('NON_ADMIN');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  
  const [users, setUsers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('username');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isIdSortMenuOpen, setIsIdSortMenuOpen] = useState(false);
  const [isNameSortMenuOpen, setIsNameSortMenuOpen] = useState(false);
  const [isEmailSortMenuOpen, setIsEmailSortMenuOpen] = useState(false);
  const [isContactSortMenuOpen, setIsContactSortMenuOpen] = useState(false);
  const [isRoleSortMenuOpen, setIsRoleSortMenuOpen] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | 'ADMIN' | 'NON_ADMIN'>('ALL');
  const [countrySortSearchTerm, setCountrySortSearchTerm] = useState('');
  const [exportingUsers, setExportingUsers] = useState(false);
  const [roleUpdatingId, setRoleUpdatingId] = useState<number | null>(null);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(288); // 72 * 4 = 288px
  const [isResizing, setIsResizing] = useState(false);
  const [activeListView, setActiveListView] = useState<'companies' | 'users' | null>('companies');
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const neonButtonBase = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all duration-200';
  const neonEditButton = `${neonButtonBase} text-blue-300 bg-blue-500/12 border-blue-400/40 shadow-[0_0_14px_rgba(59,130,246,0.24)] hover:bg-blue-500/22 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]`;
  const neonDeleteButton = `${neonButtonBase} text-rose-300 bg-rose-500/12 border-rose-400/40 shadow-[0_0_14px_rgba(244,63,94,0.24)] hover:bg-rose-500/22 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]`;
  const countryCodeSortOptions = Array.from(
    new Map(COUNTRY_CODE_OPTIONS.map(option => [option.dialCode, option])).values()
  );
  const filteredCountryCodeSortOptions = countryCodeSortOptions.filter(option => {
    const keyword = countrySortSearchTerm.trim().toLowerCase();
    if (!keyword) {
      return true;
    }

    return option.label.toLowerCase().includes(keyword) || option.dialCode.includes(keyword);
  });

  const normalizeImageUrl = (value: unknown) => {
    if (value === null || value === undefined) {
      return '';
    }

    const normalized = String(value).trim();
    if (!normalized || normalized.toLowerCase() === 'null') {
      return '';
    }

    return normalized;
  };

  const normalizeRole = (value: unknown): 'ADMIN' | 'NON_ADMIN' => {
    return String(value || '').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'NON_ADMIN';
  };

  const headerAvatarUrl = normalizeImageUrl(user?.avatarUrl) || normalizeImageUrl(user?.img);
  const userDisplayName = String(user?.username || '').trim() || 'User';
  const currentUserRole = normalizeRole(user?.role);
  const isCurrentUserAdmin = currentUserRole === 'ADMIN';
  const isCompanyListView = activeListView === 'companies';
  const canManageUser = (targetUser: any) => isCurrentUserAdmin || Number(targetUser?.id) === Number(user?.id);

  const greetingPrefix = currentHour < 12
    ? 'Good Morning'
    : currentHour < 18
      ? 'Good Afternoon'
      : 'Good Evening';
  const headerGreeting = `${greetingPrefix}, ${userDisplayName}`;
  const currentUserRecord = users.find((u) => Number(u?.id) === Number(user?.id)) || {
    id: user?.id,
    username: user?.username,
    email: user?.email,
    contactNo: user?.contactNo || '',
    role: user?.role,
    avatarUrl: user?.avatarUrl,
    img: user?.img,
  };
  const listTitle = isCompanyListView ? 'Company List' : 'Existing Users';
  const searchPlaceholder = isCompanyListView ? 'Search company name, email, contact' : 'Search username, email, contact';
  const nameColumnLabel = isCompanyListView ? 'Company Name' : 'Name';
  const loadingRowLabel = isCompanyListView ? 'Loading companies...' : 'Loading users...';
  const noDataLabel = isCompanyListView ? 'No companies found in database.' : 'No users found in database.';
  const exportEmptyLabel = isCompanyListView ? 'No companies found to export' : 'No users found to export';
  const exportSuccessLabel = isCompanyListView ? 'Companies exported to Excel successfully' : 'Users exported to Excel successfully';
  const exportFailureLabel = isCompanyListView ? 'Failed to export companies' : 'Failed to export users';
  const exportSheetLabel = isCompanyListView ? 'Companies' : 'Users';
  const exportFilePrefix = isCompanyListView ? 'companies-export' : 'users-export';
  const exportButtonTitle = isCompanyListView ? 'Export current sorted companies to Excel' : 'Export current sorted users to Excel';

  const fetchUsers = async (page: number) => {
    try {
      setLoadingUsers(true);
      const query = new URLSearchParams({
        page: String(page),
        limit: String(usersPerPage),
      });

      if (searchTerm.trim()) {
        query.set('search', searchTerm.trim());
      }
      query.set('sortBy', sortBy);
      query.set('sortOrder', sortOrder);
      if (sortBy === 'country' && selectedCountryCode) {
        query.set('countryCode', selectedCountryCode);
      }
      if (selectedRoleFilter !== 'ALL') {
        query.set('role', selectedRoleFilter);
      }

      const res = await fetch(`${API_BASE_URL}/api/users?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Session expired. Please log in again.');
          onLogout();
          return;
        }

        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to load users');
        setUsers([]);
        setTotalPages(1);
        return;
      }

      const data = await res.json();
      setUsers(data.users || []);
      setCurrentPage(data.pagination?.currentPage || page);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalUsersCount(data.pagination?.totalUsers ?? (data.users || []).length);
    } catch(err) {
      console.error('Fetch users error:', err);
      toast.error('Unable to reach server. Please check backend connection.');
      setUsers([]);
      setTotalPages(1);
      setTotalUsersCount(0);
    } finally {
      setLoadingUsers(false);
    }
  };

  const closeAllSortMenus = () => {
    setIsIdSortMenuOpen(false);
    setIsNameSortMenuOpen(false);
    setIsEmailSortMenuOpen(false);
    setIsContactSortMenuOpen(false);
    setIsRoleSortMenuOpen(false);
  };

  const switchListView = (nextView: 'companies' | 'users') => {
    closeAllSortMenus();
    setCurrentPage(1);
    setActiveListView(nextView);
  };

  // Fetch users page-wise from backend
  useEffect(() => {
    fetchUsers(currentPage);
  }, [token, currentPage, usersPerPage, searchTerm, sortBy, sortOrder, selectedCountryCode, selectedRoleFilter]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX - 16; // 16px is the left position of sidebar
      if (newWidth >= 200 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (idSortMenuRef.current && !idSortMenuRef.current.contains(event.target as Node)) {
        setIsIdSortMenuOpen(false);
      }
      if (nameSortMenuRef.current && !nameSortMenuRef.current.contains(event.target as Node)) {
        setIsNameSortMenuOpen(false);
      }
      if (emailSortMenuRef.current && !emailSortMenuRef.current.contains(event.target as Node)) {
        setIsEmailSortMenuOpen(false);
      }
      if (contactSortMenuRef.current && !contactSortMenuRef.current.contains(event.target as Node)) {
        setIsContactSortMenuOpen(false);
        setCountrySortSearchTerm('');
      }
      if (roleSortMenuRef.current && !roleSortMenuRef.current.contains(event.target as Node)) {
        setIsRoleSortMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const applyColumnSort = (field: 'id' | 'username' | 'email' | 'role', nextSortOrder: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(nextSortOrder);
    setSelectedCountryCode('');
    setCurrentPage(1);
    setIsIdSortMenuOpen(false);
    setIsNameSortMenuOpen(false);
    setIsEmailSortMenuOpen(false);
    setIsContactSortMenuOpen(false);
    setIsRoleSortMenuOpen(false);
  };

  const applyCountrySort = (countryCode: string) => {
    setSortBy('country');
    setSortOrder('asc');
    setSelectedCountryCode(countryCode);
    setCountrySortSearchTerm('');
    setCurrentPage(1);
    setIsIdSortMenuOpen(false);
    setIsNameSortMenuOpen(false);
    setIsEmailSortMenuOpen(false);
    setIsContactSortMenuOpen(false);
    setIsRoleSortMenuOpen(false);
  };

  const applyRoleFilter = (role: 'ALL' | 'ADMIN' | 'NON_ADMIN') => {
    setSelectedRoleFilter(role);
    setCurrentPage(1);
    setIsRoleSortMenuOpen(false);
  };

  const handleExportUsers = async () => {
    try {
      setExportingUsers(true);
      const query = new URLSearchParams();

      if (searchTerm.trim()) {
        query.set('search', searchTerm.trim());
      }

      query.set('sortBy', sortBy);
      query.set('sortOrder', sortOrder);
      if (sortBy === 'country' && selectedCountryCode) {
        query.set('countryCode', selectedCountryCode);
      }
      if (selectedRoleFilter !== 'ALL') {
        query.set('role', selectedRoleFilter);
      }

      const res = await fetch(`${API_BASE_URL}/api/users/export?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Session expired. Please log in again.');
          onLogout();
          return;
        }

        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || exportFailureLabel);
        return;
      }

      const data = await res.json();
      const exportRows = (data.users || []).map((u: any) => ({
        [isCompanyListView ? 'Company ID' : 'User ID']: u.id,
        [isCompanyListView ? 'Company Name' : 'Username']: u.username || '',
        Email: u.email || '',
        'Contact Number': u.contactNo || '',
      }));

      if (exportRows.length === 0) {
        toast.error(exportEmptyLabel);
        return;
      }

      const sheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, exportSheetLabel);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      XLSX.writeFile(workbook, `${exportFilePrefix}-${timestamp}.xlsx`);
      toast.success(exportSuccessLabel);
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while exporting users');
    } finally {
      setExportingUsers(false);
    }
  };

  const openUserEditor = (selectedUser: any) => {
    if (!selectedUser?.id) {
      toast.error('Unable to open editor for this user');
      return;
    }

    if (!canManageUser(selectedUser)) {
      toast.error('You can only edit your own profile');
      return;
    }

    const rawContact = String(selectedUser.contactNo || '').replace(/\s+/g, '');
    const matchedCode = COUNTRY_DIAL_CODES_DESC.find(code => rawContact.startsWith(code));
    const detectedCode = matchedCode || '+94';
    const localNumber = matchedCode
      ? rawContact.slice(matchedCode.length)
      : rawContact.replace(/^\+/, '');

    setSelectedUserId(selectedUser.id);
    setEditorRole(normalizeRole(selectedUser.role));
    setFormData({
      username: selectedUser.username || '',
      email: selectedUser.email || '',
      countryCode: detectedCode,
      contactNo: localNumber,
      password: '',
      confirmPassword: '',
      avatarUrl: normalizeImageUrl(selectedUser.avatarUrl) || normalizeImageUrl(selectedUser.img),
    });
    setIsSettingsOpen(true);
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5MB or smaller');
      event.target.value = '';
      return;
    }

    try {
      const uploadData = new FormData();
      uploadData.append('image', file);

      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Could not upload image');
        return;
      }

      if (!data.url) {
        toast.error('Upload completed but no image URL was returned');
        return;
      }

      setFormData(prev => ({ ...prev, avatarUrl: data.url }));
      toast.success('Image uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Could not upload avatar image');
    } finally {
      event.target.value = '';
    }
  };

  const requestDeleteUser = (targetUser: any) => {
    if (!canManageUser(targetUser)) {
      toast.error('You can only delete your own profile');
      return;
    }

    setDeleteTarget(targetUser);
  };

  const handleToggleUserRole = async (targetUser: any) => {
    if (!isCurrentUserAdmin) {
      toast.error('Only admins can change roles');
      return;
    }

    const targetUserId = Number(targetUser?.id);
    if (!Number.isFinite(targetUserId)) {
      toast.error('Invalid user selected for role update');
      return;
    }

    const currentRole = normalizeRole(targetUser?.role);
    const nextRole: 'ADMIN' | 'NON_ADMIN' = currentRole === 'ADMIN' ? 'NON_ADMIN' : 'ADMIN';

    setRoleUpdatingId(targetUserId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${targetUserId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: nextRole }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Failed to update user role');
        return;
      }

      const updatedRole = normalizeRole(data?.user?.role ?? nextRole);
      setUsers(prev => prev.map(u => (
        Number(u.id) === targetUserId
          ? { ...u, role: updatedRole }
          : u
      )));

      if (selectedUserId === targetUserId) {
        setEditorRole(updatedRole);
      }

      if (Number(user?.id) === targetUserId) {
        onUserUpdate({ ...user, role: updatedRole });
      }

      toast.success(`User role updated to ${updatedRole === 'ADMIN' ? 'ADMIN' : 'NON-ADMIN'}`);
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while updating role');
    } finally {
      setRoleUpdatingId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;

    const id = deleteTarget.id;
    setDeletingUser(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('User deleted successfully');
        setDeleteTarget(null);
        if (id === user.id) {
          onLogout();
        } else {
          const nextPage = users.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
          setCurrentPage(nextPage);
          fetchUsers(nextPage);
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setDeletingUser(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedUserId) {
      toast.error('No user selected for editing');
      return;
    }

    setLoading(true);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Only @gmail.com addresses are allowed');
      setLoading(false);
      return;
    }
    const trimmedContactNo = String(formData.contactNo).trim();
    if (trimmedContactNo && !/^[0-9]{9}$/.test(trimmedContactNo)) {
      toast.error('Contact number must be exactly 9 digits');
      setLoading(false);
      return;
    }
    if (formData.password.trim().length > 0 && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    if (formData.password.trim().length > 0 && formData.password !== formData.confirmPassword) {
      toast.error('Retyped password must match the new password');
      setLoading(false);
      return;
    }

    const payload: any = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      avatarUrl: formData.avatarUrl || null,
      img: formData.avatarUrl || null,
    };
    if (trimmedContactNo) {
      payload.contactNo = `${formData.countryCode}${trimmedContactNo}`;
    }
    if (formData.password.trim().length > 0) {
      payload.password = formData.password;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${selectedUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || 'Update failed');
        return;
      }
      
      const updatedUsername = data.user.username || formData.username;

      toast.success('Profile updated successfully!');
      setUsers(users.map(u => u.id === selectedUserId ? { ...u, username: updatedUsername, email: data.user.email, contactNo: data.user.contactNo, avatarUrl: data.user.avatarUrl || data.user.img, img: data.user.img || data.user.avatarUrl } : u));
      if (selectedUserId === user.id) {
        onUserUpdate({ ...user, username: updatedUsername, email: data.user.email, contactNo: data.user.contactNo, avatarUrl: data.user.avatarUrl || data.user.img, img: data.user.img || data.user.avatarUrl });
      }
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      setIsSettingsOpen(false);
      setSelectedUserId(null);
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');                                     
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`theme-page flex flex-col min-h-screen items-stretch p-6 sm:p-12 font-sans overflow-y-auto no-scrollbar relative border-l ${isDark ? 'bg-[#09090B] border-white/10' : 'bg-white border-gray-200'}`}
      style={{
        boxShadow: isDark ? 'inset 20px 0 30px rgba(0,0,0,0.3)' : 'inset 20px 0 30px rgba(0,0,0,0.05)'
      }}
    >

      {/* Deep Space Background Array with Starry Dots */}
      <div className="fixed inset-0 z-0">
        {isDark ? (
          <>
            <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-[#3B82F6]/5 rounded-full filter blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[0%] right-[0%] w-[500px] h-[500px] bg-[#1D4ED8]/10 rounded-full filter blur-[150px] pointer-events-none"></div>
            <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
          </>
        ) : (
          <>
            <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-400/5 rounded-full filter blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[0%] right-[0%] w-[500px] h-[500px] bg-blue-300/5 rounded-full filter blur-[150px] pointer-events-none"></div>
          </>
        )}
      </div>
      <main className="w-full max-w-none z-10 transition-all duration-300">
        {/* Navigation / Header */}
        <div className={`mb-8 ${isDark ? 'bg-[#121214] border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.6)]' : 'bg-white border-gray-200 shadow-sm'} border rounded-[20px] px-8 py-5`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-4">
              {headerAvatarUrl ? (
                <img
                  src={headerAvatarUrl}
                  alt="Profile"
                  className="h-11 w-11 rounded-full object-cover border"
                  style={{ borderColor: isDark ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.6)' }}
                />
              ) : (
                <div
                  className={`h-11 w-11 rounded-full flex items-center justify-center font-semibold text-sm border ${
                    isDark ? 'bg-blue-500/15 border-blue-400/35 text-blue-200' : 'bg-blue-50 border-blue-300 text-blue-700'
                  }`}
                >
                  {(userDisplayName || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className={`text-[1.2rem] font-semibold flex items-center gap-2 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {headerGreeting}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onLogout}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold border transition-all ${
                      isDark
                        ? 'text-cyan-200 bg-cyan-500/10 border-cyan-400/35 hover:bg-cyan-500/20'
                        : 'text-cyan-700 bg-cyan-50 border-cyan-300 hover:bg-cyan-100'
                    }`}
                  >
                    <LogOut size={12} /> Log out
                  </button>
                  <button
                    type="button"
                    onClick={() => openUserEditor(currentUserRecord)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold border transition-all ${
                      isDark
                        ? 'text-blue-300 bg-blue-500/10 border-blue-400/35 hover:bg-blue-500/18'
                        : 'text-blue-700 bg-blue-100 border-blue-300 hover:bg-blue-200'
                    }`}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => requestDeleteUser(currentUserRecord)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold border transition-all ${
                      isDark
                        ? 'text-rose-300 bg-rose-500/10 border-rose-400/35 hover:bg-rose-500/18'
                        : 'text-rose-700 bg-rose-100 border-rose-300 hover:bg-rose-200'
                    }`}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => switchListView(isCompanyListView ? 'users' : 'companies')}
                className={`flex h-8 w-8 items-center justify-center rounded-md border transition-all ${
                  isDark
                    ? 'text-emerald-200 bg-emerald-500/10 border-emerald-400/35 hover:bg-emerald-500/20'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100'
                }`}
                title={isCompanyListView ? 'User list' : 'Company list'}
                aria-label={isCompanyListView ? 'User list' : 'Company list'}
              >
                {isCompanyListView ? <Users size={16} /> : <Building2 size={16} />}
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className={`flex h-8 w-8 items-center justify-center rounded-md border transition-all ${
                  isDark
                    ? 'text-yellow-300 bg-yellow-500/10 border-yellow-400/35 hover:bg-yellow-500/20'
                    : 'text-slate-700 bg-slate-100 border-slate-300 hover:bg-slate-200'
                }`}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
            </div>
        </div>



      <div className="mt-5 w-full">
        {isCompanyListView ? (
          <CompanyListUI isDark={isDark} isSidebarMinimized={isSidebarMinimized} token={token} onUnauthorized={onLogout} />
        ) : (
        <>
        {/* Existing Users List - No Container explicitly requested */}
        <div className="mt-4 w-full">
          <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5 pl-2 border-b pb-3 ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
            <h3 className={`text-[1.1rem] font-medium tracking-wide ${isDark ? 'text-white/90' : 'text-gray-900'}`}>
              {listTitle}
            </h3>
            {isCurrentUserAdmin ? (
              <div className="flex items-center gap-2 w-full lg:w-auto">
                <div className="relative w-full lg:w-[320px] max-w-full">
                  <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={searchPlaceholder}
                    className={`w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-[#09090B] border border-white/10 text-gray-200 placeholder:text-gray-600 focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.12)]'
                        : 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-400 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                    }`}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportUsers}
                  disabled={exportingUsers}
                  className={`h-[42px] px-3 rounded-xl border flex items-center gap-2 text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    isDark
                      ? 'bg-[#09090B] border-white/10 text-gray-300 hover:text-white hover:border-white/20'
                      : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400'
                  }`}
                  title={exportButtonTitle}
                >
                  <Download size={15} />
                  {exportingUsers ? 'Exporting...' : 'Export'}
                </button>
              </div>
            ) : (
              <span className={`text-[12px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                You can manage only your own profile.
              </span>
            )}
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
                      <span>ID</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsIdSortMenuOpen(prev => !prev);
                          setIsNameSortMenuOpen(false);
                          setIsEmailSortMenuOpen(false);
                          setIsContactSortMenuOpen(false);
                          setIsRoleSortMenuOpen(false);
                        }}
                        className={`rounded-md p-1 transition-colors ${
                          isDark ? 'hover:bg-white/10 text-blue-200/70' : 'hover:bg-blue-100 text-blue-600'
                        }`}
                        aria-label="Sort user id"
                        title="Sort user id"
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
                      <span>{nameColumnLabel}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNameSortMenuOpen(prev => !prev);
                          setIsIdSortMenuOpen(false);
                          setIsEmailSortMenuOpen(false);
                          setIsContactSortMenuOpen(false);
                          setIsRoleSortMenuOpen(false);
                        }}
                        className={`rounded-md p-1 transition-colors ${
                          isDark ? 'hover:bg-white/10 text-blue-200/70' : 'hover:bg-blue-100 text-blue-600'
                        }`}
                        aria-label={isCompanyListView ? 'Sort company name' : 'Sort name'}
                        title={isCompanyListView ? 'Sort company name' : 'Sort name'}
                      >
                        <ArrowUpDown size={13} />
                      </button>

                      {isNameSortMenuOpen && (
                        <div className={`absolute top-full left-0 mt-2 min-w-[92px] rounded-lg border p-1 z-30 shadow-xl ${
                          isDark ? 'bg-[#111318] border-white/10' : 'bg-white border-gray-200'
                        }`}>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('username', 'asc')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] uppercase transition-colors ${
                              sortBy === 'username' && sortOrder === 'asc'
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
                            onClick={() => applyColumnSort('username', 'desc')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] uppercase transition-colors ${
                              sortBy === 'username' && sortOrder === 'desc'
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
                    <div className="relative inline-flex items-center gap-2" ref={emailSortMenuRef}>
                      <span>Email</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEmailSortMenuOpen(prev => !prev);
                          setIsIdSortMenuOpen(false);
                          setIsNameSortMenuOpen(false);
                          setIsContactSortMenuOpen(false);
                          setIsRoleSortMenuOpen(false);
                        }}
                        className={`rounded-md p-1 transition-colors ${
                          isDark ? 'hover:bg-white/10 text-blue-200/70' : 'hover:bg-blue-100 text-blue-600'
                        }`}
                        aria-label="Sort email"
                        title="Sort email"
                      >
                        <ArrowUpDown size={13} />
                      </button>

                      {isEmailSortMenuOpen && (
                        <div className={`absolute top-full left-0 mt-2 min-w-[92px] rounded-lg border p-1 z-30 shadow-xl ${
                          isDark ? 'bg-[#111318] border-white/10' : 'bg-white border-gray-200'
                        }`}>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('email', 'asc')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] uppercase transition-colors ${
                              sortBy === 'email' && sortOrder === 'asc'
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
                            onClick={() => applyColumnSort('email', 'desc')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] uppercase transition-colors ${
                              sortBy === 'email' && sortOrder === 'desc'
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
                    <div className="relative inline-flex items-center gap-2" ref={contactSortMenuRef}>
                      <span>Contact Number</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsContactSortMenuOpen(prev => {
                            const nextState = !prev;
                            if (!nextState) {
                              setCountrySortSearchTerm('');
                            }
                            return nextState;
                          });
                          setIsNameSortMenuOpen(false);
                          setIsEmailSortMenuOpen(false);
                          setIsRoleSortMenuOpen(false);
                        }}
                        className={`rounded-md p-1 transition-colors ${
                          isDark ? 'hover:bg-white/10 text-blue-200/70' : 'hover:bg-blue-100 text-blue-600'
                        }`}
                        aria-label="Sort contact number by country code"
                        title="Sort contact number by country code"
                      >
                        <ArrowUpDown size={13} />
                      </button>

                      {isContactSortMenuOpen && (
                        <div className={`absolute top-full left-0 mt-2 min-w-[260px] max-h-[280px] overflow-y-auto no-scrollbar rounded-lg border p-1 z-30 shadow-xl ${
                          isDark ? 'bg-[#111318] border-white/10' : 'bg-white border-gray-200'
                        }`}>
                          <div className="px-1 pb-1">
                            <input
                              type="text"
                              value={countrySortSearchTerm}
                              onChange={e => setCountrySortSearchTerm(e.target.value)}
                              placeholder="Search country code"
                              className={`w-full rounded-md px-2 py-1.5 text-[11px] outline-none transition-colors ${
                                isDark
                                  ? 'bg-[#0B0D12] border border-white/10 text-gray-200 placeholder:text-gray-500 focus:border-blue-400/50'
                                  : 'bg-white border border-gray-300 text-gray-800 placeholder:text-gray-500 focus:border-blue-400'
                              }`}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => applyCountrySort('')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-colors ${
                              sortBy === 'country' && !selectedCountryCode
                                ? isDark
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-blue-100 text-blue-700'
                                : isDark
                                  ? 'text-gray-300 hover:bg-white/5'
                                  : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            All Country Codes
                          </button>

                          {filteredCountryCodeSortOptions.map(option => (
                            <button
                              key={`contact-country-${option.dialCode}`}
                              type="button"
                              onClick={() => applyCountrySort(option.dialCode)}
                              className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-colors ${
                                sortBy === 'country' && selectedCountryCode === option.dialCode
                                  ? isDark
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'bg-blue-100 text-blue-700'
                                  : isDark
                                    ? 'text-gray-300 hover:bg-white/5'
                                    : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}

                          {filteredCountryCodeSortOptions.length === 0 && (
                            <div className={`px-2 py-2 text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              No country code found.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                  <th className={`px-6 py-3 text-[11px] font-semibold tracking-[0.12em] uppercase ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>
                    <div className="relative inline-flex items-center gap-2" ref={roleSortMenuRef}>
                      <span>Role</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsRoleSortMenuOpen(prev => !prev);
                          setIsIdSortMenuOpen(false);
                          setIsNameSortMenuOpen(false);
                          setIsEmailSortMenuOpen(false);
                          setIsContactSortMenuOpen(false);
                        }}
                        className={`rounded-md p-1 transition-colors ${
                          isDark ? 'hover:bg-white/10 text-blue-200/70' : 'hover:bg-blue-100 text-blue-600'
                        }`}
                        aria-label="Sort role"
                        title="Sort role"
                      >
                        <ArrowUpDown size={13} />
                      </button>

                      {isRoleSortMenuOpen && (
                        <div className={`absolute top-full left-0 mt-2 min-w-[120px] max-h-[220px] overflow-y-auto no-scrollbar rounded-lg border p-1 z-30 shadow-xl ${
                          isDark ? 'bg-[#111318] border-white/10' : 'bg-white border-gray-200'
                        }`}>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('role', 'asc')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] uppercase transition-colors ${
                              sortBy === 'role' && sortOrder === 'asc'
                                ? isDark
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-blue-100 text-blue-700'
                                : isDark
                                  ? 'text-gray-300 hover:bg-white/5'
                                  : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            admin first
                          </button>
                          <button
                            type="button"
                            onClick={() => applyColumnSort('role', 'desc')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] uppercase transition-colors ${
                              sortBy === 'role' && sortOrder === 'desc'
                                ? isDark
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-blue-100 text-blue-700'
                                : isDark
                                  ? 'text-gray-300 hover:bg-white/5'
                                  : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            non-admin first
                          </button>

                          <div className={`my-1 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}></div>

                          <button
                            type="button"
                            onClick={() => applyRoleFilter('ALL')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] uppercase transition-colors ${
                              selectedRoleFilter === 'ALL'
                                ? isDark
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-blue-100 text-blue-700'
                                : isDark
                                  ? 'text-gray-300 hover:bg-white/5'
                                  : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            all roles
                          </button>

                          <button
                            type="button"
                            onClick={() => applyRoleFilter('ADMIN')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] uppercase transition-colors ${
                              selectedRoleFilter === 'ADMIN'
                                ? isDark
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-blue-100 text-blue-700'
                                : isDark
                                  ? 'text-gray-300 hover:bg-white/5'
                                  : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            only admins
                          </button>

                          <button
                            type="button"
                            onClick={() => applyRoleFilter('NON_ADMIN')}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] uppercase transition-colors ${
                              selectedRoleFilter === 'NON_ADMIN'
                                ? isDark
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-blue-100 text-blue-700'
                                : isDark
                                  ? 'text-gray-300 hover:bg-white/5'
                                  : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            only non-admins
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className={`px-6 py-3 text-[11px] font-semibold tracking-[0.12em] uppercase text-right ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>Update</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500 text-sm">{loadingRowLabel}</td>
                  </tr>
                )}

                {!loadingUsers && users.map((u, index) => (
                  <tr
                    key={u.id}
                    className="group transition-transform duration-200 hover:-translate-y-[1px]"
                  >
                    <td className={`rounded-l-xl transition-colors ${
                      isDark
                        ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]`
                        : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-blue-50`
                    }`} style={{ padding: isSidebarMinimized ? '16px 24px' : '16px 16px' }}>
                      <span className={`font-semibold tracking-wide ${isDark ? 'text-blue-200/90' : 'text-blue-700'}`} style={{ fontSize: isSidebarMinimized ? '13px' : '12px' }}>
                        #{u.id}
                      </span>
                    </td>
                    <td className={`transition-colors ${
                      isDark
                        ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]`
                        : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-blue-50`
                    }`} style={{ padding: isSidebarMinimized ? '16px 24px' : '16px 16px' }}>
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 overflow-hidden rounded-full border flex items-center justify-center text-[10px] font-semibold uppercase ${
                          isDark
                            ? 'bg-gradient-to-br from-blue-400/25 to-blue-600/10 border-blue-300/20 text-blue-300/80'
                            : 'bg-blue-100 border-blue-300 text-blue-700'
                        }`}>
                          {normalizeImageUrl(u.avatarUrl) || normalizeImageUrl(u.img) ? (
                            <img
                              src={normalizeImageUrl(u.avatarUrl) || normalizeImageUrl(u.img) || ''}
                              alt={`${u.username || 'User'} avatar`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{(u.username || '?').charAt(0)}</span>
                          )}
                        </div>
                        <span className={`font-semibold tracking-[0.01em] ${isDark ? 'text-gray-100' : 'text-gray-900'}`} style={{ fontSize: isSidebarMinimized ? '13px' : '13px' }}>
                          {u.username}
                        </span>
                        {!isCompanyListView && u.id === user?.id && <span className={`text-[11px] ml-1 font-medium px-2 py-0.5 rounded-full ${
                          isDark ? 'text-blue-300 bg-blue-500/15' : 'text-blue-700 bg-blue-100'
                        }`}>You</span>}
                      </div>
                    </td>
                    <td className={`transition-colors ${
                      isDark
                        ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]`
                        : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-blue-50`
                    }`} style={{ padding: isSidebarMinimized ? '16px 24px' : '16px 16px' }}>
                      <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: isSidebarMinimized ? '12px' : '12px' }}>{u.email || '-'}</span>
                    </td>
                    <td className={`transition-colors ${
                      isDark
                        ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]`
                        : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-blue-50`
                    }`} style={{ padding: isSidebarMinimized ? '16px 24px' : '16px 16px' }}>
                      <span className={`font-medium tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontSize: isSidebarMinimized ? '12px' : '12px' }}>{u.contactNo || '-'}</span>
                    </td>
                    <td className={`transition-colors ${
                      isDark
                        ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]`
                        : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-blue-50`
                    }`} style={{ padding: isSidebarMinimized ? '16px 24px' : '16px 16px' }}>
                      {isCurrentUserAdmin ? (
                        <button
                          type="button"
                          onClick={() => handleToggleUserRole(u)}
                          disabled={roleUpdatingId === Number(u.id)}
                          className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                            String(u.role || 'NON_ADMIN').toUpperCase() === 'ADMIN'
                              ? isDark
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35 hover:bg-emerald-500/30'
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200/80'
                              : isDark
                                ? 'bg-slate-500/20 text-slate-200 border border-slate-300/25 hover:bg-slate-500/30'
                                : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200/80'
                          }`}
                          title="Toggle role (ON = ADMIN, OFF = NON-ADMIN)"
                        >
                          {roleUpdatingId === Number(u.id)
                            ? 'UPDATING...'
                            : (String(u.role || 'NON_ADMIN').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'NON-ADMIN')}
                        </button>
                      ) : (
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide ${
                          String(u.role || 'NON_ADMIN').toUpperCase() === 'ADMIN'
                            ? isDark
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : isDark
                              ? 'bg-slate-500/20 text-slate-200 border border-slate-300/25'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {String(u.role || 'NON_ADMIN').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'NON-ADMIN'}
                        </span>
                      )}
                    </td>
                    <td className={`rounded-r-xl transition-colors ${
                      isDark
                        ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]`
                        : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-blue-50`
                    }`} style={{ padding: isSidebarMinimized ? '16px 24px' : '16px 16px' }}>
                      {canManageUser(u) ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openUserEditor(u)}
                            className={neonEditButton}
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDeleteUser(u)}
                            className={neonDeleteButton}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      ) : (
                        <div className={`text-right text-[10px] font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          Restricted
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {!loadingUsers && users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500 text-sm">{noDataLabel}</td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>

          <div className="w-full flex flex-wrap items-center justify-between gap-3 mt-6">
            <div className="flex items-center gap-2">
              <Label htmlFor="usersPerPage" className={`text-[12px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Per page</Label>
              <select
                id="usersPerPage"
                value={usersPerPage}
                onChange={e => {
                  setUsersPerPage(Number(e.target.value));
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
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
        </>
        )}
      </div>
      </main>

      {isSettingsOpen && (
        <div className={`fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto no-scrollbar ${isDark ? 'bg-black/65' : 'bg-black/40'}`}>
          <div className={`w-full max-w-2xl rounded-[24px] p-10 sm:p-12 relative overflow-y-auto no-scrollbar max-h-[calc(100vh-2rem)] ${
            isDark
              ? 'bg-[#121214] border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.25)]'
              : 'bg-white border border-blue-200 shadow-[0_0_50px_rgba(59,130,246,0.15)]'
          }`}>
            <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent to-transparent ${
              isDark ? 'via-blue-500/30' : 'via-blue-400/40'
            }`}></div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-1.5 flex flex-wrap items-center gap-3">
                  <h2 className={`text-[1.75rem] font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{formData.username}</h2>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
                    editorRole === 'ADMIN'
                      ? isDark
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : isDark
                        ? 'bg-slate-500/20 text-slate-200 border border-slate-300/25'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {editorRole === 'ADMIN' ? 'ADMIN' : 'NON-ADMIN'}
                  </span>
                </div>
                <p className={`text-[14px] mb-8 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Manage your credentials securely.</p>
              </div>
              <button
                type="button"
                onClick={() => { setIsSettingsOpen(false); setSelectedUserId(null); setEditorRole('NON_ADMIN'); }}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                  isDark
                    ? 'text-gray-500 hover:text-white border-white/10 hover:border-white/20'
                    : 'text-gray-600 hover:text-gray-900 border-gray-300 hover:border-gray-400'
                }`}
                aria-label="Close settings"
              >
                <X size={18} />
              </button>
            </div>

            <div className={`mb-6 border rounded-xl px-4 py-4 max-w-[380px] mx-auto ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className={`h-16 w-16 rounded-full overflow-hidden border flex items-center justify-center ${isDark ? 'border-white/10 bg-[#09090B]' : 'border-gray-300 bg-white'}`}>
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="User avatar preview" className="h-full w-full object-cover" />
                  ) : (
                    <UserCircle size={34} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
                  )}
                </div>
                <div className="min-w-0 text-center">
                  <p className={`text-[13px] font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Profile Image</p>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${isDark ? 'text-gray-200 border-white/15 hover:border-blue-400/40' : 'text-gray-700 border-gray-300 hover:border-blue-400'}`}
                    >
                      Upload / Change
                    </button>
                    {formData.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, avatarUrl: '' }))}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${isDark ? 'text-gray-300 border-white/10 hover:border-rose-400/40' : 'text-gray-600 border-gray-300 hover:border-rose-400'}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>

            {success && <Alert color="success" className={`mb-6 rounded-xl border ${isDark ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-green-300 bg-green-50 text-green-700'}`}>{success}</Alert>}
            {error && <Alert color="failure" className={`mb-6 rounded-xl border ${isDark ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-red-300 bg-red-50 text-red-700'}`}>{error}</Alert>}

            <div className="flex flex-col gap-5">
              <div>
                <div className="mb-1.5 pl-1">
                  <Label htmlFor="username" className={`text-[13px] font-medium tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Username</Label>
                </div>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className={isDark ? 'bg-[#09090B] border border-white/5 text-gray-200 rounded-xl block w-full px-5 py-3.5 text-[14px] outline-none transition-all focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.15)] shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]' : 'bg-gray-50 border border-gray-300 text-gray-900 rounded-xl block w-full px-5 py-3.5 text-[14px] outline-none transition-all focus:border-blue-400 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]'}
                />
              </div>

              <div>
                <div className="mb-1.5 pl-1">
                  <Label htmlFor="email" className={`text-[13px] font-medium tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Email Address</Label>
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className={isDark ? 'bg-[#09090B] border border-white/5 text-gray-200 rounded-xl block w-full px-5 py-3.5 text-[14px] outline-none transition-all focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.15)] shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]' : 'bg-gray-50 border border-gray-300 text-gray-900 rounded-xl block w-full px-5 py-3.5 text-[14px] outline-none transition-all focus:border-blue-400 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]'}
                />
              </div>

              <div>
                <div className="mb-1.5 pl-1">
                  <Label htmlFor="contactNo" className={`text-[13px] font-medium tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Contact Number (optional)</Label>
                </div>
                <div className="flex gap-3">
                  <select
                    id="countryCode"
                    value={formData.countryCode}
                    onChange={e => setFormData({ ...formData, countryCode: e.target.value })}
                    title="Select country code"
                    className={`w-[220px] shrink-0 rounded-xl px-3 py-3.5 text-[14px] outline-none transition-all ${
                      isDark
                        ? 'bg-[#09090B] border border-white/5 text-gray-200 focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                        : 'bg-gray-50 border border-gray-300 text-gray-900 focus:border-blue-400 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                    }`}
                  >
                    {COUNTRY_CODE_OPTIONS.map(option => (
                      <option key={option.iso} value={option.dialCode}>{option.label}</option>
                    ))}
                  </select>
                  <input
                    id="contactNo"
                    type="tel"
                    value={formData.contactNo}
                    onChange={e => setFormData({ ...formData, contactNo: e.target.value.replace(/[^0-9]/g, '') })}
                    className={isDark ? 'bg-[#09090B] border border-white/5 text-gray-200 rounded-xl block min-w-0 flex-1 w-full px-5 py-3.5 text-[14px] outline-none transition-all focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.15)] shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]' : 'bg-gray-50 border border-gray-300 text-gray-900 rounded-xl block min-w-0 flex-1 w-full px-5 py-3.5 text-[14px] outline-none transition-all focus:border-blue-400 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]'}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 pl-1">
                  <Label htmlFor="password" className={`text-[13px] font-medium tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Password</Label>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className={isDark ? 'bg-[#09090B] border border-white/5 text-gray-200 rounded-xl block w-full px-5 py-3.5 text-[14px] outline-none transition-all focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.15)] shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]' : 'bg-gray-50 border border-gray-300 text-gray-900 rounded-xl block w-full px-5 py-3.5 text-[14px] outline-none transition-all focus:border-blue-400 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]'}
                />
              </div>

              <div>
                <div className="mb-1.5 pl-1">
                  <Label htmlFor="confirmPassword" className={`text-[13px] font-medium tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Retype Password</Label>
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Retype new password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={isDark ? 'bg-[#09090B] border border-white/5 text-gray-200 rounded-xl block w-full px-5 py-3.5 text-[14px] outline-none transition-all focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.15)] shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]' : 'bg-gray-50 border border-gray-300 text-gray-900 rounded-xl block w-full px-5 py-3.5 text-[14px] outline-none transition-all focus:border-blue-400 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]'}
                />
              </div>

              <div className={`flex justify-center mt-8 pt-8 border-t ${
                isDark ? 'border-white/5' : 'border-gray-200'
              }`}>
                <button type="button" onClick={handleUpdate} className={`w-full max-w-[340px] flex justify-center items-center font-medium text-[15px] rounded-xl py-3.5 border transition-all transform hover:-translate-y-0.5 ${
                  isDark
                    ? 'bg-gradient-to-b from-[#25252D] to-[#121214] hover:brightness-110 text-gray-200 border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.3)]'
                    : 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600 shadow-[0_4px_15px_rgba(59,130,246,0.3)]'
                }`} disabled={loading}>
                  {loading ? <Spinner size="sm" light={true} /> : <><Check size={18} className="mr-2" /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className={`fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto no-scrollbar ${isDark ? 'bg-black/70' : 'bg-black/40'}`}>
          <div className={`w-full max-w-md rounded-2xl p-7 relative overflow-hidden ${
            isDark
              ? 'bg-[#121214] border border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.2)]'
              : 'bg-white border border-red-200 shadow-[0_0_40px_rgba(239,68,68,0.15)]'
          }`}>
            <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent to-transparent ${
              isDark ? 'via-rose-500/35' : 'via-red-400/40'
            }`}></div>

            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className={`absolute top-4 right-4 text-sm px-2.5 py-1.5 rounded-lg border transition-colors ${
                isDark
                  ? 'text-gray-500 hover:text-white border-white/10 hover:border-white/20'
                  : 'text-gray-600 hover:text-gray-900 border-gray-300 hover:border-gray-400'
              }`}
              aria-label="Close delete confirmation"
              disabled={deletingUser}
            >
              <X size={16} />
            </button>

            <h3 className={`text-[1.15rem] font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Delete Profile</h3>
            <p className={`text-[14px] mt-3 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Do you want to delete your existing profile?
            </p>
            <p className={`text-[13px] mt-2 ${isDark ? 'text-rose-300/90' : 'text-red-600'}`}>
              User: {deleteTarget.username}
            </p>

            <div className="flex justify-center mt-7">
              <button
                type="button"
                onClick={handleDeleteUser}
                className={`w-full max-w-[220px] flex justify-center items-center font-medium text-[15px] rounded-xl py-2.5 border transition-all transform hover:-translate-y-0.5 disabled:opacity-50 ${
                  isDark
                    ? 'bg-gradient-to-b from-[#25252D] to-[#121214] hover:brightness-110 text-gray-200 border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.3)]'
                    : 'bg-red-500 hover:bg-red-600 text-white border-red-600 shadow-[0_4px_15px_rgba(239,68,68,0.3)]'
                }`}
                disabled={deletingUser}
              >
                {deletingUser ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
