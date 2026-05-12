import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Checkbox, Label, TextInput } from "flowbite-react";
import { API_BASE_URL } from '../config/api';
import FlashLogo from "../../src/assets/assets/logo.png";

export default function Login({ onLogin }: { onLogin: (token: string, user: any) => void }) {
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
    <section className="bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-black min-h-screen flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#0B0E14] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-white/5 overflow-hidden transition-all duration-500">
        <div className="p-8 space-y-8 md:p-10">
          <div className="text-center">
            <img className="mx-auto" src={FlashLogo} alt="Flowbite" />
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white mt-6">
              Sign in to your account
            </h1>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="block text-[0.7rem] font-bold uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-bold outline-none transition-all focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/5"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[0.7rem] font-bold uppercase tracking-widest text-gray-400 ml-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-bold outline-none transition-all focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/5"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" className="rounded-md border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                <Label htmlFor="remember" className="text-sm font-medium text-gray-600 cursor-pointer">Remember me</Label>
              </div>
              <a
                href="#"
                className="text-sm font-bold text-cyan-600 hover:text-cyan-700 transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm uppercase tracking-widest transition-all shadow-lg shadow-cyan-600/20 active:scale-[0.98]"
            >
              Sign in
            </button>

            <p className="text-sm text-center text-gray-400 font-medium pt-2">
              Don’t have an account yet?{" "}
              <Link
                to="/signup"
                className="font-bold text-cyan-600 hover:text-cyan-700 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
