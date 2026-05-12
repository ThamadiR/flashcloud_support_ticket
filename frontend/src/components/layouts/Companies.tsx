import { useEffect, useState, useMemo } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';

import { FaPlus, FaTimes, FaSlidersH, FaServer, FaUsers, FaEdit, FaTrash, FaSearch, FaUserPlus } from "react-icons/fa";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDrawer } from "../../context/DrawerContext";
import { useTheme } from "../../context/ThemeContext";
import { API_BASE_URL } from "../../config/api";

type Company = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  contacts: number;
  createdAt: string;
  tenant_count?: number | string | null;
  updated_at?: string | null;
};

const API_BASE = API_BASE_URL;

function Companies() {
  const navigate = useNavigate();
  const { isDrawerOpen } = useDrawer();
  const { isDark } = useTheme();
  const mainMarginClass = isDrawerOpen ? "md:ml-64" : "md:ml-20";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyContacts, setCompanyContacts] = useState<any[]>([]);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: 0,
    companyName: "",
    phone: "",
    email: "",
    address: "",
  });

  const [formData, setFormData] = useState({
    companyName: "",
    phone: "",
    email: "",
    address: "",
  });

  // --- Pagination States ---
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);


  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/companies`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Company[] = await res.json();
      setCompanies(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);


  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      companyName: "",
      phone: "",
      email: "",
      address: "",
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/companies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          address: formData.address || undefined,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }

      // Option 1: refresh list
      await fetchCompanies();

      // Option 2: optimistically add to state:
      // const created = await res.json();
      // setCompanies(prev => [created, ...prev]);

      resetForm();
      setIsModalOpen(false);
    } catch (e: any) {
      setError(e?.message ?? "Failed to add company");
    }
  };

  const fetchContactsForCompany = async (companyId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/api/companies/by-company/${companyId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to create company");
      }
      setIsModalOpen(false);
      setFormData({ companyName: "", phone: "", email: "", address: "" });
      fetchCompanies();
      toast.success("Company created successfully");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const pagedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return companies.slice(startIndex, startIndex + rowsPerPage);
  }, [companies, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(companies.length / rowsPerPage);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main
        className={`p-4 ${mainMarginClass} h-auto pt-20 space-y-4 transition-all duration-300`}
      >
        {/* Header with Add Company button */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Company Details
          </h1>
          <div className="flex items-center gap-3">
            {/* <button
              type="button"
              className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 inline-flex items-center"
              onClick={() => navigate('/users')}
            >
              <FaUsers className="w-4 h-4 me-2 text-blue-500" />
              User Management
            </button> */}
            <button
              type="button"
              className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 inline-flex items-center"
              onClick={() => setIsModalOpen(true)}
            >
              <FaPlus className="w-4 h-4 me-2 text-green-500" />
              Add Company
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading…
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        {/* Company table */}
        <div className="overflow-x-auto no-scrollbar rounded-xl border border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 bg-white dark:bg-gray-900 shadow-sm">
          <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
            <thead className="bg-[#eeeeee] dark:bg-gray-800 rounded-t-xl">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                  ID
                </th>
                <th className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                  Name
                </th>
                <th className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                  Email
                </th>
                <th className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                  Tenant Count
                </th>
                <th className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                  Created At
                </th>
                <th className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                  Updated At
                </th>
                <th className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {!loading && pagedCompanies.length === 0 && (
                <tr>
                  <td
                    className="px-6 py-6 text-center text-gray-500 dark:text-gray-400"
                    colSpan={7}
                  >
                    No records found
                  </td>
                </tr>
              )}

              {pagedCompanies.map((company) => {
                const parseDate = (d: any) => {
                  if (!d) return "—";
                  const dateObj = new Date(d);
                  if (isNaN(dateObj.getTime())) return "—";
                  return dateObj.toISOString().slice(0, 19).replace("T", " ");
                };

                return (
                  <tr
                    key={company.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
                  >
                    <td className="px-6 py-4 font-semibold whitespace-nowrap">
                      #{company.id}
                    </td>
                    <td className={`px-6 py-4 font-black tracking-tight whitespace-nowrap ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {company.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {company.email || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {company.tenant_count ?? 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {parseDate((company as any).created_at || company.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {parseDate((company as any).updated_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                      <button
                        onClick={() => navigate(`/servers?companyId=${company.id}&companyName=${encodeURIComponent(company.name)}`)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-violet-400/35 bg-violet-500/12 text-violet-600 transition-all duration-200 hover:bg-violet-500/20 hover:text-violet-700 dark:text-violet-200 dark:hover:text-violet-100"
                        title="Servers"
                      >
                        <FaServer className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => navigate(`/tenants?companyId=${company.id}&companyName=${encodeURIComponent(company.name)}`)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-400/35 bg-emerald-500/12 text-emerald-600 transition-all duration-200 hover:bg-emerald-500/20 hover:text-emerald-700 dark:text-emerald-200 dark:hover:text-emerald-100"
                        title="Tenants"
                      >
                        <FaUsers className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCompany(company);
                          setEditFormData({
                            id: company.id,
                            companyName: company.name,
                            phone: company.phone || "",
                            email: company.email || "",
                            address: company.address || "",
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-400/35 bg-blue-500/12 text-blue-600 transition-all duration-200 hover:bg-blue-500/20 hover:text-blue-700 dark:text-blue-200 dark:hover:text-blue-100"
                        title="Edit"
                      >
                        <FaEdit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm("Are you sure?")) {
                            const token = localStorage.getItem("token");
                            await fetch(`${API_BASE}/api/companies/${company.id}`, {
                              method: "DELETE",
                              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                            });
                            fetchCompanies();
                          }
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-400/35 bg-rose-500/12 text-rose-600 transition-all duration-200 hover:bg-rose-500/20 hover:text-rose-700 dark:text-rose-200 dark:hover:text-rose-100"
                        title="Delete"
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-x border-b ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50/50'} rounded-b-xl shadow-sm -mt-4 mb-4`}>
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

        {/* Add Company Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add New Company
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label
                      htmlFor="companyName"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Company Name *
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Phone + Email Row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-top border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Company
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Contacts Modal */}
        {isContactModalOpen && selectedCompany && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Contacts of {selectedCompany.name}
                </h2>
                <button
                  onClick={() => setIsContactModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-x-auto">
                {companyContacts.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">
                    No contacts found.
                  </p>
                ) : (
                  <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Email</th>
                        <th className="px-4 py-2">Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyContacts.map((contact) => (
                        <tr
                          key={contact.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <td className="px-4 py-2">
                            {contact.firstName} {contact.lastName}
                          </td>
                          <td className="px-4 py-2">{contact.email || "—"}</td>
                          <td className="px-4 py-2">{contact.phone || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Company Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Edit Company
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const token = localStorage.getItem("token");
                    const res = await fetch(
                      `${API_BASE}/api/companies/${editFormData.id}`,
                      {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify({
                          companyName: editFormData.companyName,
                          phone: editFormData.phone,
                          email: editFormData.email,
                          address: editFormData.address,
                        }),
                      }
                    );
                    if (!res.ok) throw new Error("Failed to update company");
                    await fetchCompanies();
                    setIsEditModalOpen(false);
                  } catch (e: any) {
                    toast.error(e.message);
                  }
                }}
                className="p-4 space-y-4"
              >
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={editFormData.companyName}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          companyName: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={editFormData.address}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Companies;
