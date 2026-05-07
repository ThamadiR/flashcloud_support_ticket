import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  Verified,
  Ticket
} from 'lucide-react';
import toast from 'react-hot-toast';
const Profile: React.FC = () => {
  const { isDark } = useTheme();
  const { isDrawerOpen } = useDrawer();
  const mainMarginClass = isDrawerOpen ? "md:ml-64" : "md:ml-20";


  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState('/profile_avatar_user_1778052147481.png');

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = (storedUser?.role || 'Non-Admin').toUpperCase();

  const [formData, setFormData] = useState({
    firstName: storedUser?.firstName || storedUser?.name || storedUser?.userName?.split(' ')[0] || '',
    lastName: storedUser?.lastName || storedUser?.userName?.split(' ')[1] || '',
    email: storedUser?.email || storedUser?.Email || '',
    username: storedUser?.username || storedUser?.userName || '',
  });

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

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const userId = storedUser.id || storedUser.userId;
      if (!userId || userId === 'undefined') {
        throw new Error("User ID not found. Please log in again.");
      }

      const payload = {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        img: profileImage
      };
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

      // Update local storage with new data
      const updatedUser = {
        ...storedUser,
        userName: formData.username,
        Email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast.success('Profile updated successfully!');
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
          // Max dimensions for profile pic
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

          // Compress to JPEG with 0.8 quality
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
        {/* Profile Info Overlay */}
        <div className="relative px-6 md:px-10 pb-8 pt-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
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
              <button className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${isDark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'}`}>
                <Ticket size={18} />
                View My Tickets
              </button>
            </div>
          </div>

          {/* Name and Basic Info */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                @{formData.username || 'username'}
              </h1>
              <div className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                {userRole === 'ADMIN' ? 'Admin' : 'Non-Admin'}
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {formData.email || storedUser?.email || storedUser?.Email || 'No email provided'}
            </p>
          </div>


          {/* Edit Form */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Name</label>
                <div className="md:col-span-2 flex gap-3">
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`flex-1 px-4 py-3 rounded-xl border text-[13px] font-bold outline-none transition-all ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-400'}`}
                    placeholder="First name"
                  />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`flex-1 px-4 py-3 rounded-xl border text-[13px] font-bold outline-none transition-all ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-400'}`}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Email address</label>
                <div className="md:col-span-2 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border text-[13px] font-bold outline-none transition-all ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-400'}`}
                    placeholder="Enter email address"
                  />
                </div>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Username</label>
                <div className="md:col-span-2 relative">
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border text-[13px] font-bold outline-none transition-all ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-400'}`}
                    placeholder="Enter username"
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
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
