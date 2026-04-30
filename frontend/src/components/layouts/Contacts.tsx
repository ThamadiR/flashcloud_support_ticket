import React, { useEffect, useRef, useState } from "react";
import { FaPlus, FaTimes, FaUserCircle, FaTrash } from "react-icons/fa";
import { useDrawer } from "../../context/DrawerContext";
import { useTheme } from "../../context/ThemeContext";
import { API_BASE_URL as API_BASE } from "../../config/api";

type Contact = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  profileImage: string | null; // server returns '/uploads/xxx.jpg' or null
  createdAt: string;
};

function Contacts() {
  const { isDark } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const { isDrawerOpen } = useDrawer();
  const mainMarginClass = isDrawerOpen ? "md:ml-64" : "md:ml-20";

  // Form state (kept as you had)
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    company: string;
    profileImage: File | null;
  }>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    company: "",
    profileImage: null,
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Static companies list (you can swap this to a backend call later)
  const companies = [
    { id: 1, name: "Acme Corporation" },
    { id: 2, name: "iphonik" },
    { id: 3, name: "Umbrella Corp" },
    { id: 4, name: "ABC Solution" },
    { id: 5, name: "SSP Solution" },
    { id: 6, name: "UDC Coporation" },
  ];

  // ----- Helpers -----
  const imgSrc = (p: string | null) => {
    if (!p) return null;
    // If backend returns '/uploads/xxx', prepend API base
    return p.startsWith("http") ? p : `${API_BASE}${p}`;
  };

  // ----- Load contacts -----
  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      // If your backend supports pagination, add ?page=1&pageSize=50
      const res = await fetch(`${API_BASE}/api/contacts`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // If your backend returns { items, total, ... }:
      const items: Contact[] = Array.isArray(data)
        ? data
        : Array.isArray(data.items)
        ? data.items
        : [];

      setContacts(items);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // ----- Form handlers -----
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        profileImage: file,
      }));

      // Preview image locally
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, profileImage: null }));
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      company: "",
      profileImage: null,
    });
    setPreviewImage(null);
    setEditingContact(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  //-------save or Update Contact -----
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setError(null);
      const body = new FormData();
      body.append("firstName", formData.firstName);
      body.append("lastName", formData.lastName);
      body.append("email", formData.email);
      if (formData.phone) body.append("phone", formData.phone);
      if (formData.company) body.append("company", formData.company);
      if (formData.profileImage) {
        body.append("profileImage", formData.profileImage);
      }

      const url = editingContact
        ? `${API_BASE}/api/contacts/${editingContact.id}`
        : `${API_BASE}/api/contacts`;
      const method = editingContact ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body,
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }

      await fetchContacts();
      resetForm();
      setIsModalOpen(false);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save contact");
    }
  };

  // ----- Handle Edit -----
  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      email: contact.email,
      company: contact.company,
      profileImage: null,
    });
    setPreviewImage(imgSrc(contact.profileImage));
    setIsModalOpen(true);
  };

  // ----- Handle Delete -----
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this contact?"))
      return;
    try {
      const res = await fetch(`${API_BASE}/api/contacts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Failed to delete contact`);
      await fetchContacts();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete contact");
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-100"}`}>
      <main
        className={`p-4 ${mainMarginClass} h-auto pt-20 space-y-4 transition-all duration-300`}
      >
        {/* Header with Add Contact button */}
        <div className={`${isDark ? "bg-gray-800 border-gray-700 shadow-[0_0_20px_rgba(0,0,0,0.3)]" : "bg-white border-gray-200 shadow-md"} rounded-lg p-3 border flex justify-between items-center transition-colors`}>
          <h1 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
            {editingContact ? "Edit Contact" : "Add New Contact"}
          </h1>
          <button
            type="button"
            className={`inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg border focus:outline-none transition-all ${
              isDark 
                ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700 hover:border-gray-500" 
                : "bg-white text-gray-900 border-gray-300 hover:bg-gray-100"
            }`}
            onClick={() => setIsModalOpen(true)}
          >
            <FaPlus className="w-4 h-4 me-2" />
            Add Contact
          </button>
        </div>

        {/* Alerts */}
        {loading && (
          <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Loading…
          </div>
        )}
        {error && (
          <div className={`text-sm ${isDark ? "text-red-400" : "text-red-600"}`}>{error}</div>
        )}

        {/* Contact table */}
        <div className={`overflow-x-auto overflow-y-auto h-[438px] rounded-xl border px-4 md:px-6 py-4 transition-colors ${
          isDark 
            ? "border-gray-700 bg-gray-900 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]" 
            : "border-gray-200 bg-white shadow-sm"
        }`}>
          <table className={`w-full text-sm text-left ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            <thead className={`rounded-t-xl transition-colors ${isDark ? "bg-gray-800" : "bg-[#eeeeee]"}`}>
              <tr>
                <th className={`px-6 py-3 font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                  Profile
                </th>
                <th className={`px-6 py-3 font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                  Name
                </th>
                <th className={`px-6 py-3 font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                  Phone
                </th>
                <th className={`px-6 py-3 font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                  Email
                </th>
                <th className={`px-6 py-3 font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                  Company
                </th>
                <th className={`px-6 py-3 font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y transition-colors ${isDark ? "divide-gray-700" : "divide-gray-200"}`}>
              {!loading && contacts.length === 0 && (
                <tr>
                  <td
                    className={`px-6 py-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    colSpan={6}
                  >
                    No contacts found.
                  </td>
                </tr>
              )}

              {contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className={`transition-colors ${isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-50"}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {contact.profileImage ? (
                      <img
                        src={imgSrc(contact.profileImage) || ""}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover border border-gray-700"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <FaUserCircle className="w-10 h-10 text-gray-400" />
                    )}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                    {`${contact.firstName} ${contact.lastName}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {contact.phone || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {contact.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {contact.company || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className={`hover:underline mr-3 font-medium transition-colors ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600"}`}
                      onClick={() => handleEdit(contact)}
                    >
                      Edit
                    </button>
                    <button
                      className={`hover:underline font-medium transition-colors ${isDark ? "text-red-400 hover:text-red-300" : "text-red-600"}`}
                      onClick={() => handleDelete(contact.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Contact Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm transition-all">
            <div className={`rounded-2xl shadow-2xl w-full max-w-2xl border transition-all ${
              isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}>
              <div className={`flex justify-between items-center border-b p-4 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {editingContact ? "Edit Contact" : "Add New Contact"}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Profile Image Upload */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    {previewImage ? (
                      <>
                        <img
                          src={previewImage}
                          alt="Profile preview"
                          className="w-24 h-24 rounded-full object-cover border-2 border-blue-500/50 shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-md transition-all"
                        >
                          <FaTrash className="w-2.5 h-2.5" />
                        </button>
                      </>
                    ) : (
                      <FaUserCircle className="w-24 h-24 text-gray-400 dark:text-gray-600" />
                    )}
                  </div>
                  <label className="cursor-pointer group">
                    <span className={`text-sm font-medium px-5 py-2 rounded-xl transition-all ${
                      isDark 
                        ? "bg-gray-700 text-white hover:bg-gray-600" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}>
                      {previewImage ? "Change Image" : "Upload Image"}
                    </span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Name Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className={`block text-sm font-medium mb-1.5 transition-colors ${isDark ? "text-gray-300" : "text-gray-700"}`}
                      >
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-2.5 border rounded-xl outline-none transition-all ${
                          isDark 
                            ? "bg-gray-900 border-gray-700 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50" 
                            : "bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className={`block text-sm font-medium mb-1.5 transition-colors ${isDark ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-2.5 border rounded-xl outline-none transition-all ${
                          isDark 
                            ? "bg-gray-900 border-gray-700 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50" 
                            : "bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Contact Info Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="phone"
                        className={`block text-sm font-medium mb-1.5 transition-colors ${isDark ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 border rounded-xl outline-none transition-all ${
                          isDark 
                            ? "bg-gray-900 border-gray-700 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50" 
                            : "bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className={`block text-sm font-medium mb-1.5 transition-colors ${isDark ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-2.5 border rounded-xl outline-none transition-all ${
                          isDark 
                            ? "bg-gray-900 border-gray-700 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50" 
                            : "bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Company Dropdown */}
                  <div>
                    <label
                      htmlFor="company"
                      className={`block text-sm font-medium mb-1.5 transition-colors ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Company
                    </label>
                    <select
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border rounded-xl outline-none transition-all ${
                        isDark 
                          ? "bg-gray-900 border-gray-700 text-white focus:border-blue-500/50" 
                          : "bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500"
                      }`}
                    >
                      <option value="">Select a company</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.name}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={`flex justify-end space-x-3 pt-4 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
                      isDark 
                        ? "bg-gray-700 text-white hover:bg-gray-600" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    {editingContact ? "Update Contact" : "Save Contact"}
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

export default Contacts;
