import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { FaPlus, FaTimes, FaSlidersH, FaServer, FaUsers, FaEdit, FaTrash } from "react-icons/fa";
import { useDrawer } from "../../context/DrawerContext";
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
      if (!res.ok) throw new Error("Failed to load contacts");
      const data = await res.json();
      setCompanyContacts(data);
    } catch (e: any) {
      console.error(e);
      setCompanyContacts([]);
    }
  };

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
          <button
            type="button"
            className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 inline-flex items-center"
            onClick={() => setIsModalOpen(true)}
          >
            <FaPlus className="w-4 h-4 me-2" />
            Add Company
          </button>
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
              {!loading && companies.length === 0 && (
                <tr>
                  <td
                    className="px-6 py-6 text-center text-gray-500 dark:text-gray-400"
                    colSpan={7}
                  >
                    No records found
                  </td>
                </tr>
              )}

              {companies.map((company) => {
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
                    <td className="px-6 py-4 font-semibold whitespace-nowrap">
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
                        onClick={() => navigate(`/customizations?companyId=${company.id}&companyName=${encodeURIComponent(company.name)}`)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/12 text-cyan-200 transition-all duration-200 hover:bg-cyan-500/20 hover:text-cyan-100 hover:border-cyan-300"
                        title="Customizations"
                      >
                        <FaSlidersH size={12} />
                      </button>
                      <button
                        onClick={() => navigate(`/servers?companyId=${company.id}&companyName=${encodeURIComponent(company.name)}`)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-violet-400/35 bg-violet-500/12 text-violet-200 transition-all duration-200 hover:bg-violet-500/20 hover:text-violet-100 hover:border-violet-300"
                        title="Servers"
                      >
                        <FaServer size={12} />
                      </button>
                      <button
                        onClick={() => navigate(`/tenants?companyId=${company.id}&companyName=${encodeURIComponent(company.name)}`)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/35 bg-emerald-500/12 text-emerald-200 transition-all duration-200 hover:bg-emerald-500/20 hover:text-emerald-100 hover:border-emerald-300"
                        title="Tenants"
                      >
                        <FaUsers size={12} />
                      </button>
                      <button
                        onClick={() => {
                          setEditFormData({
                            id: company.id,
                            companyName: company.name,
                            phone: company.phone || "",
                            email: company.email || "",
                            address: company.address || "",
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-blue-400/35 bg-blue-500/12 text-blue-200 transition-all duration-200 hover:bg-blue-500/20 hover:text-blue-100 hover:border-blue-300"
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
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
                    alert(e.message);
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
