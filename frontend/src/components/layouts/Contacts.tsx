import React, { useEffect, useRef, useState } from "react";
import { FaPlus, FaTimes, FaUserCircle, FaTrash } from "react-icons/fa";
import { Search, Edit2, Trash2, X, Plus, User, Phone, Mail, Building2, ChevronRight, Check } from 'lucide-react';
import { useDrawer } from "../../context/DrawerContext";
import { useTheme } from "../../context/ThemeContext";
import { API_BASE_URL as API_BASE } from "../../config/api";
import toast from 'react-hot-toast';

type Contact = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  profileImage: string | null;
  createdAt: string;
};

function Contacts() {
  const { isDark } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const { isDrawerOpen } = useDrawer();
  const mainMarginClass = isDrawerOpen ? "md:ml-64" : "md:ml-20";

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

  // Filtered contacts
  const filteredContacts = contacts.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const imgSrc = (p: string | null) => {
    if (!p) return null;
    return p.startsWith("http") ? p : `${API_BASE}${p}`;
  };

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/contacts`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: Contact[] = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
      setContacts(items);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch contacts");
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profileImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, profileImage: null }));
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = () => {
    setFormData({ firstName: "", lastName: "", phone: "", email: "", company: "", profileImage: null });
    setPreviewImage(null);
    setEditingContact(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = new FormData();
      body.append("firstName", formData.firstName);
      body.append("lastName", formData.lastName);
      body.append("email", formData.email);
      if (formData.phone) body.append("phone", formData.phone);
      if (formData.company) body.append("company", formData.company);
      if (formData.profileImage) body.append("profileImage", formData.profileImage);

      const url = editingContact ? `${API_BASE}/api/contacts/${editingContact.id}` : `${API_BASE}/api/contacts`;
      const method = editingContact ? "PUT" : "POST";

      const res = await fetch(url, { method, body });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }

      toast.success(editingContact ? "Contact updated" : "Contact added");
      await fetchContacts();
      resetForm();
      setIsModalOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save contact");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone || "",
      email: contact.email,
      company: contact.company || "",
      profileImage: null,
    });
    setPreviewImage(imgSrc(contact.profileImage));
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this contact?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/contacts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Failed to delete contact`);
      toast.success("Contact deleted");
      await fetchContacts();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete contact");
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0B1120] text-slate-300' : 'bg-gray-50 text-gray-700'}`}>
      <main className={`p-4 ${mainMarginClass} h-auto pt-20 transition-all duration-300`}>
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Contacts Management
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Manage your address book and contact details
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-cyan-400' : 'text-gray-400 group-focus-within:text-cyan-600'}`} />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-xl text-sm border transition-all outline-none w-full md:w-64 ${
                  isDark 
                    ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                }`}
              />
            </div>
            
            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                isDark 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 shadow-lg shadow-cyan-500/10' 
                  : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-600/20'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Contact
            </button>
          </div>
        </div>

        {/* Contacts Table Card */}
        <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all ${
          isDark ? 'bg-white/5 border-white/10 shadow-2xl' : 'bg-white border-gray-200 shadow-xl'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Profile</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Phone</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Company</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                {loading && contacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium animate-pulse">Loading contacts...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-50">
                        <FaUserCircle className="w-12 h-12" />
                        <p className="text-sm font-medium">No contacts found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => (
                    <tr key={contact.id} className={`group transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <div className="relative">
                          {contact.profileImage ? (
                            <img
                              src={imgSrc(contact.profileImage) || ""}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-cyan-500/50 transition-all"
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-white/10 group-hover:ring-cyan-500/50 transition-all ${isDark ? 'bg-white/5 text-slate-500' : 'bg-gray-100 text-gray-400'}`}>
                              <User className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {contact.firstName} {contact.lastName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3.5 h-3.5 opacity-50" />
                          {contact.phone || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 opacity-50" />
                          {contact.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                          isDark 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                            : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          <Building2 className="w-3 h-3" />
                          {contact.company || "Personal"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(contact)}
                            className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-cyan-500/20 text-cyan-400' : 'hover:bg-cyan-50 text-cyan-600'}`}
                            title="Edit Contact"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(contact.id)}
                            className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                            title="Delete Contact"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0B1120]/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            
            <div className={`relative w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl animate-in fade-in zoom-in duration-200 ${
              isDark ? 'bg-[#151B2B] border-white/10' : 'bg-white border-gray-200'
            }`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {editingContact ? 'Edit Contact' : 'New Contact'}
                  </h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Image Upload Area */}
                  <div className="flex flex-col items-center gap-3 py-2">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      {previewImage ? (
                        <img src={previewImage} alt="Preview" className="w-24 h-24 rounded-2xl object-cover ring-2 ring-cyan-500/50 shadow-xl" />
                      ) : (
                        <div className={`w-24 h-24 rounded-2xl flex items-center justify-center border-2 border-dashed transition-all ${isDark ? 'bg-white/5 border-white/10 hover:border-cyan-500/50 text-slate-500' : 'bg-gray-50 border-gray-200 hover:border-cyan-500 text-gray-400'}`}>
                          <Plus className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                        <p className="text-[10px] text-white font-bold uppercase tracking-wider">Change</p>
                      </div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    <p className="text-xs text-slate-500 font-medium">Upload profile photo</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">First Name</label>
                      <input
                        required
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all ${
                          isDark ? 'bg-white/5 border-white/10 text-white focus:border-cyan-500/50' : 'bg-gray-50 border-gray-200 focus:border-cyan-500'
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Last Name</label>
                      <input
                        required
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all ${
                          isDark ? 'bg-white/5 border-white/10 text-white focus:border-cyan-500/50' : 'bg-gray-50 border-gray-200 focus:border-cyan-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Email Address</label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all ${
                        isDark ? 'bg-white/5 border-white/10 text-white focus:border-cyan-500/50' : 'bg-gray-50 border-gray-200 focus:border-cyan-500'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Phone Number</label>
                      <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all ${
                          isDark ? 'bg-white/5 border-white/10 text-white focus:border-cyan-500/50' : 'bg-gray-50 border-gray-200 focus:border-cyan-500'
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Company</label>
                      <input
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all ${
                          isDark ? 'bg-white/5 border-white/10 text-white focus:border-cyan-500/50' : 'bg-gray-50 border-gray-200 focus:border-cyan-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2 ${
                        isDark 
                          ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30' 
                          : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-600/20'
                      }`}
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : <Check className="w-4 h-4" />}
                      {editingContact ? 'Update Contact' : 'Save Contact'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Contacts;
