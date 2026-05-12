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
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow dark:border dark:bg-gray-800 dark:border-gray-700">
        <div className="space-y-6">
          <div className="text-center">
            <img className="mx-auto" src={FlashLogo} alt="Flowbite" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-4">
              Sign in to your account
            </h1>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <Label htmlFor="email" />
              <TextInput
                id="email"
                type="email"
                placeholder="name@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password" />
              <TextInput
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember">Remember me</Label>
              </div>
              <a
                href="#"
                className="text-sm text-primary-600 hover:underline dark:text-primary-500"
              >
                Forgot password?
              </a>
            </div>

            <Button type="submit" className="w-full">
              Sign in
            </Button>

            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              Don’t have an account yet?{" "}
              <Link
                to="/signup"
                className="font-medium text-primary-600 hover:underline dark:text-primary-500"
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
