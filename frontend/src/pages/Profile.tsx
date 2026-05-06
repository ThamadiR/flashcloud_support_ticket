
import React, { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useDrawer } from '../context/DrawerContext';
import { 
  CheckCircle2, 
  Mail, 
  User, 
  Globe, 
  Archive, 
  ShoppingCart, 
  X,
  Camera,
  Verified
} from 'lucide-react';

const Profile: React.FC = () => {
  const { isDark } = useTheme();
  const { isDrawerOpen } = useDrawer();
  const mainMarginClass = isDrawerOpen ? "md:ml-64" : "md:ml-20";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState('/profile_avatar_user_1778052147481.png');

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = (storedUser?.role || 'Non-Admin').toUpperCase();

  // Initialize with actual session data
  const [formData, setFormData] = useState({
    firstName: storedUser?.fname || storedUser?.username || 'User',
    lastName: storedUser?.lname || '',
    email: storedUser?.email || storedUser?.Email || '',
    country: 'United States',
    username: storedUser?.username || ''
  });

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`transition-all duration-300 ${mainMarginClass} pt-20 pb-12 px-4 md:px-8`}>
      <div className={`max-w-3xl mx-auto rounded-3xl overflow-hidden shadow-2xl ${isDark ? 'bg-[#111318] border border-white/10' : 'bg-white border border-gray-200'}`}>
        
        {/* Banner Section */}
        <div className="relative h-48 md:h-56">
          <img 
            src="/profile_banner_clouds_1778052124182.png" 
            alt="Banner" 
            className="w-full h-full object-cover"
          />
          <button className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Profile Info Overlay */}
        <div className="relative px-6 md:px-10 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between -mt-12 md:-mt-16 mb-8 gap-4">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#111318] overflow-hidden shadow-xl bg-[#1a1d23]">
                <img 
                  src={profileImage} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-blue-500 rounded-full p-1 border-2 border-[#111318]">
                <CheckCircle2 size={14} className="text-white fill-white" />
              </div>
              <button 
                onClick={handleImageClick}
                className="absolute -bottom-1 -left-1 bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm transition-all border border-white/10 z-10"
              >
                <Camera size={14} className="text-white" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            <div className="flex gap-3">
              <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isDark ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10' : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'}`}>
                <Archive size={16} />
                Archive
              </button>
              <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isDark ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10' : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'}`}>
                View orders
              </button>
            </div>
          </div>

          {/* Name and Basic Info */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                {formData.firstName} {formData.lastName}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                {userRole === 'ADMIN' ? 'Admin' : 'Non-Admin'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {formData.email || storedUser?.email || storedUser?.Email || 'No email provided'}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 py-6 border-y border-white/5">
            <StatItem label="First seen" value="1 Mar, 2025" isDark={isDark} />
            <StatItem label="First purchase" value="4 Mar, 2025" isDark={isDark} />
            <StatItem label="Revenue" value="$118.00" isDark={isDark} />
            <StatItem label="MRR" value="$0.00" isDark={isDark} />
          </div>

          {/* Edit Form */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Name</label>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={formData.firstName}
                    className={`flex-1 px-4 py-3 rounded-xl border text-[13px] font-bold outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-blue-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-400'}`}
                    placeholder="First name"
                  />
                  <input 
                    type="text" 
                    value={formData.lastName}
                    className={`flex-1 px-4 py-3 rounded-xl border text-[13px] font-bold outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-blue-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-400'}`}
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Email address</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <Mail size={16} />
                </div>
                <input 
                  type="email" 
                  value={formData.email}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border text-[13px] font-bold outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-blue-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-400'}`}
                  placeholder="Email"
                />
              </div>
              <div className="flex items-center gap-2 mt-2 ml-1">
                <Verified size={14} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Verified 2 Jan, 2025</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Country</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                   <span className="text-lg">🇺🇸</span>
                </div>
                <select 
                  className={`w-full pl-12 pr-10 py-3 rounded-xl border text-[13px] font-bold outline-none appearance-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-blue-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-400'}`}
                >
                  <option>United States</option>
                  <option>United Kingdom</option>
                  <option>Canada</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <Globe size={16} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Username</label>
              <div className="flex items-stretch rounded-xl overflow-hidden border border-white/10">
                <div className={`px-4 py-3 flex items-center text-[13px] font-medium ${isDark ? 'bg-white/5 text-gray-500 border-r border-white/10' : 'bg-gray-100 text-gray-500 border-r border-gray-200'}`}>
                  untitledui.com/
                </div>
                <div className="flex-grow relative">
                  <input 
                    type="text" 
                    value={formData.username}
                    className={`w-full h-full px-4 py-3 text-[13px] font-bold outline-none transition-all ${isDark ? 'bg-white/5 text-white focus:bg-white/10' : 'bg-white text-gray-900 focus:bg-gray-50'}`}
                    placeholder="Username"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <CheckCircle2 size={16} className="text-blue-500 fill-blue-500/10" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 mt-12 pt-8 border-t border-white/5">
            <button className={`px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              Cancel
            </button>
            <button className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold shadow-lg shadow-blue-600/20 transition-all">
              Save changes
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

const StatItem = ({ label, value, isDark }: { label: string, value: string, isDark: boolean }) => (
  <div className="space-y-1">
    <p className="text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-widest">{label}</p>
    <p className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
  </div>
);

export default Profile;
