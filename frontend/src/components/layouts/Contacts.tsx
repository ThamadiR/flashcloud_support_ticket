import React, { useEffect, useRef, useState } from "react";
import { FaPlus, FaTimes, FaUserCircle, FaTrash } from "react-icons/fa";
import { useDrawer } from "../../context/DrawerContext";

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

const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL || "http://localhost:5000";

function Contacts() {
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main
        className={`p-4 ${mainMarginClass} h-auto pt-20 space-y-4 transition-all duration-300`}
      >
        {/* Header with Add Contact button */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingContact ? "Edit Contact" : "Add New Contact"}
          </h1>
          <button
            type="button"
            className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 inline-flex items-center"
            onClick={() => setIsModalOpen(true)}
          >
            <FaPlus className="w-4 h-4 me-2" />
            Add Contact
          </button>
        </div>

        {/* Alerts */}
        {loading && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading…
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        {/* Contact table */}
        <div className="overflow-x-auto overflow-y-auto h-[438px] rounded-xl border border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 bg-white dark:bg-gray-900 shadow-sm">
          <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
            <thead className="bg-[#eeeeee] dark:bg-gray-800 rounded-t-xl">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                  Profile
                </th>
                <th className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                  Name
                </th>
                <th className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                  Phone
                </th>
                <th className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                  Email
                </th>
                <th className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                  Company
                </th>
                <th className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {!loading && contacts.length === 0 && (
                <tr>
                  <td
                    className="px-6 py-4 text-gray-500 dark:text-gray-400"
                    colSpan={6}
                  >
                    No contacts found.
                  </td>
                </tr>
              )}

              {contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {contact.profileImage ? (
                      <img
                        src={imgSrc(contact.profileImage) || ""}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <FaUserCircle className="w-10 h-10 text-gray-400" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                      className="text-blue-600 dark:text-blue-400 hover:underline mr-3"
                      onClick={() => handleEdit(contact)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 dark:text-red-400 hover:underline"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingContact ? "Edit Contact" : "Add New Contact"}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
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
                          className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <FaUserCircle className="w-24 h-24 text-gray-400" />
                    )}
                  </div>
                  <label className="cursor-pointer">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
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
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Contact Info Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
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
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Company Dropdown */}
                  <div>
                    <label
                      htmlFor="company"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Company
                    </label>
                    <select
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
