import React, { useState, useEffect, type FormEvent, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import { FaUsers, FaUserPlus, FaTimes, FaSearch, FaEdit, FaTrash, FaBuilding, FaPlus } from "react-icons/fa";
import { ArrowUpDown, ChevronLeft, ChevronRight, Building2, Users, Search, Download, Plus, Settings2, SlidersHorizontal, X, Edit2, Trash } from 'lucide-react';
import { API_BASE_URL } from "../config/api";
import { useTheme } from "../context/ThemeContext";
import { useDrawer } from "../context/DrawerContext";

import * as XLSX from 'xlsx';

interface UserListUIProps {
  token: string;
  onUnauthorized: () => void;
}

interface UserRecord {
  id: number;
  username: string;
  email: string;
  role: string;
  contactNo?: string;
  img?: string;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
}

const API_BASE = API_BASE_URL;

const UserListUI: React.FC<UserListUIProps> = ({ token, onUnauthorized }) => {
  const { isDark } = useTheme();
  const { isDrawerOpen } = useDrawer();
  const mainMarginClass = isDrawerOpen ? "md:ml-64" : "md:ml-20";
  const isSidebarMinimized = !isDrawerOpen;
  const navigate = useNavigate();

  // Data States
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting States
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [openSortMenu, setOpenSortMenu] = useState<string | null>(null);

  // Modal States
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [userFormData, setUserFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactNo: "",
    role: "NON_ADMIN",
  });

  const sortMenuRef = useRef<HTMLDivElement>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users?limit=1000`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      // Backend returns { users: [...], pagination: {...} }
      const fetchedUsers = Array.isArray(data) ? data : (data.users || []);
      setUsers(fetchedUsers);
    } catch (e: any) {
      console.error("Fetch users error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleExportUsers = () => {
    const dataToExport = filteredData.map(u => ({
      ID: u.id,
      Username: u.username,
      Email: u.email,
      Role: u.role,
      Phone: u.contactNo || 'N/A'
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "User_Management_Export.xlsx");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setOpenSortMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(userFormData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to register user");
      }
      await fetchUsers();
      setIsAddUserModalOpen(false);
      setUserFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        contactNo: "",
        role: "NON_ADMIN",
      });
      toast.success("User created successfully");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          username: userFormData.username,
          email: userFormData.email,
          contactNo: userFormData.contactNo,
          password: userFormData.password || undefined,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update user");
      }
      await fetchUsers();
      setIsEditUserModalOpen(false);
      setEditingUser(null);
      toast.success("User updated successfully");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Failed to delete user");
      await fetchUsers();
      toast.success("User deleted successfully");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleToggleRole = async (userId: number, currentRole: string) => {
    try {
      const newRole = currentRole === "ADMIN" ? "NON_ADMIN" : "ADMIN";
      const res = await fetch(`${API_BASE}/api/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update user role");
      }
      await fetchUsers();
      toast.success(`User role updated to ${newRole}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const applySort = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setOpenSortMenu(null);
  };

  const filteredData = useMemo(() => {
    let result = users.filter(u =>
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    result.sort((a, b) => {
      const valA = String(sortBy === 'name' ? (a.username || '') : sortBy === 'email' ? (a.email || '') : (a.role || '')).toLowerCase();
      const valB = String(sortBy === 'name' ? (b.username || '') : sortBy === 'email' ? (b.email || '') : (b.role || '')).toLowerCase();
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    return result;
  }, [users, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  return (
    <div className={`min-h-screen transition-all duration-300 ${mainMarginClass} ${isDark ? 'bg-[#0B1220]' : 'bg-gray-50/50'} pt-19 pb-10 px-4 md:px-8`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
              <Users size={28} />
            </div>
            <div>
              <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>User Management</h1>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>View and manage system users and roles</p>
            </div>
          </div>
        </div>

        {/* Search and Filters Bar (Match Company UI) */}
        <div className={`p-3 rounded-[2rem] border flex flex-col md:flex-row items-center gap-3 transition-all ${isDark
          ? 'bg-[#09090B]/60 border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md'
          : 'bg-white border-gray-100 shadow-[0_8px_20px_rgba(0,0,0,0.04)]'}`}>

          <div className="relative flex-1 w-full group">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-gray-600 group-focus-within:text-cyan-400' : 'text-gray-400 group-focus-within:text-cyan-500'}`} size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full rounded-2xl pl-12 pr-4 py-3 text-sm outline-none transition-all ${isDark
                ? 'bg-black/40 border border-white/5 text-gray-200 placeholder:text-gray-600 focus:border-cyan-500/50 focus:bg-black/60'
                : 'bg-gray-50/50 border border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-cyan-400 focus:bg-white'
                }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportUsers}
              className={`h-[42px] px-3 rounded-xl border flex items-center gap-2 text-sm transition-all whitespace-nowrap ${isDark
                ? 'bg-[#09090B] border-white/10 text-gray-300 hover:text-white hover:border-white/20'
                : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400'
                }`}
              title="Export users to Excel"
            >
              <Download size={15} /> Export
            </button>

            <button
              type="button"
              onClick={() => setIsAddUserModalOpen(true)}
              className={`h-[42px] px-3 rounded-xl border flex items-center gap-2 text-sm transition-all whitespace-nowrap ${isDark
                ? 'bg-[#09090B] border-white/10 text-gray-300 hover:text-white hover:border-white/20'
                : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400'
                }`}
              title="Add New User"
            >
              <Plus size={15} className="text-emerald-500" /> Add
            </button>
          </div>
        </div>

        {/* Main Table Container (Match Company UI) */}
        <div className={`w-full max-w-full rounded-2xl px-3 pb-3 pt-2 table-animated-surface ${isDark ? 'table-animated-surface--dark' : 'table-animated-surface--light'} ${isDark
          ? 'bg-gradient-to-b from-[#10131D]/95 to-[#0D1018]/95 shadow-[0_22px_50px_rgba(0,0,0,0.45)] border border-white/5'
          : 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100'
          }`}>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-separate [border-spacing:0_10px]">
              <thead>
                <tr>
                  <th className={`font-semibold tracking-[0.12em] uppercase ${isDark ? 'text-cyan-200/70' : 'text-cyan-600'}`} style={{ padding: isSidebarMinimized ? '12px 24px' : '12px 16px', fontSize: isSidebarMinimized ? '10px' : '9px' }}>
                    ID
                  </th>
                  <th className={`font-semibold tracking-[0.12em] uppercase ${isDark ? 'text-cyan-200/70' : 'text-cyan-600'}`} style={{ padding: isSidebarMinimized ? '12px 24px' : '12px 16px', fontSize: isSidebarMinimized ? '10px' : '9px' }}>
                    <div className="relative inline-flex items-center gap-2" ref={openSortMenu === 'name' ? sortMenuRef : null}>
                      <span>User Name</span>
                      <button onClick={() => setOpenSortMenu(openSortMenu === 'name' ? null : 'name')} className={`rounded-md p-1.5 transition-colors ${isDark ? 'hover:bg-white/10 text-cyan-200/70' : 'hover:bg-cyan-100 text-cyan-600'}`}>
                        <ArrowUpDown size={13} />
                      </button>
                      {openSortMenu === 'name' && (
                        <div className={`absolute top-full left-0 mt-2 min-w-[92px] rounded-lg border p-1 z-30 shadow-2xl ${isDark ? 'bg-[#111318] border-white/10' : 'bg-white border-gray-200'}`}>
                          <button onClick={() => applySort('name', 'asc')} className={`w-full text-left px-3 py-2 rounded-md text-[0.75rem] uppercase font-bold transition-colors ${sortBy === 'name' && sortOrder === 'asc' ? (isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-700') : (isDark ? 'text-slate-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100')}`}>ASC</button>
                          <button onClick={() => applySort('name', 'desc')} className={`w-full text-left px-3 py-2 rounded-md text-[0.75rem] uppercase font-bold transition-colors ${sortBy === 'name' && sortOrder === 'desc' ? (isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-700') : (isDark ? 'text-slate-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100')}`}>DSC</button>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className={`font-semibold tracking-[0.12em] uppercase ${isDark ? 'text-cyan-200/70' : 'text-cyan-600'}`} style={{ padding: isSidebarMinimized ? '12px 24px' : '12px 16px', fontSize: isSidebarMinimized ? '10px' : '9px' }}>
                    <div className="relative inline-flex items-center gap-2" ref={openSortMenu === 'email' ? sortMenuRef : null}>
                      <span>Email Address</span>
                      <button onClick={() => setOpenSortMenu(openSortMenu === 'email' ? null : 'email')} className={`rounded-md p-1.5 transition-colors ${isDark ? 'hover:bg-white/10 text-cyan-200/70' : 'hover:bg-cyan-100 text-cyan-600'}`}>
                        <ArrowUpDown size={13} />
                      </button>
                      {openSortMenu === 'email' && (
                        <div className={`absolute top-full left-0 mt-2 min-w-[92px] rounded-lg border p-1 z-30 shadow-2xl ${isDark ? 'bg-[#111318] border-white/10' : 'bg-white border-gray-200'}`}>
                          <button onClick={() => applySort('email', 'asc')} className={`w-full text-left px-3 py-2 rounded-md text-[0.75rem] uppercase font-bold transition-colors ${sortBy === 'email' && sortOrder === 'asc' ? (isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-700') : (isDark ? 'text-slate-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100')}`}>ASC</button>
                          <button onClick={() => applySort('email', 'desc')} className={`w-full text-left px-3 py-2 rounded-md text-[0.75rem] uppercase font-bold transition-colors ${sortBy === 'email' && sortOrder === 'desc' ? (isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-700') : (isDark ? 'text-slate-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100')}`}>DSC</button>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className={`font-semibold tracking-[0.12em] uppercase ${isDark ? 'text-cyan-200/70' : 'text-cyan-600'}`} style={{ padding: isSidebarMinimized ? '12px 24px' : '12px 16px', fontSize: isSidebarMinimized ? '10px' : '9px' }}>Role</th>
                  <th className={`font-semibold tracking-[0.12em] uppercase text-center ${isDark ? 'text-cyan-200/70' : 'text-cyan-600'}`} style={{ padding: isSidebarMinimized ? '12px 24px' : '12px 16px', fontSize: isSidebarMinimized ? '10px' : '9px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-20 text-slate-500 font-medium">Loading system users...</td></tr>
                ) : pagedData.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-20 text-slate-500 font-medium">No users found matching your search.</td></tr>
                ) : pagedData.map((item, index) => (
                  <tr key={item.id} className="group transition-all duration-300 hover:-translate-y-[2px]">
                    <td className={`rounded-l-2xl px-6 py-4 transition-colors ${isDark ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]` : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-cyan-50`}`} style={{ padding: isSidebarMinimized ? '16px 24px' : '16px 16px' }}>
                      <span className={`font-black tracking-wider ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} style={{ fontSize: isSidebarMinimized ? '13px' : '12px' }}>
                        #{item.id}
                      </span>
                    </td>
                    <td className={`px-6 py-4 transition-colors ${isDark ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]` : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-cyan-50`}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-inner overflow-hidden ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>
                          {item.img || item.avatarUrl ? (
                            <img src={item.img || item.avatarUrl} alt={item.username} className="w-full h-full object-cover" />
                          ) : (
                            (item.firstName && item.lastName) ?
                              `${item.firstName.charAt(0)}${item.lastName.charAt(0)}`.toUpperCase() :
                              item.username?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className={`font-black tracking-tight ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} style={{ fontSize: '16px' }}>{item.username}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 transition-colors ${isDark ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]` : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-cyan-50`}`}>
                      <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{item.email}</span>
                    </td>
                    <td className={`px-6 py-4 transition-colors ${isDark ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]` : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-cyan-50`}`}>
                      <button
                        onClick={() => handleToggleRole(item.id, item.role)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${item.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'}`}
                      >
                        {item.role}
                      </button>
                    </td>
                    <td className={`rounded-r-xl transition-colors ${isDark ? `${index % 2 === 0 ? 'bg-white/[0.04]' : 'bg-white/[0.02]'} group-hover:bg-white/[0.08]` : `${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} group-hover:bg-cyan-50`}`} style={{ padding: isSidebarMinimized ? '12px 20px' : '12px 16px' }}>
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(item);
                              setUserFormData({
                                username: item.username,
                                email: item.email,
                                password: "",
                                confirmPassword: "",
                                contactNo: item.contactNo || "",
                                role: item.role,
                              });
                              setIsEditUserModalOpen(true);
                            }}
                            className={`peer inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ${isDark
                              ? 'border-violet-400/40 bg-violet-500/10 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.22)] hover:bg-violet-500/20 hover:shadow-[0_0_18px_rgba(139,92,246,0.38)]'
                              : 'border-violet-300 bg-violet-50 text-violet-700 shadow-[0_0_12px_rgba(139,92,246,0.14)] hover:bg-violet-100'
                              }`}
                            title="Edit User"
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(item.id)}
                            className={`peer inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ${isDark
                              ? 'border-rose-400/40 bg-rose-500/10 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.22)] hover:bg-rose-500/20 hover:shadow-[0_0_18px_rgba(244,63,94,0.38)]'
                              : 'border-rose-300 bg-rose-50 text-rose-700 shadow-[0_0_12px_rgba(244,63,94,0.14)] hover:bg-rose-100'
                              }`}
                            title="Delete User"
                          >
                            <Trash size={13} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Footer */}
        <div className={`px-8 py-5 flex flex-wrap items-center justify-between gap-6 border-t ${isDark ? 'border-white/10 bg-black/40' : 'border-gray-100 bg-gray-50/50'}`}>
          <div className="flex items-center gap-4">
            <span className={`text-[0.75rem] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Show</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`bg-transparent text-xs font-black border-none focus:ring-0 p-0 pr-8 cursor-pointer transition-colors ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}
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

        {/* Add/Edit User Modals */}
        {(isAddUserModalOpen || isEditUserModalOpen) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl animate-in fade-in duration-300">
            <div className={`w-full max-w-lg rounded-[2.5rem] border p-8 shadow-2xl transform transition-all scale-in duration-300 ${isDark ? 'border-white/10 bg-[#0B1220]' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                    {isEditUserModalOpen ? <FaEdit size={24} /> : <FaUserPlus size={24} />}
                  </div>
                  <h3 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {isEditUserModalOpen ? "Modify Account" : "Create New User"}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsAddUserModalOpen(false);
                    setIsEditUserModalOpen(false);
                  }}
                  className={`p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-slate-400 hover:text-rose-500`}
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <form onSubmit={isEditUserModalOpen ? handleUpdateUser : handleAddUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={`block text-[0.75rem] font-black uppercase tracking-[0.2em] ml-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Username</label>
                    <input
                      type="text"
                      required
                      value={userFormData.username}
                      onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                      className={`w-full px-5 py-4 rounded-2xl border text-sm font-bold outline-none transition-all ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-cyan-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-400'}`}
                      placeholder="Enter unique username"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`block text-[0.75rem] font-black uppercase tracking-[0.2em] ml-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Email Address</label>
                    <input
                      type="email"
                      required
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                      className={`w-full px-5 py-4 rounded-2xl border text-sm font-bold outline-none transition-all ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-cyan-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-400'}`}
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                {!isEditUserModalOpen && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className={`block text-[0.75rem] font-black uppercase tracking-[0.2em] ml-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Password</label>
                      <input
                        type="password"
                        required
                        value={userFormData.password}
                        onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                        className={`w-full px-5 py-4 rounded-2xl border text-sm font-bold outline-none transition-all ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-cyan-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-400'}`}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={`block text-[0.75rem] font-black uppercase tracking-[0.2em] ml-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Confirm Password</label>
                      <input
                        type="password"
                        required
                        value={userFormData.confirmPassword}
                        onChange={(e) => setUserFormData({ ...userFormData, confirmPassword: e.target.value })}
                        className={`w-full px-5 py-4 rounded-2xl border text-sm font-bold outline-none transition-all ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-cyan-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-400'}`}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                {isEditUserModalOpen && (
                  <div className="space-y-2">
                    <label className={`block text-[0.75rem] font-black uppercase tracking-[0.2em] ml-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Change Password (Optional)</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current password"
                      value={userFormData.password}
                      onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                      className={`w-full px-5 py-4 rounded-2xl border text-sm font-bold outline-none transition-all ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-cyan-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-400'}`}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className={`block text-[0.75rem] font-black uppercase tracking-[0.2em] ml-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Contact Number</label>
                  <input
                    type="text"
                    value={userFormData.contactNo}
                    onChange={(e) => setUserFormData({ ...userFormData, contactNo: e.target.value })}
                    className={`w-full px-5 py-4 rounded-2xl border text-sm font-bold outline-none transition-all ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-cyan-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-400'}`}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="pt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddUserModalOpen(false);
                      setIsEditUserModalOpen(false);
                    }}
                    className={`flex-1 px-6 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900'}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-4 rounded-[1.5rem] bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-cyan-600/30 active:scale-95"
                  >
                    {isEditUserModalOpen ? "Update Account" : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserListUI;
