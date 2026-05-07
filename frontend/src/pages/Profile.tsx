import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useDrawer } from '../context/DrawerContext';
import {
  X,
  Camera,
  Verified,
  Ticket,
  Edit2,
  ChevronDown,
  Search,
  Check,
  Mail,
  User,
  Globe,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { COUNTRY_CODE_OPTIONS } from '../config/countryCodes';

const Profile: React.FC = () => {
  const { isDark } = useTheme();
  const { isDrawerOpen } = useDrawer();
  const navigate = useNavigate();
  const mainMarginClass = isDrawerOpen ? "md:ml-64" : "md:ml-20";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [profileImage, setProfileImage] = useState(storedUser.img || storedUser.avatarUrl || '/profile_avatar_user_1778052147481.png');
  const userRole = (storedUser?.role || 'Non-Admin').toUpperCase();

  const [formData, setFormData] = useState({
    firstName: storedUser?.firstName || storedUser?.name || storedUser?.userName?.split(' ')[0] || '',
    lastName: storedUser?.lastName || storedUser?.userName?.split(' ')[1] || '',
    email: storedUser?.email || storedUser?.Email || '',
    username: storedUser?.username || storedUser?.userName || '',
    contactNo: storedUser?.contactNo || '',
    country: storedUser?.country || '',
    countryCode: storedUser?.countryCode || '',
    password: '',
    confirmPassword: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showCountrySearch, setShowCountrySearch] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = storedUser.id || storedUser.userId;
        if (!userId || userId === 'undefined') {
          console.warn("No valid user ID found in session");
          return;
        }

        const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Server returned non-JSON response");
          }
          const data = await response.json();
          const user = data.user || data;
          setFormData({
            firstName: user.firstName || user.name || '',
            lastName: user.lastName || '',
            email: user.email || user.Email || '',
            username: user.username || user.userName || '',
            contactNo: user.contactNo || '',
            country: user.country || '',
            countryCode: user.countryCode || '',
            password: '',
            confirmPassword: '',
          });
          if (user.img || user.avatarUrl) {
            setProfileImage(user.img || user.avatarUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const userId = storedUser.id || storedUser.userId;
      if (!userId || userId === 'undefined') {
        throw new Error("User ID not found. Please log in again.");
      }

      const phoneRegex = /^(\+\d+)?\d{9}$/;
      if (formData.contactNo && !phoneRegex.test(formData.contactNo.trim().replace(/\s/g, ''))) {
        throw new Error('Contact number must be exactly 9 digits (excluding country code)');
      }

      if (formData.password && formData.password !== formData.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      const payload: any = {
        username: formData.username,
        email: formData.email,
        contactNo: formData.contactNo,
        firstName: formData.firstName,
        lastName: formData.lastName,
        img: profileImage,
        country: formData.country,
        countryCode: formData.countryCode
      };

      if (formData.password) {
        payload.password = formData.password;
      }
      const payloadSize = new Blob([JSON.stringify(payload)]).size;
      console.log(`Sending profile update, payload size: ${payloadSize} bytes (${(payloadSize / 1024 / 1024).toFixed(2)} MB)`);

      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update profile');
        }
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      const updatedUser = {
        ...storedUser,
        userName: formData.username,
        Email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        contactNo: formData.contactNo,
        country: formData.country,
        countryCode: formData.countryCode
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast.success('Profile updated successfully!');
      setIsEditing(false);
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (error: any) {
      toast.error(error.message || 'Error updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setProfileImage(dataUrl);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`transition-all duration-300 ${mainMarginClass} pt-20 pb-12 px-4 md:px-8`}>
      <div className={`max-w-3xl mx-auto rounded-3xl overflow-hidden shadow-2xl ${isDark ? 'bg-[#111318] border border-white/10' : 'bg-white border border-gray-200'}`}>
        <div className="relative px-6 md:px-10 pb-8 pt-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#111318] overflow-hidden shadow-xl bg-[#1a1d23] group">
                <img
                  src={profileImage}
                  alt="Avatar"
                  className="w-full h-full object-cover transition-opacity group-hover:opacity-75"
                />
                {isEditing && (
                  <button
                    onClick={handleImageClick}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                  >
                    <Camera size={24} className="text-white" />
                  </button>
                )}
              </div>
              <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-blue-500 rounded-full p-1 border-2 border-[#111318]">
                <Verified size={14} className="text-white fill-white" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                onClick={() => navigate('/tickets')}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 ${isDark ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20' : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'}`}
              >
                <Ticket size={14} />
                View My Tickets
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 ${isEditing ? (isDark ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-700 hover:bg-rose-100') : (isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-900 hover:bg-gray-200')}`}
              >
                {isEditing ? <X size={14} /> : <Edit2 size={14} />}
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                {formData.firstName} {formData.lastName}
              </h1>
              <div className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                {userRole === 'ADMIN' ? 'Admin' : 'Non-Admin'}
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {formData.email || 'No email provided'}
            </p>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* First Name */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`w-full px-5 py-3.5 rounded-2xl border text-sm font-bold outline-none transition-all ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-cyan-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-400'}`}
                  />
                ) : (
                  <div className={`px-5 py-3.5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5 text-gray-300' : 'bg-gray-50/50 border-gray-100 text-gray-700'} font-bold text-sm`}>
                    {formData.firstName || 'Not specified'}
                  </div>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`w-full px-5 py-3.5 rounded-2xl border text-sm font-bold outline-none transition-all ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-cyan-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-400'}`}
                  />
                ) : (
                  <div className={`px-5 py-3.5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5 text-gray-300' : 'bg-gray-50/50 border-gray-100 text-gray-700'} font-bold text-sm`}>
                    {formData.lastName || 'Not specified'}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-5 py-3.5 rounded-2xl border text-sm font-bold outline-none transition-all ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-cyan-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-400'}`}
                  />
                ) : (
                  <div className={`px-5 py-3.5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5 text-gray-300' : 'bg-gray-50/50 border-gray-100 text-gray-700'} font-bold text-sm`}>
                    {formData.email}
                  </div>
                )}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Username</label>
                <div className={`px-5 py-3.5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5 text-gray-500' : 'bg-gray-50/50 border-gray-100 text-gray-400'} font-bold text-sm flex items-center gap-2`}>
                  <span className="opacity-50">@</span>
                  {formData.username}
                  <span className="ml-auto text-[10px] uppercase tracking-tighter opacity-50">Read-only</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Number */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Contact Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.contactNo}
                    onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                    className={`w-full px-5 py-3.5 rounded-2xl border text-sm font-bold outline-none transition-all ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-cyan-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-400'}`}
                    placeholder="+1 (555) 000-0000"
                  />
                ) : (
                  <div className={`px-5 py-3.5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5 text-gray-300' : 'bg-gray-50/50 border-gray-100 text-gray-700'} font-bold text-sm`}>
                    {formData.contactNo || 'Not specified'}
                  </div>
                )}
              </div>

              {/* Country Selector */}
              <div className="space-y-2 relative">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Country / Region</label>
                {isEditing ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountrySearch(!showCountrySearch)}
                      className={`w-full px-5 py-3.5 rounded-2xl border text-sm font-bold outline-none transition-all flex items-center justify-between ${isDark ? 'bg-black/40 border-white/10 text-white hover:border-cyan-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 hover:border-cyan-400'}`}
                    >
                      <span className="flex items-center gap-3">
                        {formData.country ? (
                          <>
                            <img 
                              src={`https://flagcdn.com/w20/${formData.countryCode?.toLowerCase() || 'un'}.png`} 
                              alt="" 
                              className="w-5 h-auto rounded-sm opacity-80"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                            {formData.country}
                          </>
                        ) : 'Select a country'}
                      </span>
                      <ChevronDown size={16} className={`transition-transform duration-200 ${showCountrySearch ? 'rotate-180' : ''}`} />
                    </button>

                    {showCountrySearch && (
                      <div className={`absolute z-50 left-0 right-0 mt-2 p-2 rounded-2xl border shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? 'bg-[#0F172A] border-white/10' : 'bg-white border-gray-200'}`}>
                        <div className="relative mb-2">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                          <input
                            type="text"
                            placeholder="Search countries..."
                            value={countrySearchQuery}
                            onChange={(e) => setCountrySearchQuery(e.target.value)}
                            className={`w-full pl-9 pr-4 py-2 text-xs font-bold rounded-xl outline-none border ${isDark ? 'bg-black/40 border-white/5 text-white focus:border-cyan-500/50' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-cyan-400'}`}
                            autoFocus
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar no-scrollbar">
                          {COUNTRY_CODE_OPTIONS.filter(c => c.name.toLowerCase().includes(countrySearchQuery.toLowerCase())).map((country) => (
                            <button
                              key={country.iso}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, country: country.name, countryCode: country.iso });
                                setShowCountrySearch(false);
                                setCountrySearchQuery('');
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${formData.country === country.name ? (isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-700') : (isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-50')}`}
                            >
                              <span className="flex items-center gap-3">
                                <img src={`https://flagcdn.com/w20/${country.iso.toLowerCase()}.png`} alt="" className="w-5 h-auto rounded-sm" />
                                {country.name}
                              </span>
                              {formData.country === country.name && <Check size={14} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`px-5 py-3.5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5 text-gray-300' : 'bg-gray-50/50 border-gray-100 text-gray-700'} font-bold text-sm flex items-center gap-3`}>
                    {formData.country ? (
                      <>
                        <img 
                          src={`https://flagcdn.com/w20/${formData.countryCode?.toLowerCase() || 'un'}.png`} 
                          alt="" 
                          className="w-5 h-auto rounded-sm opacity-80"
                        />
                        {formData.country}
                      </>
                    ) : (
                      <span className="italic opacity-50">Not specified</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Password Change Section (Only in Edit Mode) */}
            {isEditing && (
              <div className="mt-10 pt-10 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3 mb-8">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Security Settings</h3>
                    <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Update your account password</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* New Password */}
                  <div className="space-y-3">
                    <label className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'} ml-1`}>
                      New Password
                    </label>
                    <div className="relative group">
                      <div className={`absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors duration-300 ${isDark ? 'text-gray-500 group-focus-within:text-cyan-400' : 'text-gray-400 group-focus-within:text-cyan-500'}`}>
                        <Lock size={16} />
                      </div>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border transition-all duration-300 outline-none font-bold text-sm ${isDark ? 'bg-white/5 border-white/5 text-white focus:border-cyan-500/50 focus:bg-white/10' : 'bg-gray-50/50 border-gray-100 text-gray-900 focus:border-cyan-500/50 focus:bg-white'}`}
                        placeholder="Leave blank to keep current"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className={`absolute inset-y-0 right-0 pr-5 flex items-center transition-colors duration-300 ${isDark ? 'text-gray-500 hover:text-cyan-400' : 'text-gray-400 hover:text-cyan-500'}`}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-3">
                    <label className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'} ml-1`}>
                      Confirm New Password
                    </label>
                    <div className="relative group">
                      <div className={`absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors duration-300 ${isDark ? 'text-gray-500 group-focus-within:text-cyan-400' : 'text-gray-400 group-focus-within:text-cyan-500'}`}>
                        <ShieldCheck size={16} />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border transition-all duration-300 outline-none font-bold text-sm ${isDark ? 'bg-white/5 border-white/5 text-white focus:border-cyan-500/50 focus:bg-white/10' : 'bg-gray-50/50 border-gray-100 text-gray-900 focus:border-cyan-500/50 focus:bg-white'}`}
                        placeholder="Re-enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`absolute inset-y-0 right-0 pr-5 flex items-center transition-colors duration-300 ${isDark ? 'text-gray-500 hover:text-cyan-400' : 'text-gray-400 hover:text-cyan-500'}`}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {isEditing && (
            <div className="flex justify-end gap-3 mt-12 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
                }}
                className={`px-8 py-3 rounded-[1.25rem] font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isLoading}
                className="px-10 py-3 rounded-[1.25rem] bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-cyan-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : 'Save changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
