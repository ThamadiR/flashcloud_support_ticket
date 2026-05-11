import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Label, Alert, Spinner } from 'flowbite-react';
import { Sun, Moon } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { useDraggablePosition } from '../hooks/useDraggablePosition';

export default function Login({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const { isDark, toggleTheme } = useTheme();
    const { position, isDragging, handlePointerDown, handleClick, elementRef } = useDraggablePosition(24, 24);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const registeredMsg = searchParams.get('registered') ? 'Registration successful! Please login.' : '';

  const checkExactEmailStructure = (val: string) => {
    if (!val) {
      setEmailError('');
      return false;
    }
    // Strict structural check: Valid local characters + exact @gmail.com suffix
    const strictGmailStructure = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!strictGmailStructure.test(val)) {
      setEmailError('Invalid structure. Must be an exact @gmail.com address.');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Final check before hitting the server
    if (!checkExactEmailStructure(email)) return;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      setError('Only @gmail.com addresses are allowed');
      return;
    }
    if (!password) {
      setError('Password cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        const message = data.error || data.message || 'Login failed';
        setError(message);
        toast.error(message);
        return;
      }

      toast.success('Login successful!');
      onLogin(data.token, data.user);
    } catch (err: any) {
      const message = err.message || 'An unexpected error occurred';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`theme-page flex min-h-screen items-center justify-center relative overflow-y-auto py-8 font-sans ${isDark ? 'bg-[#09090B]' : 'bg-white'}`}>
      {/* Deep Space Background Array with Starry Dots */}
      <div className="absolute inset-0 z-0">
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

      {/* Draggable Theme Toggle Button */}
      <button
        ref={elementRef}
        onPointerDown={handlePointerDown}
        onClick={() => {
          if (handleClick()) {
            toggleTheme();
          }
        }}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 999,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={`p-3 rounded-full flex items-center justify-center transition-all ${isDark ? 'bg-[#1A1A1E] hover:bg-[#25252D] border border-white/10' : 'bg-blue-400 hover:bg-blue-500 border border-blue-400'}`}
      >
        {isDark ? (
          <Sun size={20} className="text-yellow-400" />
        ) : (
          <Moon size={20} className="text-white" />
        )}
      </button>

      {/* The Central Tech Card with Blue Neon Glow */}
      <div className={`z-10 w-full max-w-[440px] p-8 sm:p-10 rounded-[24px] mx-4 relative overflow-hidden ${
        isDark
          ? 'bg-[#121214] border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.25)]'
          : 'bg-white border border-blue-200 shadow-[0_0_50px_rgba(59,130,246,0.15)]'
      }`}>
        
        {/* Subtle Top Glow Line */}
        <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent to-transparent ${
          isDark ? 'via-blue-500/30' : 'via-blue-400/40'
        }`}></div>

        <div className="mb-8">
          <h2 className={`text-[1.6rem] font-semibold mb-1.5 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Login to System</h2>
          <p className={`text-[14px] ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Secure User Authentication Portal</p>
        </div>

        {registeredMsg && !error && <Alert color="success" className={`mb-6 rounded-xl relative z-20 border ${isDark ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-green-300 bg-green-50 text-green-700'}`}>{registeredMsg}</Alert>}
        {error && <Alert color="failure" className={`mb-6 rounded-xl relative z-20 border ${isDark ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-red-300 bg-red-50 text-red-700'}`}>{error}</Alert>}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <div className="mb-1.5">
              <Label htmlFor="email" className={`text-[13px] font-medium tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Email</Label>
            </div>
            <div className="relative">
              <input 
                id="email" 
                type="email" 
                placeholder="enter your email address..." 
                required 
                value={email} 
                onChange={e => { setEmail(e.target.value); checkExactEmailStructure(e.target.value); }} 
                onBlur={() => checkExactEmailStructure(email)}
                className={`rounded-xl block w-full px-5 py-3.5 text-[14px] outline-none transition-all ${
                  emailError
                    ? isDark
                      ? 'bg-[#09090B] border border-red-500/50 text-gray-200 placeholder-gray-600 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                      : 'bg-red-50 border border-red-500 text-gray-900 placeholder-red-300 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                    : isDark
                      ? 'bg-[#09090B] border border-white/5 text-gray-200 placeholder-gray-600 focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                      : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                }`}
              />
            </div>
            {emailError && <span className="font-medium text-red-400 text-xs mt-2 block">{emailError}</span>}
          </div>

          <div>
            <div className="mb-1.5">
              <Label htmlFor="password" className={`text-[13px] font-medium tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Password</Label>
            </div>
            <input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className={`rounded-xl block w-full px-5 py-3.5 text-[15px] tracking-[0.2em] outline-none transition-all ${
                isDark
                  ? 'bg-[#09090B] border border-white/5 text-gray-200 placeholder-gray-600 focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                  : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)]'
              }`}
            />
          </div>

          <button 
            type="submit" 
            className={`w-full mt-2 font-medium text-[15px] rounded-xl py-3.5 border transition-all transform inline-flex items-center justify-center ${
              isDark
                ? 'bg-gradient-to-b from-[#2A2A30] to-[#18181A] text-gray-200 border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:brightness-110 active:brightness-90'
                : 'bg-blue-500 text-white border-blue-600 shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover:bg-blue-600 active:bg-blue-700'
            }`}
            disabled={loading}
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Spinner size="sm" light={true} />
                <span>Logging in...</span>
              </span>
            ) : (
              <span>Login with email</span>
            )}
          </button>

          {/* <p className={`text-[13px] text-center mt-2 ${
            isDark ? 'text-gray-600' : 'text-gray-500'
          }`}>
            or register <Link to="/register" className={`font-medium transition ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-blue-600 hover:text-blue-700'
            }`}>new account</Link>
          </p> */}
        </form>
      </div>
    </div>
  );
}
